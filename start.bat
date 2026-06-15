@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"
title SWINGBOX GOLF SIMULATOR

echo ===============================================
echo    SWINGBOX GOLF SIMULATOR
echo ===============================================
echo.

REM ---- check Python ----------------------------------------------------------
where python >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python was not found.
    echo         Install Python 3.10+ from https://www.python.org/downloads/
    echo         and tick "Add python.exe to PATH", then run this again.
    echo.
    pause
    exit /b 1
)

REM ---- create / reuse virtual env --------------------------------------------
if not exist ".venv\Scripts\python.exe" (
    echo [setup] Creating Python virtual environment...
    python -m venv .venv
)
set "PY=.venv\Scripts\python.exe"

echo [setup] Installing backend dependencies...
"%PY%" -m pip install --quiet --upgrade pip
"%PY%" -m pip install --quiet -r backend\requirements.txt
if errorlevel 1 (
    echo [ERROR] Failed to install backend dependencies.
    pause
    exit /b 1
)

REM ---- build the dashboard once (skipped if already built) -------------------
if not exist "frontend\dist\index.html" (
    where npm >nul 2>&1
    if errorlevel 1 (
        echo [ERROR] Node.js / npm was not found.
        echo         Install Node 18+ from https://nodejs.org/ and run this again.
        echo.
        pause
        exit /b 1
    )
    echo [setup] Installing dashboard packages ^(first run, may take a few minutes^)...
    pushd frontend
    call npm install
    echo [setup] Building dashboard...
    call npm run build
    popd
)

echo.
echo -----------------------------------------------
echo  Dashboard : http://localhost:8000
echo  GSPro Connect / launch monitor : TCP port 921
echo  Keep this window open. Close it to stop.
echo -----------------------------------------------
echo.

REM ---- open the browser shortly after the server starts ----------------------
start "" cmd /c "timeout /t 3 >nul & start "" http://localhost:8000"

REM ---- run the server (serves API, WebSocket and the dashboard) --------------
cd backend
"..\.venv\Scripts\python.exe" -m uvicorn main:app --host 0.0.0.0 --port 8000

echo.
echo Server stopped.
pause
