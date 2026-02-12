"""Entry point to run the FastAPI app via uvicorn.
This script is used as PyInstaller entrypoint when building a Windows app.
"""
import os
import sys
from pathlib import Path

# If running inside a PyInstaller one-dir bundle, the files added with
# --add-data will be available under sys._MEIPASS. Set FRONTEND_BUILD_DIR
# so `backend.stratos` can mount static files correctly.
if getattr(sys, "_MEIPASS", None):
    # _MEIPASS is the root of the temporary bundle directory
    meipass = Path(sys._MEIPASS)  # type: ignore
    # Try a couple of likely locations for the bundled frontend build.
    # Some packaging setups place the frontend at app.asar/frontend/build,
    # others bundle it under backend/frontend/build. Check both and set
    # FRONTEND_BUILD_DIR to whichever exists.
    possible_frontend_builds = [
        meipass / "frontend" / "build",
        meipass / "backend" / "frontend" / "build",
    ]
    for frontend_build in possible_frontend_builds:
        if frontend_build.exists():
            os.environ["FRONTEND_BUILD_DIR"] = str(frontend_build)
            print(f"Bundled frontend build found at: {frontend_build}")
            break

def main():
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "127.0.0.1")
    # Try to import the FastAPI `app` object directly so the frozen
    # executable can locate it whether it's packaged as a package
    # (`backend.stratos`) or as a top-level module (`stratos`).
    app = None
    try:
        from backend.stratos import app as _app  # type: ignore
        app = _app
    except Exception:
        try:
            from stratos import app as _app  # type: ignore
            app = _app
        except Exception as exc:
            print(f"Failed to import FastAPI app: {exc}", file=sys.stderr)
            raise

    # If the desired port is in use (common when another instance is running),
    # try to find a free port in the 8000-8100 range so the bundled app
    # can start instead of exiting immediately.
    import socket

    def find_free_port(start: int = 8000, end: int = 8100) -> int:
        for p in range(start, end + 1):
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                try:
                    s.bind((host, p))
                except OSError:
                    continue
                return p
        return port

    try:
        # quick check: attempt to bind to the requested port to detect conflicts
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as _s:
            _s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            _s.bind((host, port))
    except OSError:
        new_port = find_free_port(8000, 8100)
        if new_port != port:
            print(f"Port {port} in use; switching to available port {new_port}")
            port = new_port

    # Run with minimal logging - disable access logs to reduce output spam
    uvicorn.run(app, host=host, port=port, access_log=False)

if __name__ == "__main__":
    main()
