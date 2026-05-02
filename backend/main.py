from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio
import json
import uuid
from datetime import datetime
from typing import List

from models import ShotData
from simulator import DataSimulator, generate_course_session, generate_hole_shot_path, HOLE_PARS, HOLE_DISTANCES, COURSE_NAMES
from database import init_db, save_shot, get_session_shots, get_all_sessions, save_round, get_rounds

import random

# ── state ──────────────────────────────────────────────────────────────────────
shot_buffer: List[dict] = []
BUFFER_SIZE = 50
active_connections: List[WebSocket] = []
simulator = DataSimulator()
live_session_id = f"session_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
session_start = datetime.utcnow()
is_streaming = False
stream_task = None

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


async def stream_loop():
    global is_streaming
    is_streaming = True
    try:
        while is_streaming:
            await asyncio.sleep(3)
            shot = simulator.next_shot(live_session_id)
            shot_buffer.append(shot)
            if len(shot_buffer) > BUFFER_SIZE:
                shot_buffer.pop(0)
            await save_shot(shot)
            await broadcast({"type": "shot", "data": shot})
    finally:
        is_streaming = False


# ── lifespan ───────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    global stream_task
    stream_task = asyncio.create_task(stream_loop())
    yield
    if stream_task:
        stream_task.cancel()


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
                "current_club": simulator._current_club,
                "course": current_course,
                "scorecard": scorecard,
            }
        }))
        while True:
            try:
                msg = await asyncio.wait_for(websocket.receive_text(), timeout=30)
                data = json.loads(msg)
                if data.get("action") == "set_club":
                    simulator._current_club = data["club"]
                    await broadcast({"type": "club_change", "data": {"club": data["club"]}})
                elif data.get("action") == "trigger_shot":
                    shot = simulator.next_shot(live_session_id)
                    shot_buffer.append(shot)
                    if len(shot_buffer) > BUFFER_SIZE:
                        shot_buffer.pop(0)
                    await save_shot(shot)
                    await broadcast({"type": "shot", "data": shot})
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
    return {"status": "ok", "connections": len(active_connections)}


@app.get("/api/session/current")
async def get_current_session():
    return {
        "session_id": live_session_id,
        "start_time": session_start.isoformat(),
        "shot_count": len(shot_buffer),
        "current_club": simulator._current_club,
        "is_streaming": is_streaming,
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
async def manual_shot(club: str = None):
    shot = simulator.next_shot(live_session_id)
    if club:
        shot["club"] = club
    shot_buffer.append(shot)
    if len(shot_buffer) > BUFFER_SIZE:
        shot_buffer.pop(0)
    await save_shot(shot)
    await broadcast({"type": "shot", "data": shot})
    return shot
