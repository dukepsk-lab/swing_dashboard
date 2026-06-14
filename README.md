# SwingDash — Golf Simulator Dashboard

A professional, real-time golf simulator analytics dashboard inspired by Trackman / GSPro, built with **React + Tailwind CSS + Recharts** (frontend) and **FastAPI + WebSocket** (backend).

Live shot data comes from a real launch monitor over the **GSPro Open Connect V1** protocol — SwingDash listens on TCP **port 921** exactly like GSPro does, so you point the launch monitor straight at it (no man-in-the-middle, nothing injected into GSPro). The launch monitor's ball data is then *reverse-calculated* into club/swing metrics (club speed, smash factor, club path, face angles, distances, shot shape & grade) using the official [**open-golf-coach**](https://github.com/OpenLaunchLabs/open-golf-coach) library.

---

## Screenshots

| Driving Range | Course Play |
|---|---|
| Live KPI cards, shot trajectory, dispersion, history, trend | Hole map, scorecard, stats, score trend, round summary |

---

## Features

### Page 1 — Driving Range Dashboard
- **7 Live KPI Cards**: Ball Speed, Club Speed, Smash Factor, Launch Angle, Spin Rate, Carry Distance, Total Distance
- **Shot Trajectory**: Canvas-rendered parabolic flight path with apex and lateral offset
- **Shot Dispersion**: 2D scatter plot showing carry vs. lateral deviation
- **Shot History Table**: Last 20 shots with all metrics, animated on new arrival
- **Club Distribution**: Pie chart of clubs used in the session
- **Performance Trend**: Line chart of carry, ball speed, and smash factor over time
- **Accuracy Gauge**: Radial gauge showing on-target %, fairway %, avg carry
- **Session Bar**: Live indicator, session timer, launch-monitor connection status, club selector

### Page 2 — Course Play Dashboard
- **Course Header**: Course name, hole, par, distance, wind
- **Hole Map**: Canvas-rendered top-down hole with shot path overlay
- **18-hole Scorecard**: Color-coded eagle/birdie/par/bogey/double+
- **Round Stats**: Score vs par, Fairways Hit %, GIR %, Putts
- **Score Trend**: Cumulative score vs par line chart per hole
- **Round Summary**: Distribution bar chart + best/worst hole
- **Per-Hole Analysis**: Detailed breakdown for the selected hole
- **Hole Selector**: Click any hole 1–18 with color-coded score indicators

### Real-time System
- **GSPro Connect receiver**: TCP server on port 921 that accepts launch-monitor shots (heartbeats + BallData/ClubData), exactly like GSPro
- **open-golf-coach reverse-calc**: derives club speed, smash, club path, face-to-target/path, carry/total, apex, spin decomposition, and shot name/rank from ball data
- WebSocket for sub-second shot push from backend → all connected clients (with auto-reconnect)
- Club selection from the browser (tags incoming shots, since GSPro ball data carries no club name)

---

## Project Structure

```
swing_dashboard/
├── backend/
│   ├── main.py            # FastAPI app, WebSocket hub, REST endpoints
│   ├── gspro_connect.py   # GSPro Open Connect V1 TCP receiver (port 921)
│   ├── ogc.py             # open-golf-coach reverse-calc wrapper
│   ├── simulator.py       # Course Play demo-round generator
│   ├── database.py        # aiosqlite helpers
│   ├── models.py          # Pydantic models
│   ├── tools/
│   │   └── fake_lm.py     # Fake launch monitor (test client, no hardware needed)
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── DrivingRange.jsx
    │   │   └── CourseDashboard.jsx
    │   ├── components/   # 10+ reusable components
    │   └── hooks/
    │       └── useWebSocket.js
    ├── .env
    └── vite.config.js
```

---

## Quick Start

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The API and WebSocket server starts at `http://localhost:8000`, and the GSPro Connect
receiver starts on TCP port **921**. Point your launch monitor's GSPro Connect output at
this machine's IP on port 921. (`pip install` pulls in `opengolfcoach` for the reverse-calc.)

