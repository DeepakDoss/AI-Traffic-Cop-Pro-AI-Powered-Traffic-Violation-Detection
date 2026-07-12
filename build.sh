#!/usr/bin/env bash
# exit on error
set -o errexit

# Build the Vite frontend
echo "Building frontend..."
cd Traffic
npm install
npm run build
cd ..

# Install Python dependencies
echo "Installing backend dependencies..."
pip install -r requirements.txt
