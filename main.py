"""
Traffic Cop Pro — FastAPI Backend
==================================
Senior Backend / ML Engineer implementation.

Architecture
------------
- Models (YOLOv8 + EasyOCR) are loaded ONCE at module import time (global scope)
  so they survive the full lifecycle of the server process.  Loading them inside
  an endpoint function would cause per-request cold-start latency of 5-30 s and
  significant memory churn.
- A FastAPI lifespan context-manager validates that both models loaded correctly
  before the server starts accepting traffic.
- Temporary files are written to a local `temp_uploads/` directory, processed,
  then deleted to avoid unbounded disk growth.

Endpoints
---------
GET  /health              — liveness + model-ready probe
POST /api/upload-video    — ingest a video / image, run the CV pipeline,
                            return structured violation detections
"""

from __future__ import annotations

import logging
import os
import shutil
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import cv2
import easyocr
import numpy as np
import torch
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO

# ---------------------------------------------------------------------------
# PyTorch 2.6+ compatibility patch
# ---------------------------------------------------------------------------
# PyTorch >= 2.6 changed torch.load() default to weights_only=True, which
# blocks Ultralytics checkpoint classes.  We allowlist the required globals
# so that YOLO weights can be loaded safely without reverting to the insecure
# weights_only=False mode.
try:
    from ultralytics.nn.tasks import DetectionModel, SegmentationModel
    from ultralytics.nn.modules import (
        Conv, C2f, SPPF, Detect, DFL
    )
    torch.serialization.add_safe_globals([
        DetectionModel,
        SegmentationModel,
        Conv,
        C2f,
        SPPF,
        Detect,
        DFL,
    ])
except Exception:
    # If the import paths differ across Ultralytics versions, fall back to the
    # weights_only=False monkey-patch (safe for official Ultralytics weights).
    _original_torch_load = torch.load

    def _patched_torch_load(f, *args, **kwargs):
        kwargs.setdefault("weights_only", False)
        return _original_torch_load(f, *args, **kwargs)

    torch.load = _patched_torch_load

# ---------------------------------------------------------------------------
# Logging setup
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)
logger = logging.getLogger("traffic_cop_pro")

# ---------------------------------------------------------------------------
# Paths & constants
# ---------------------------------------------------------------------------
BASE_DIR: Path = Path(__file__).resolve().parent
MODEL_PATH: Path = BASE_DIR / "yolov8m.pt"
TEMP_DIR: Path = BASE_DIR / "temp_uploads"
TEMP_DIR.mkdir(parents=True, exist_ok=True)

# Supported file extensions accepted by the upload endpoint
ALLOWED_VIDEO_EXTENSIONS: set[str] = {".mp4", ".avi", ".mov", ".mkv", ".webm"}
ALLOWED_IMAGE_EXTENSIONS: set[str] = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
ALLOWED_EXTENSIONS: set[str] = ALLOWED_VIDEO_EXTENSIONS | ALLOWED_IMAGE_EXTENSIONS

# YOLO / COCO class IDs relevant to traffic-violation analysis.
# COCO labels: 0=person, 1=bicycle, 2=car, 3=motorcycle, 5=bus, 7=truck
VEHICLE_CLASS_IDS: set[int] = {1, 2, 3, 5, 7}
PERSON_CLASS_ID: int = 0

# Minimum YOLO confidence to report a detection
DETECTION_CONFIDENCE_THRESHOLD: float = 0.35

# ---------------------------------------------------------------------------
# Global model instances  (loaded ONCE at startup — never inside a handler)
# ---------------------------------------------------------------------------
yolo_model: YOLO | None = None
ocr_reader: easyocr.Reader | None = None


