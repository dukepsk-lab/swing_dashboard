@echo off
setlocal
cd /d "%~dp0"
title Build SWINGBOX.exe

echo ===============================================
echo    Building standalone SWINGBOX.exe
echo ===============================================
echo.
echo This produces a single SWINGBOX.exe that needs neither Python nor
echo Node.js to run. Build it ON Windows; the result lands in dist\SWINGBOX.exe.
echo.

where python >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found. Install Python 3.10+ and run again.
    pause & exit /b 1
)

if not exist ".venv\Scripts\python.exe" python -m venv .venv
set "PY=.venv\Scripts\python.exe"

echo [1/3] Installing build dependencies...
"%PY%" -m pip install --quiet --upgrade pip
"%PY%" -m pip install --quiet -r backend\requirements.txt pyinstaller

echo [2/3] Building the dashboard...
where npm >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js / npm not found. Install Node 18+ and run again.
    pause & exit /b 1
)
pushd frontend
call npm install
call npm run build
popd

echo [3/3] Packaging the .exe with PyInstaller...
"%PY%" -m PyInstaller --noconfirm --onefile --name SWINGBOX ^
    --add-data "frontend\dist;dist" ^
    --paths backend ^
    --collect-submodules uvicorn ^
    --collect-submodules opengolfcoach ^
    --hidden-import uvicorn.loops.auto ^
    --hidden-import uvicorn.protocols.http.auto ^
    --hidden-import uvicorn.protocols.websockets.auto ^
    --hidden-import uvicorn.lifespan.on ^
    run.py

echo.
if exist "dist\SWINGBOX.exe" (
    echo Done. Your program is at:  dist\SWINGBOX.exe
    echo Double-click it to launch SWINGBOX on http://localhost:8000
) else (
    echo [ERROR] Build did not produce dist\SWINGBOX.exe - check the log above.
)
echo.
pause
