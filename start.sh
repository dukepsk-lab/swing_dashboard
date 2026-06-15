#!/usr/bin/env bash
# SWINGBOX GOLF SIMULATOR - one-shot launcher for macOS / Linux.
# Sets up a venv, installs deps, builds the dashboard once, then runs everything
# on a single port (http://localhost:8000) and opens the browser.
set -e
cd "$(dirname "$0")"

echo "==============================================="
echo "   SWINGBOX GOLF SIMULATOR"
echo "==============================================="

if ! command -v python3 >/dev/null 2>&1; then
  echo "[ERROR] python3 not found. Install Python 3.10+ and try again."
  exit 1
fi

if [ ! -x ".venv/bin/python" ]; then
  echo "[setup] Creating Python virtual environment..."
  python3 -m venv .venv
fi
PY=".venv/bin/python"

echo "[setup] Installing backend dependencies..."
"$PY" -m pip install --quiet --upgrade pip
"$PY" -m pip install --quiet -r backend/requirements.txt

if [ ! -f "frontend/dist/index.html" ]; then
  if ! command -v npm >/dev/null 2>&1; then
    echo "[ERROR] npm not found. Install Node 18+ and try again."
    exit 1
  fi
  echo "[setup] Building the dashboard (first run only)..."
  (cd frontend && npm install && npm run build)
fi

echo
echo "Dashboard : http://localhost:8000   (GSPro Connect / launch monitor on TCP 921)"
echo "Press Ctrl+C to stop."
echo

( sleep 3; (command -v open >/dev/null && open http://localhost:8000) || (command -v xdg-open >/dev/null && xdg-open http://localhost:8000) ) >/dev/null 2>&1 &

cd backend
exec "../.venv/bin/python" -m uvicorn main:app --host 0.0.0.0 --port 8000