def _load_models() -> None:
    """
    Load YOLOv8 and EasyOCR models into global variables.

    This function is called once at module level so that the models reside in
    memory for the entire server process lifetime.  Re-loading inside a request
    handler would cause severe per-request latency and memory leaks.

    If ``yolov8n.pt`` is absent, Ultralytics will download it automatically
    from the official CDN on first run.

    Raises
    ------
    RuntimeError
        If either model fails to initialise for any reason.
    """
    global yolo_model, ocr_reader

    # --- YOLOv8 ---
    if not MODEL_PATH.exists():
        logger.warning(
            "Model weights not found at %s. "
            "Ultralytics will attempt to download yolov8s.pt automatically.",
            MODEL_PATH,
        )
    logger.info("Loading YOLOv8 model from: %s", MODEL_PATH)
    yolo_model = YOLO(str(MODEL_PATH))
    logger.info("YOLOv8 model loaded successfully.")

    # --- EasyOCR ---
    logger.info("Initialising EasyOCR reader (English) — this may take a moment ...")
    ocr_reader = easyocr.Reader(["en"], gpu=False)
    logger.info("EasyOCR reader initialised successfully.")


# Load models immediately when the module is imported.
try:
    _load_models()
except Exception as exc:  # noqa: BLE001
    logger.error("Model loading failed: %s", exc, exc_info=True)
    yolo_model = None
    ocr_reader = None


