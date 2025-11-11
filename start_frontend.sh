#!/bin/bash
# Start the React frontend development server

cd "$(dirname "$0")/frontend"
echo "Starting MotoTrack frontend on http://localhost:5173"
echo "Press Ctrl+C to stop"
npm run dev -- --host

