from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Body
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio
import json
import os
import logging
from datetime import datetime
from typing import List, Optional

import ogc
import gspro_codes
from gspro_connect import GSProConnectServer, DEFAULT_PORT
from simulator import generate_course_session, generate_hole_shot_path, HOLE_PARS, HOLE_DISTANCES, COURSE_NAMES, CLUBS
from database import init_db, save_shot, get_session_shots, get_all_sessions, save_round, get_rounds

import random

logging.basicConfig(level=logging.INFO)

# ── state ──────────────────────────────────────────────────────────────────────
shot_buffer: List[dict] = []
BUFFER_SIZE = 50
active_connections: List[WebSocket] = []

# GSPro ball data carries no club name. In standalone mode the dashboard-selected club is used;
# in relay mode GSPro reports the selected club/handedness back, which overrides these.
current_club = "7 Iron"
current_hand = "right_handed"  # open-golf-coach handedness key
shot_counter = 0

live_session_id = f"session_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
session_start = datetime.utcnow()

gspro_server: Optional[GSProConnectServer] = None
lm_connected = False
lm_device_id: Optional[str] = None

GSPRO_HOST = os.environ.get("GSPRO_CONNECT_HOST", "0.0.0.0")
GSPRO_PORT = int(os.environ.get("GSPRO_CONNECT_PORT", DEFAULT_PORT))
# Set GSPRO_UPSTREAM_HOST to relay to a real GSPro (and read back its selected club/handedness).
GSPRO_UPSTREAM_HOST = os.environ.get("GSPRO_UPSTREAM_HOST") or None
GSPRO_UPSTREAM_PORT = int(os.environ.get("GSPRO_UPSTREAM_PORT", DEFAULT_PORT))

current_course = {
    "course_name": random.choice(COURSE_NAMES),
    "hole": 1,
    "par": HOLE_PARS[0],
    "distance": HOLE_DISTANCES[0],
    "wind_speed": round(random.uniform(0, 15), 1),
    "wind_direction": random.choice(["N", "NE", "E", "SE", "S", "SW", "W", "NW"]),
}
scorecard: List[dict] = []


# ── broadcast ──────────────────────────────────────────────────────────────────
async def broadcast(message: dict):
    dead = []
    for ws in active_connections:
        try:
            await ws.send_text(json.dumps(message))
        except Exception:
            dead.append(ws)
    for ws in dead:
        active_connections.remove(ws)


# ── GSPro Connect callbacks ──────────────────────────────────────────────────────
async def ingest_ball_data(ball: dict, club_data: Optional[dict] = None, club: Optional[str] = None) -> dict:
    """Reverse-calc one launch-monitor shot via open-golf-coach, persist and broadcast it."""
    global shot_counter
    shot_counter += 1
    shot = ogc.derive(
        ball,
        club_data=club_data,
        club=club or current_club,
        session_id=live_session_id,
        shot_number=shot_counter,
        hand=current_hand,
    )
    shot_buffer.append(shot)
    if len(shot_buffer) > BUFFER_SIZE:
        shot_buffer.pop(0)
    await save_shot(shot)
    await broadcast({"type": "shot", "data": shot})
    return shot


async def on_shot(ball: dict, club_data: Optional[dict], raw: dict):
    await ingest_ball_data(ball, club_data)


async def on_status(connected: bool, device_id: Optional[str]):
    global lm_connected, lm_device_id
    lm_connected = connected
    lm_device_id = device_id
    await broadcast({"type": "lm_status", "data": {"connected": connected, "device_id": device_id}})


async def on_player(club_code: Optional[str], handed: Optional[str]):
    """Relay tap: GSPro reports its selected club / handedness back to the launch monitor."""
    global current_club, current_hand
    if club_code:
        label = gspro_codes.club_label(club_code)
        if label and label != current_club:
            current_club = label
            await broadcast({"type": "club_change", "data": {"club": current_club, "source": "gspro"}})
    if handed:
        hand = gspro_codes.hand_from_gspro(handed)
        if hand != current_hand:
            current_hand = hand
            await broadcast({"type": "hand_change", "data": {"hand": hand}})


# ── lifespan ───────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    global gspro_server
    gspro_server = GSProConnectServer(
        on_shot, on_status, on_player,
        host=GSPRO_HOST, port=GSPRO_PORT,
        upstream_host=GSPRO_UPSTREAM_HOST, upstream_port=GSPRO_UPSTREAM_PORT,
    )
    try:
        await gspro_server.start()
    except OSError as e:
        logging.error("Could not bind GSPro Connect receiver on %s:%s (%s). "
                      "Live launch-monitor input is disabled; /api/shot/manual still works.",
                      GSPRO_HOST, GSPRO_PORT, e)
        gspro_server = None
    yield
    if gspro_server:
        await gspro_server.stop()


