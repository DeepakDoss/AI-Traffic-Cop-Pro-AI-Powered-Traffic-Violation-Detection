import { useState, useRef, useEffect } from 'react';
import {
  Radio, Upload, CloudUpload, Maximize2,
  Settings2, Cpu, Zap, Eye, CheckCircle2, FileVideo, Loader2,
} from 'lucide-react';

// ─── Corner bracket helper ────────────────────────────────────────────────────
function Corner({ pos }) {
  const cls = {
    tl: 'top-2.5 left-2.5 border-l-2 border-t-2 rounded-tl-sm',
    tr: 'top-2.5 right-2.5 border-r-2 border-t-2 rounded-tr-sm',
    bl: 'bottom-2.5 left-2.5 border-l-2 border-b-2 rounded-bl-sm',
    br: 'bottom-2.5 right-2.5 border-r-2 border-b-2 rounded-br-sm',
  };
  return <div className={`absolute w-4 h-4 border-indigo-500/60 ${cls[pos]}`} />;
}

// ─── AI detection bounding box ────────────────────────────────────────────────
function BoundingBox({ style, label, color, pct }) {
  const c = {
    red:    { border: 'border-red-500/70',    bg: 'bg-red-500/5',    tag: 'bg-red-600',    corner: 'border-red-500'    },
    amber:  { border: 'border-amber-400/70',  bg: 'bg-amber-400/5',  tag: 'bg-amber-500',  corner: 'border-amber-400'  },
    indigo: { border: 'border-indigo-400/70', bg: 'bg-indigo-400/5', tag: 'bg-indigo-600', corner: 'border-indigo-400' },
  }[color] || {};
  return (
    <div className={`absolute border ${c.border} ${c.bg} rounded-sm`} style={style}>
      <div className={`absolute -top-px -left-px  w-2 h-2 border-t-2 border-l-2 ${c.corner}`} />
      <div className={`absolute -top-px -right-px w-2 h-2 border-t-2 border-r-2 ${c.corner}`} />
      <div className={`absolute -bottom-px -left-px  w-2 h-2 border-b-2 border-l-2 ${c.corner}`} />
      <div className={`absolute -bottom-px -right-px w-2 h-2 border-b-2 border-r-2 ${c.corner}`} />
      <div className={`absolute -top-5 left-0 ${c.tag} text-[9px] text-white px-1.5 py-0.5 rounded font-mono whitespace-nowrap font-bold`}>
        {label} · {pct}%
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LiveFeedView: Simulated camera stream with animated overlays.
// ─────────────────────────────────────────────────────────────────────────────
function LiveFeedView({ addToast }) {
  const [isRecording, setIsRecording] = useState(true);

  // Simulate real-time toast alerts for Live Feed
  useEffect(() => {
    if (!isRecording || !addToast) return;
    const intervalId = setInterval(() => {
      // ~30% chance to detect something every 4 seconds
      if (Math.random() > 0.7) {
        addToast(
          'Real-time Violation Detected',
          'warning',
          'No Helmet · Confidence 98.2% · CAM-04'
        );
      }
    }, 4000);
    return () => clearInterval(intervalId);
  }, [isRecording, addToast]);

  return (
    <div
      className="relative w-full aspect-video rounded-xl overflow-hidden border border-slate-800/60"
      style={{ background: 'radial-gradient(ellipse at 50% 50%, #071020 0%, #020810 100%)' }}
    >
      {/* Perspective grid overlay */}
      <div className="absolute inset-0 video-grid opacity-80" />

      {/* Ambient centre glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(99,102,241,0.04) 0%, transparent 70%)' }} />

      {/* Animated scan line */}
      {isRecording && <div className="scan-line" />}

      {/* Corner bracket markers */}
      {['tl','tr','bl','br'].map(p => <Corner key={p} pos={p} />)}

      {/* AI detection bounding boxes (simulated) */}
      {isRecording && (
        <div className="absolute inset-0 pointer-events-none">
          <BoundingBox style={{ top: '22%', left: '12%', width: '20%', height: '45%' }} label="NO HELMET" color="red"    pct="98.2" />
          <BoundingBox style={{ top: '40%', left: '52%', width: '26%', height: '32%' }} label="MH12AB3456" color="amber"  pct="95.1" />
          <BoundingBox style={{ top: '30%', left: '72%', width: '15%', height: '28%' }} label="VEHICLE"   color="indigo" pct="99.7" />
        </div>
      )}

      {/* Centre placeholder */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className={`text-center transition-opacity duration-500 ${isRecording ? 'opacity-10' : 'opacity-30'}`}>
          <Eye size={40} className="text-slate-300 mx-auto mb-2" />
          <p className="text-slate-400 text-[10px] font-mono tracking-widest uppercase">
            {isRecording ? 'SIMULATED FEED' : 'FEED PAUSED'}
          </p>
        </div>
      </div>

      {/* ── Top bar: LIVE badge + camera label ── */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsRecording(r => !r)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border backdrop-blur-sm transition-all ${
              isRecording
                ? 'bg-red-600/80 border-red-500/40 text-white'
                : 'bg-slate-900/70 border-slate-700 text-slate-400'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isRecording ? 'bg-white animate-pulse-dot' : 'bg-slate-500'}`} />
            {isRecording ? '● LIVE' : '⏸ PAUSED'}
          </button>
          <span className="px-2 py-1 rounded-md text-[10px] font-mono text-slate-300 bg-slate-900/70 border border-slate-800 backdrop-blur-sm">
            CAM-04 · Junction 7 · Mumbai
          </span>
        </div>
        <span className={`text-[10px] font-mono bg-slate-900/60 border border-slate-800 px-2 py-1 rounded backdrop-blur-sm transition-colors ${
          isRecording ? 'text-indigo-400' : 'text-slate-600'
        }`}>
          {isRecording ? 'AI INFERENCE · ACTIVE' : 'AI INFERENCE · IDLE'}
        </span>
      </div>

      {/* ── Bottom-left: Telemetry readout ── */}
      <div className="absolute bottom-3 left-3 grid grid-cols-2 gap-x-3 gap-y-1">
        {[
          ['FPS',     '30',      'text-indigo-300'],
          ['RES',     '1080p',   'text-indigo-300'],
          ['LATENCY', '12ms',    'text-emerald-300'],
          ['MODEL',   'YOLOv8n', 'text-amber-300'],
        ].map(([k, v, vc]) => (
          <div key={k} className="flex items-center gap-1.5 text-[9px] font-mono bg-slate-950/70 border border-slate-800/50 backdrop-blur-sm px-1.5 py-0.5 rounded">
            <span className="text-slate-600">{k}</span>
            <span className={vc}>{v}</span>
          </div>
        ))}
      </div>

      {/* ── Bottom-right: Control buttons ── */}
      <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
        {[Cpu, Settings2, Maximize2].map((Icon, i) => (
          <button key={i} className="p-1.5 rounded-lg bg-slate-950/70 border border-slate-800/50 text-slate-500 hover:text-slate-200 hover:border-slate-600 transition-all backdrop-blur-sm">
            <Icon size={13} />
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Maps a backend detection object → the violation shape used by App.jsx */
function mapDetectionToViolation(det, index = 0) {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const ts = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  const severityMap = { 'No Helmet': 'high', 'Traffic Violation': 'medium' };
  const fineMap     = { 'No Helmet': 1000,   'Traffic Violation': 1500    };
  return {
    // Always generate a unique ID — don't rely on backend providing one
    id:       det.id ?? (Date.now() + index + Math.random()),
    ts,
    plate:    (!det.plate_number || det.plate_number === 'UNKNOWN') ? '—' : det.plate_number,
    type:     det.violation_type ?? 'Unknown',
    vehicle:  det.vehicle_type   ?? 'Unknown',
    cam:      'CAM-UPLOAD',
    location: 'Uploaded Evidence',
    // Backend sends confidence as 0-1 float; convert to 0-100 percentage
    conf:     det.confidence != null ? Math.round(det.confidence * 100 * 10) / 10 : 0,
    fine:     fineMap[det.violation_type]    ?? 1000,
    severity: severityMap[det.violation_type] ?? 'medium',
    status:   'Unpaid',
  };
}

// ─── Processing log lines shown during upload ─────────────────────────────────
const PROCESSING_STEPS = [
  'Uploading file to server...',
  'Extracting key frame from video...',
  'Loading YOLOv8n model...',
  'Running object detection...',
  'Applying EasyOCR (ANPR)...',
  'Generating evidence report...',
];

// ─────────────────────────────────────────────────────────────────────────────
// UploadView: Drag-and-drop zone for local .mp4/.mov/.avi/.jpg/.png files.
// Calls POST /api/upload-video, shows real progress, feeds real detections
// back to App.jsx via the onDetections callback prop.
// ─────────────────────────────────────────────────────────────────────────────
function UploadView({ onDetections }) {
  const [dragging, setDragging]     = useState(false);
  const [fileInfo, setFileInfo]     = useState(null);
  const [progress, setProgress]     = useState(0);
  const [processing, setProcessing] = useState(false);
  const [done, setDone]             = useState(false);
  const [error, setError]           = useState(null);
  const [detectionCount, setDetectionCount] = useState(0);
  const inputRef = useRef(null);

  const formatSize = (bytes) => {
    if (bytes < 1024)       return `${bytes} B`;
    if (bytes < 1024 ** 2)  return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 ** 3)  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
    return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
  };

  /**
   * Uploads the file to POST /api/upload-video.
   * Simulates incremental progress to 85% while the real request is in-flight,
   * then snaps to 100% on success.
   */
  const startProcessing = async (file) => {
    setFileInfo({ name: file.name, size: formatSize(file.size) });
    setProcessing(true);
    setDone(false);
    setError(null);
    setProgress(0);
    setDetectionCount(0);

    let fakeProgress = 0;
    const interval = setInterval(() => {
      fakeProgress += Math.random() * 3 + 1.5;
      if (fakeProgress < 85) setProgress(fakeProgress);
    }, 200);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload-video', {
        method: 'POST',
        body: formData,
      });

      clearInterval(interval);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || `Server error: ${response.status}`);
      }

      const data = await response.json();

      setProgress(100);
      setDetectionCount(data.detections?.length ?? 0);
      setProcessing(false);
      setDone(true);

      if (data.detections?.length > 0 && onDetections) {
        // Pass mapped violations AND the raw detection count (batchCount)
        // so App.jsx can separately track total objects seen vs violations flagged
        onDetections(
          data.detections.map((det, i) => mapDetectionToViolation(det, i)),
          data.detections.length   // batchCount
        );
      } else if (onDetections) {
        // No violations but still update the detection tally
        onDetections([], data.detections?.length ?? 0);
      }
    } catch (err) {
      clearInterval(interval);
      setProcessing(false);
      setError(err.message ?? 'Upload failed. Is the backend running on :8000?');
      setProgress(0);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) startProcessing(file);
  };

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file) startProcessing(file);
  };

  const handleReset = (e) => {
    e.stopPropagation();
    setFileInfo(null);
    setProgress(0);
    setProcessing(false);
    setDone(false);
    setError(null);
    setDetectionCount(0);
    if (inputRef.current) inputRef.current.value = '';
  };

  const logLineIndex = Math.min(
    Math.floor((progress / 100) * PROCESSING_STEPS.length),
    PROCESSING_STEPS.length - 1
  );

  return (
    <div
      className="w-full aspect-video flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all duration-300 relative overflow-hidden cursor-pointer"
      style={{
        background: dragging
          ? 'radial-gradient(ellipse at center, rgba(99,102,241,0.08), #020810)'
          : 'radial-gradient(ellipse at center, #071020, #020810)',
        borderColor: error
          ? 'rgba(239,68,68,0.5)'
          : dragging ? 'rgba(99,102,241,0.6)' : 'rgba(51,65,85,0.5)',
      }}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !processing && !done && !error && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".mp4,.mov,.avi,.mkv,.jpg,.jpeg,.png"
        className="hidden"
        onChange={handleChange}
      />
      <div className="video-grid absolute inset-0 opacity-50" />

      {/* ── Error state ─────────────────────────────────────────── */}
      {error && (
        <div className="relative z-10 flex flex-col items-center gap-3 text-center px-8">
          <div className="w-12 h-12 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center">
            <span className="text-2xl">⚠️</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-red-400">Upload Failed</p>
            <p className="text-[11px] text-slate-500 font-mono mt-1 max-w-xs leading-relaxed">{error}</p>
          </div>
          <button
            className="text-xs text-slate-500 hover:text-slate-300 underline transition-colors"
            onClick={handleReset}
          >
            Try again
          </button>
        </div>
      )}

      {/* ── Processing state ────────────────────────────────────── */}
      {processing && (
        <div className="relative z-10 flex flex-col items-center gap-4 w-2/3">
          <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
            <Zap size={22} className="text-indigo-400 animate-pulse" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-200 truncate max-w-xs">{fileInfo?.name}</p>
            <p className="text-[11px] text-slate-500 font-mono mt-0.5">{fileInfo?.size}</p>
          </div>
          <div className="w-full">
            <div className="flex justify-between text-[10px] font-mono mb-1.5">
              <span className="text-slate-500">Sending to AI backend...</span>
              <span className="text-indigo-400 font-bold">{Math.floor(progress)}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-200"
                style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #4f46e5, #818cf8)' }}
              />
            </div>
          </div>
          <div className="w-full bg-slate-950/50 border border-slate-800/50 rounded-lg px-3 py-2">
            <p className="text-[10px] font-mono text-slate-600">
              <span className="text-indigo-500">&gt; </span>
              {PROCESSING_STEPS[logLineIndex]}
            </p>
          </div>
        </div>
      )}

      {/* ── Done / complete state ────────────────────────────────── */}
      {done && (
        <div className="relative z-10 flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
            <CheckCircle2 size={24} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-100 flex items-center gap-2 justify-center">
              <FileVideo size={14} className="text-slate-400" />
              {fileInfo?.name}
            </p>
            <p className="text-[11px] text-slate-500 font-mono mt-0.5">{fileInfo?.size}</p>
          </div>
          <div className={`px-3 py-1.5 rounded-full border ${
            detectionCount > 0
              ? 'bg-red-500/10 border-red-500/20'
              : 'bg-emerald-500/10 border-emerald-500/20'
          }`}>
            <p className={`text-xs font-bold ${detectionCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              {detectionCount > 0
                ? `⚠ ${detectionCount} violation${detectionCount !== 1 ? 's' : ''} detected · Added to Evidence Table`
                : '✓ No violations detected in this footage'}
            </p>
          </div>
          <div className="w-64 bg-slate-950/50 border border-slate-800/50 rounded-lg px-3 py-2 text-left">
            {PROCESSING_STEPS.map((step, i) => (
              <p key={i} className="text-[9px] font-mono text-slate-600">
                <span className="text-emerald-600">✓ </span>{step}
              </p>
            ))}
          </div>
          <button
            className="text-xs text-slate-500 hover:text-slate-300 underline transition-colors"
            onClick={handleReset}
          >
            Upload another file
          </button>
        </div>
      )}

      {/* ── Idle / drag-and-drop state ───────────────────────────── */}
      {!processing && !done && !error && (
        <div className="relative z-10 flex flex-col items-center gap-4 text-center px-8">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border-2 transition-all duration-300 ${
            dragging ? 'bg-indigo-600/20 border-indigo-500 scale-110' : 'bg-slate-800/60 border-slate-700'
          }`}>
            <CloudUpload size={26} className={dragging ? 'text-indigo-400' : 'text-slate-500'} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-200 mb-1">Drag &amp; drop video evidence here</p>
            <p className="text-xs text-slate-500">.mp4 · .mov · .avi · .jpg · .png &nbsp;—&nbsp; max 2 GB</p>
          </div>
          <div className="flex items-center gap-3 w-full max-w-xs">
            <div className="h-px flex-1 bg-slate-800" />
            <span className="text-slate-600 text-xs">or</span>
            <div className="h-px flex-1 bg-slate-800" />
          </div>
          <button
            className="px-5 py-2 text-xs font-semibold rounded-lg text-white transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #4f46e5, #6366f1)' }}
            onClick={e => { e.stopPropagation(); inputRef.current?.click(); }}
          >
            Browse Files
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VideoPanel: Wrapper with Live / Upload tab toggle.
// Accepts onDetections — a callback from App.jsx that injects real API
// detections into the shared violations state.
// ─────────────────────────────────────────────────────────────────────────────
export default function VideoPanel({ onDetections, stats, backendReady, addToast }) {
  const [mode, setMode] = useState('live');

  return (
    <div
      className="flex flex-col gap-4 rounded-2xl p-5 border border-slate-800/60 relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #0d1528 0%, #0a1020 100%)' }}
    >
      {/* Top glow accent */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />

      {/* Panel header + mode toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-100">Video Processing</h2>
          <p className="text-[11px] text-slate-500 mt-0.5">YOLOv8 · ANPR v3 · Real-time Inference</p>
        </div>

        {/* Mode toggle — segmented control */}
        <div className="flex items-center p-1 bg-slate-950/70 rounded-xl border border-slate-800/70">
          {[
            { id: 'live',   label: 'Live Feed', icon: Radio  },
            { id: 'upload', label: 'Upload',    icon: Upload },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              id={`mode-${id}`}
              onClick={() => setMode(id)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                mode === id
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-900/40'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon size={11} className={mode === id && id === 'live' ? 'text-red-300' : ''} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Conditionally render the active sub-view — pass onDetections to UploadView */}
      <div className="relative">
        {!backendReady && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm rounded-xl border border-slate-800/50">
             <Loader2 size={32} className="text-indigo-400 animate-spin mb-3" />
             <p className="text-sm font-semibold text-slate-200">Loading AI Models...</p>
             <p className="text-[10px] text-slate-500 font-mono mt-1">YOLOv8s &amp; EasyOCR</p>
          </div>
        )}
        {mode === 'live' ? <LiveFeedView addToast={addToast} /> : <UploadView onDetections={onDetections} />}
      </div>

      {/* Stats mini-row — driven by real accumulated data from API responses */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: 'Total Detected',
            // Show the real cumulative count from all uploads this session
            value:  stats?.totalDetections > 0
              ? stats.totalDetections.toLocaleString('en-IN')
              : '0',
            color: 'text-slate-100',
            bar:   'from-indigo-600 to-indigo-400',
            // Bar width: full (100%) since this is the total baseline
            pct:   100,
          },
          {
            label: 'Violations Found',
            value:  stats?.totalViolations > 0
              ? stats.totalViolations.toLocaleString('en-IN')
              : '0',
            color: 'text-red-400',
            bar:   'from-red-600 to-red-400',
            // Bar width reflects violation rate relative to total detections
            pct: stats?.totalDetections > 0
              ? Math.round((stats.totalViolations / stats.totalDetections) * 100)
              : 0,
          },
          {
            label: 'Avg Confidence',
            // null means no data yet — show “—” instead of a fake number
            value:  stats?.avgConfidence != null
              ? `${stats.avgConfidence.toFixed(1)}%`
              : '—',
            color: 'text-emerald-400',
            bar:   'from-emerald-600 to-emerald-400',
            pct:   stats?.avgConfidence ?? 0,
          },
        ].map(({ label, value, color, bar, pct }) => (
          <div key={label} className="bg-slate-950/50 rounded-xl p-3 border border-slate-800/50">
            <p className={`text-base font-bold ${color} mb-0.5`}>{value}</p>
            <p className="text-[10px] text-slate-600 mb-2">{label}</p>
            <div className="h-0.5 bg-slate-800 rounded-full overflow-hidden">
              <div className={`h-full bg-gradient-to-r ${bar} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