> Port 921 is privileged on some systems and may need elevated permissions, or override it
> with `GSPRO_CONNECT_PORT` / `GSPRO_CONNECT_HOST` env vars.

**No launch monitor handy?** Drive the full pipeline with the bundled fake client:

```bash
python tools/fake_lm.py 127.0.0.1 921 4   # sends 4 sample shots
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## REST API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check + active WS connections |
| GET | `/api/session/current` | Current session info |
| GET | `/api/shots` | Last 50 shots (from DB) |
| GET | `/api/shots/buffer` | In-memory shot buffer |
| GET | `/api/sessions` | List all sessions |
| GET | `/api/sessions/{id}/shots` | Shots for a specific session |
| GET | `/api/course/demo` | Generate a full demo 18-hole round (Course Play page) |
| GET | `/api/course/hole/{n}/path` | Shot path for a specific hole |
| POST | `/api/shot/manual` | Inject a shot in GSPro Connect format (BallData JSON) — no hardware needed |

`/api/health` also reports `gspro_listening`, `gspro_port`, `launch_monitor_connected`, and `ogc_available`.

---

## WebSocket Protocol

**Endpoint:** `ws://localhost:8000/ws`

### Server → Client messages

```json
{ "type": "init",  "data": { "shots": [...], "session_id": "...", "current_club": "...", "lm_connected": false } }
{ "type": "shot",  "data": { ...shot fields... } }
{ "type": "lm_status", "data": { "connected": true, "device_id": "..." } }
{ "type": "club_change", "data": { "club": "Driver" } }
{ "type": "hole_change", "data": { ...course fields... } }
{ "type": "ping" }
```

### Client → Server messages

```json
{ "action": "set_club", "club": "Driver" }
{ "action": "next_hole" }
```

### Shot Data Format

```json
{
  "id": 42,
  "session_id": "session_20260502_120000",
  "timestamp": "2026-05-02T12:34:56.789",
  "club": "7 Iron",
  "ball_speed": 126.4,
  "club_speed": 85.2,
  "smash_factor": 1.48,
  "launch_angle": 21.3,
  "spin_rate": 6120,
  "carry_distance": 163.8,
  "total_distance": 177.4,
  "lateral_offset": -4.2,
  "shot_shape": "draw",
  "apex_height": 28.6,
  "in_target": true,
  "shot_number": 42
}
```

---

## Data flow — GSPro Connect + open-golf-coach

```
Launch monitor ──(GSPro Open Connect V1, TCP :921)──▶ gspro_connect.py
        │  BallData {Speed, VLA, HLA, TotalSpin, SpinAxis, ...}
        ▼
     ogc.py  ──▶ opengolfcoach.calculate_derived_values()   (reverse calculation)
        │  ↳ club speed, smash, club path, face-to-target/path,
        │    carry/total/offline distance, apex, spin decomposition,
        │    shot name / rank / colour
        ▼
   main.py  ──(WebSocket "shot")──▶  React dashboard
```

- **Non-intrusive:** SwingDash *is* the GSPro Connect endpoint the launch monitor talks to.
  It never sits between the launch monitor and a real GSPro instance and injects nothing into
  GSPro — point the launch monitor at SwingDash (host:921) directly.
- **Reverse calculation:** launch monitors typically report only ball flight; open-golf-coach
  derives the club/swing-side numbers from that ball data. If the monitor *does* send measured
  `ClubData`, those values override the estimate (see `ogc._apply_measured_club_data`).
- **Handedness:** the library returns hand-dependent fields as `{left_handed, right_handed}`;
  SwingDash uses the right-handed variant by default (`hand` arg in `ogc.derive`).

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite, Tailwind CSS v3, Recharts, Framer Motion, React Router |
| Backend | FastAPI, uvicorn, websockets, aiosqlite |
| Database | SQLite (auto-created as `swing_data.db`) |
| Live data | GSPro Open Connect V1 (TCP :921) + open-golf-coach reverse-calc |