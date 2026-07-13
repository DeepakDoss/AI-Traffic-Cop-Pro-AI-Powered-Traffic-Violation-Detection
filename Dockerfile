# Use the official Python slim image for a smaller footprint
FROM python:3.10-slim

# Prevent Python from writing .pyc files to disk and ensure logs are output directly
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set the working directory
WORKDIR /app

# Install system dependencies required for OpenCV and EasyOCR
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy the requirements file first to leverage Docker layer caching
COPY requirements.txt .

# Install Python dependencies
# We use --no-cache-dir to keep the image size small
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Expose the port (Railway provides the PORT environment variable)
EXPOSE 8000

# Start the FastAPI application
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
