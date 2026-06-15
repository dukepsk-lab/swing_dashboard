"""SWINGBOX GOLF SIMULATOR - single entry point.

Runs the FastAPI backend (API + WebSocket + the built dashboard) on one port and
opens the browser. Used both as a convenience launcher (`python run.py`) and as the
entry point baked into the standalone Windows .exe (see build_exe.bat).
"""

import os
import sys
import time
import threading
import webbrowser

HOST = os.environ.get("SWINGBOX_HOST", "0.0.0.0")
PORT = int(os.environ.get("SWINGBOX_PORT", "8000"))

# Make `backend/` importable whether running from source or from a PyInstaller bundle.
_BASE = getattr(sys, "_MEIPASS", os.path.dirname(os.path.abspath(__file__)))
for _p in (os.path.join(_BASE, "backend"), _BASE):
    if _p not in sys.path:
        sys.path.insert(0, _p)


def _open_browser():
    time.sleep(3)
    webbrowser.open(f"http://localhost:{PORT}")


def main():
    import uvicorn
    from main import app  # noqa: F401  (imported so PyInstaller picks it up)

    threading.Thread(target=_open_browser, daemon=True).start()
    print(f"SWINGBOX running at http://localhost:{PORT}  (launch monitor / GSPro Connect on TCP 921)")
    uvicorn.run(app, host=HOST, port=PORT)


if __name__ == "__main__":
    main()