app = FastAPI(title="Swing Dashboard API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── WebSocket ──────────────────────────────────────────────────────────────────
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    global current_club
    await websocket.accept()
    active_connections.append(websocket)
    try:
        # Send current buffer on connect
        await websocket.send_text(json.dumps({
            "type": "init",
            "data": {
                "shots": shot_buffer[-20:],
                "session_id": live_session_id,
                "session_start": session_start.isoformat(),
                "current_club": current_club,
                "current_hand": current_hand,
                "course": current_course,
                "scorecard": scorecard,
                "lm_connected": lm_connected,
                "lm_device_id": lm_device_id,
            }
        }))
        while True:
            try:
                msg = await asyncio.wait_for(websocket.receive_text(), timeout=30)
                data = json.loads(msg)
                if data.get("action") == "set_club":
                    current_club = data["club"]
                    await broadcast({"type": "club_change", "data": {"club": current_club}})
                elif data.get("action") == "next_hole":
                    hole_idx = current_course["hole"]
                    if hole_idx < 18:
                        current_course["hole"] = hole_idx + 1
                        current_course["par"] = HOLE_PARS[hole_idx]
                        current_course["distance"] = HOLE_DISTANCES[hole_idx]
                        await broadcast({"type": "hole_change", "data": current_course})
            except asyncio.TimeoutError:
                await websocket.send_text(json.dumps({"type": "ping"}))
    except WebSocketDisconnect:
        pass
    finally:
        if websocket in active_connections:
            active_connections.remove(websocket)


# ── REST API ───────────────────────────────────────────────────────────────────
@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "connections": len(active_connections),
        "gspro_listening": gspro_server is not None,
        "gspro_port": GSPRO_PORT,
        "mode": gspro_server.mode if gspro_server else ("relay" if GSPRO_UPSTREAM_HOST else "standalone"),
        "upstream": f"{GSPRO_UPSTREAM_HOST}:{GSPRO_UPSTREAM_PORT}" if GSPRO_UPSTREAM_HOST else None,
        "launch_monitor_connected": lm_connected,
        "current_club": current_club,
        "current_hand": current_hand,
        "ogc_available": ogc.available(),
    }


@app.get("/api/session/current")
async def get_current_session():
    return {
        "session_id": live_session_id,
        "start_time": session_start.isoformat(),
        "shot_count": len(shot_buffer),
        "current_club": current_club,
        "launch_monitor_connected": lm_connected,
    }


@app.get("/api/shots")
async def get_shots(limit: int = 50):
    shots = await get_session_shots(live_session_id, limit)
    if not shots:
        shots = list(reversed(shot_buffer[-limit:]))
    return {"shots": shots, "count": len(shots)}


@app.get("/api/shots/buffer")
async def get_buffer():
    return {"shots": list(reversed(shot_buffer)), "count": len(shot_buffer)}


@app.get("/api/sessions")
async def list_sessions():
    sessions = await get_all_sessions()
    return {"sessions": sessions}


@app.get("/api/sessions/{session_id}/shots")
async def get_session(session_id: str, limit: int = 50):
    shots = await get_session_shots(session_id, limit)
    return {"shots": shots, "count": len(shots)}


@app.get("/api/course/current")
async def get_course():
    return current_course


@app.get("/api/course/scorecard")
async def get_scorecard():
    return {"scorecard": scorecard, "course": current_course}


@app.get("/api/course/demo")
async def get_demo_round():
    round_data = generate_course_session()
    hole_paths = []
    for i, score in enumerate(round_data["scores"]):
        path = generate_hole_shot_path(i + 1, score["par"], score["distance"])
        hole_paths.append({"hole": i + 1, "path": path})
    return {**round_data, "hole_paths": hole_paths}


@app.get("/api/course/hole/{hole_num}/path")
async def get_hole_path(hole_num: int):
    idx = max(0, min(17, hole_num - 1))
    path = generate_hole_shot_path(hole_num, HOLE_PARS[idx], HOLE_DISTANCES[idx])
    return {"hole": hole_num, "par": HOLE_PARS[idx], "distance": HOLE_DISTANCES[idx], "path": path}


@app.get("/api/rounds")
async def list_rounds():
    rounds = await get_rounds()
    return {"rounds": rounds}


@app.post("/api/shot/manual")
async def manual_shot(payload: dict = Body(default=None)):
    """Inject a shot in GSPro Connect format (no hardware needed).

    Accepts either a full GSPro message ({"BallData": {...}, "ClubData": {...}}) or a bare
    BallData object ({"Speed": 150, "VLA": 12, "HLA": -1, "TotalSpin": 2600, "SpinAxis": -6}).
    An optional "club" overrides the dashboard-selected club.
    """
    payload = payload or {}
    ball = payload.get("BallData") or {k: v for k, v in payload.items() if k not in ("ClubData", "club")}
    club_data = payload.get("ClubData")
    club = payload.get("club")
    shot = await ingest_ball_data(ball, club_data, club)
    return shot
