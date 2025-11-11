#!/bin/bash
# Start the FastAPI backend server

cd "$(dirname "$0")"
source .venv/bin/activate
echo "Starting MotoTrack backend server on http://localhost:8000"
echo "Press Ctrl+C to stop"
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