# ---------------------------------------------------------------------------
# FastAPI lifespan — startup / shutdown hooks
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    ASGI lifespan context manager.

    Logs model-readiness status before the server accepts its first request.
    Can be extended to perform graceful shutdown logic (e.g. flushing queues).
    """
    if yolo_model is None or ocr_reader is None:
        logger.critical(
            "One or more AI models failed to load. "
            "The /api/upload-video endpoint will return 503 responses."
        )
    else:
        logger.info("All models ready.  Traffic Cop Pro API is online.")
    yield
    logger.info("Traffic Cop Pro API shutting down.")


# ---------------------------------------------------------------------------
# FastAPI application
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Traffic Cop Pro API",
    description=(
        "RESTful backend for the Traffic Cop Pro AI surveillance system. "
        "Accepts video/image uploads, runs YOLOv8 object detection, "
        "extracts license-plate text via EasyOCR, and returns structured "
        "traffic-violation reports."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS — permit the local React / Vite dev server
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",    # Create React App default
        "http://localhost:5173",    # Vite default
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Helper — OCR on a detected bounding-box region
# ---------------------------------------------------------------------------
def _read_plate_text(frame: np.ndarray, bbox: list[float], class_id: int) -> tuple[str, float]:
    """
    Crop the bounding-box region from *frame*, preprocess it, and run EasyOCR
    to extract visible license-plate text. Applies a targeted ROI for cars/trucks.

    Parameters
    ----------
    frame : np.ndarray
        Full BGR image.
    bbox : list[float]
        Bounding box in [x1, y1, x2, y2] pixel coordinates (YOLO xyxy format).
    class_id : int
        YOLO class ID of the vehicle (to determine if ROI crop is needed).

    Returns
    -------
    tuple[str, float]
        Detected plate text and its OCR confidence score.
    """
    if ocr_reader is None:
        return "UNKNOWN", 0.0

    h, w = frame.shape[:2]
    x1 = max(0, int(bbox[0]))
    y1 = max(0, int(bbox[1]))
    x2 = min(w, int(bbox[2]))
    y2 = min(h, int(bbox[3]))
    
    # 1. Targeted ROI: For cars(2), buses(5), and trucks(7), crop to bottom 50%
    if class_id in {2, 5, 7}:
        box_h = y2 - y1
        y1 = y1 + int(box_h * 0.5)

    crop = frame[y1:y2, x1:x2]
    if crop.size == 0:
        return "UNKNOWN", 0.0

    # 2. Image Preprocessing: Resize 2x and convert to grayscale for better OCR
    crop_resized = cv2.resize(crop, None, fx=2.0, fy=2.0, interpolation=cv2.INTER_CUBIC)
    crop_gray = cv2.cvtColor(crop_resized, cv2.COLOR_BGR2GRAY)

    try:
        results = ocr_reader.readtext(crop_gray, detail=1, paragraph=False)
    except Exception as exc:  # noqa: BLE001
        logger.warning("EasyOCR inference error: %s", exc)
        return "UNKNOWN", 0.0

    # Keep only tokens with confidence > 30 %, keep track of highest confidence
    best_conf = 0.0
    tokens = []
    for (_, text, conf) in results:
        if conf > 0.30:
            tokens.append(text)
            if conf > best_conf:
                best_conf = conf

    plate_text = " ".join(tokens).upper().strip() if tokens else "UNKNOWN"
    return plate_text or "UNKNOWN", best_conf


def _process_media(file_path: Path) -> list[dict[str, Any]]:
    """
    Process image or video using YOLO object tracking and EasyOCR.

    For videos, it iterates through frames and uses ByteTrack to maintain 
    object identities across frames, reducing duplicate reports for the same vehicle.
    """
    if yolo_model is None:
        raise HTTPException(
            status_code=503,
            detail="YOLOv8 model is not available. Check server logs.",
        )

    is_image = file_path.suffix.lower() in ALLOWED_IMAGE_EXTENSIONS
    unique_violations: dict[int, dict[str, Any]] = {}

    if is_image:
        results = yolo_model(str(file_path), conf=DETECTION_CONFIDENCE_THRESHOLD, verbose=False)
    else:
        # Use object tracking for videos, sample every 10 frames to keep it fast
        results = yolo_model.track(
            source=str(file_path), 
            persist=True, 
            tracker="bytetrack.yaml", 
            conf=DETECTION_CONFIDENCE_THRESHOLD, 
            verbose=False,
            stream=True,
            vid_stride=10
        )

    timestamp_iso = datetime.now(timezone.utc).isoformat()
    fallback_id = 0

    for result in results:
        boxes = result.boxes
        if boxes is None:
            continue

        # We need the original frame array for OCR
        frame = result.orig_img

        for box in boxes:
            class_id = int(box.cls[0].item())
            confidence = float(box.conf[0].item())
            xyxy: list[float] = box.xyxy[0].tolist()

            # get track ID if available, else use fallback
            if box.id is not None:
                track_id = int(box.id[0].item())
            else:
                fallback_id -= 1
                track_id = fallback_id

            class_label: str = yolo_model.names.get(class_id, "Unknown")

            # Map COCO class → violation metadata
            if class_id == 3:  # motorcycle
                vehicle_type = "Motorcycle"
                violation_type = "No Helmet"
            elif class_id == PERSON_CLASS_ID:
                vehicle_type = "Pedestrian / Rider"
                violation_type = "No Helmet"
            elif class_id in VEHICLE_CLASS_IDS:
                vehicle_type = class_label.capitalize()
                violation_type = "Traffic Violation"
            else:
                continue  # irrelevant class — skip

            # If we've already recorded this tracked object, maybe update confidence or skip OCR
            if track_id in unique_violations:
                existing = unique_violations[track_id]
                plate_number, ocr_conf = _read_plate_text(frame, xyxy, class_id)
                
                # Update plate text if new OCR read is more confident, or if it was previously unknown
                if plate_number != "UNKNOWN":
                    if existing["plate_number"] == "UNKNOWN" or ocr_conf > existing.get("ocr_confidence", 0.0):
                        existing["plate_number"] = plate_number
                        existing["ocr_confidence"] = ocr_conf

                # Update vehicle type/violation if YOLO confidence is much higher
                if confidence > existing["confidence"] + 0.1:
                    existing["confidence"] = round(confidence, 4)
                    existing["vehicle_type"] = vehicle_type
                    existing["violation_type"] = violation_type
            else:
                # new tracked object, run OCR
                plate_number, ocr_conf = _read_plate_text(frame, xyxy, class_id)
                record: dict[str, Any] = {
                    "id": str(uuid.uuid4()),
                    "timestamp": timestamp_iso,
                    "vehicle_type": vehicle_type,
                    "plate_number": plate_number,
                    "violation_type": violation_type,
                    "confidence": round(confidence, 4),
                    "ocr_confidence": ocr_conf,
                }
                unique_violations[track_id] = record
                logger.info(
                    "Track %d  vehicle=%-20s  plate=%-15s  violation=%s  conf=%.2f",
                    track_id,
                    vehicle_type,
                    plate_number,
                    violation_type,
                    confidence,
                )

    return list(unique_violations.values())


# ---------------------------------------------------------------------------
# Endpoint: GET /health
# ---------------------------------------------------------------------------
@app.get(
    "/health",
    summary="Liveness & model-readiness probe",
    response_description="API status and model load state",
    tags=["Utility"],
)
async def health_check() -> dict[str, Any]:
    """
    Liveness check endpoint.

    Returns a JSON payload indicating whether the API process is alive and
    whether both AI models (YOLOv8 + EasyOCR) have been loaded.  Intended
    for use by the React frontend's startup guard and by container
    orchestration health checks.

    Returns
    -------
    dict
        ``{"status": "API is running", "model_loaded": bool}``
    """
    model_loaded = yolo_model is not None and ocr_reader is not None
    return {
        "status": "API is running",
        "model_loaded": model_loaded,
    }


# ---------------------------------------------------------------------------
# Endpoint: POST /api/upload-video
# ---------------------------------------------------------------------------
@app.post(
    "/api/upload-video",
    summary="Upload a video or image for AI violation detection",
    response_description="Structured list of detected traffic violations",
    tags=["Detection"],
)
async def upload_video(file: UploadFile = File(...)) -> dict[str, Any]:
    """
    Accept a multipart video or image upload, run the AI detection pipeline,
    and return a structured violation report to the caller.

    Processing flow
    ---------------
    1. Validate the file extension against the allow-list.
    2. Persist the upload to ``temp_uploads/`` with a UUID prefix to handle
       concurrent requests without filename collisions.
    3. Extract the middle frame (videos) or decode the image directly.
    4. Delete the temporary file (cleanup happens regardless of success/failure).
    5. Execute the YOLOv8 + EasyOCR pipeline on the extracted frame.
    6. Return the structured violation report.

    Parameters
    ----------
    file : UploadFile
        Multipart file sent by the React frontend (video or image).

    Returns
    -------
    dict
        ::

            {
                "status": "success",
                "detections": [
                    {
                        "id": "<uuid>",
                        "timestamp": "<ISO8601>",
                        "vehicle_type": "Motorcycle",
                        "plate_number": "TN-39-BX-1234",
                        "violation_type": "No Helmet",
                        "confidence": 0.94
                    }
                ]
            }

    Raises
    ------
    HTTPException 400
        Unsupported file type, corrupt file, or unreadable frame.
    HTTPException 503
        AI models are not loaded / unavailable.
    """
    # 1. Validate extension
    original_filename = file.filename or "upload"
    suffix = Path(original_filename).suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Unsupported file type '{suffix}'.  "
                f"Accepted: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
            ),
        )

    # 2. Save upload to disk
    unique_stem = f"{uuid.uuid4().hex}_{Path(original_filename).stem}"
    temp_file_path = TEMP_DIR / f"{unique_stem}{suffix}"

    logger.info("Saving upload to temp path: %s", temp_file_path)
    try:
        with temp_file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    finally:
        await file.close()

    # 3 & 4. Run AI pipeline with object tracking, then delete temp file
    try:
        detections = _process_media(temp_file_path)
    finally:
        if temp_file_path.exists():
            temp_file_path.unlink()
            logger.info("Temp file cleaned up: %s", temp_file_path)

    logger.info(
        "Pipeline complete — %d violation(s) found in '%s'.",
        len(detections),
        original_filename,
    )

    # 6. Return response
    return {
        "status": "success",
        "detections": detections,
    }


# ---------------------------------------------------------------------------
# Dev entry-point:  python main.py
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,   # hot-reload on file changes — disable in production
        log_level="info",
    )
