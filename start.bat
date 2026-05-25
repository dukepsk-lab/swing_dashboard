@echo off
title SwingDash Launcher
cd /d "%~dp0"

echo.
echo  ==========================================
echo   SWINGDASH - Golf Simulator Analytics
echo  ==========================================
echo.

:: ── Backend ───────────────────────────────────────────────────────────────────
echo [1/3] Installing backend dependencies...
pip install -r backend\requirements.txt --quiet

echo [2/3] Starting backend (port 8000)...
start "SwingDash Backend" cmd /k "cd /d "%~dp0backend" && uvicorn main:app --reload --port 8000"

:: Give the backend a moment to bind the port
timeout /t 3 /nobreak >nul

:: ── Frontend ──────────────────────────────────────────────────────────────────
echo [3/3] Starting frontend (port 5173)...
if not exist "frontend\node_modules" (
    echo       Installing frontend dependencies (first run only)...
    cd frontend && npm install && cd ..
)
start "SwingDash Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

:: Wait for Vite to be ready, then open browser
timeout /t 4 /nobreak >nul
echo.
echo  Opening http://localhost:5173 ...
start "" "http://localhost:5173"

echo.
echo  Both servers are running in separate windows.
echo  Close those windows to stop the servers.
echo.
pause
