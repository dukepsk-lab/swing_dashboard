# SwingDash — Golf Simulator Dashboard

A professional, real-time golf simulator analytics dashboard inspired by Trackman / GSPro, built with **React + Tailwind CSS + Recharts** (frontend) and **FastAPI + WebSocket** (backend).

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
- **Session Bar**: Live indicator, session timer, club selector, manual shot trigger

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
- WebSocket for sub-second shot push from backend → all connected clients
- Auto-reconnect on disconnect
- Manual shot trigger button + club selection from browser
- GSPro-compatible JSON shot format

---

## Project Structure

```
swing_dashboard/
├── backend/
│   ├── main.py          # FastAPI app, WebSocket hub, REST endpoints
│   ├── simulator.py     # Shot data generator (9 club profiles)
│   ├── database.py      # aiosqlite helpers
│   ├── models.py        # Pydantic models
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

The API and WebSocket server starts at `http://localhost:8000`.

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
| GET | `/api/course/demo` | Generate a full simulated 18-hole round |
| GET | `/api/course/hole/{n}/path` | Shot path for a specific hole |
| POST | `/api/shot/manual` | Manually trigger a shot |

---

## WebSocket Protocol

**Endpoint:** `ws://localhost:8000/ws`

### Server → Client messages

```json
{ "type": "init",  "data": { "shots": [...], "session_id": "...", "current_club": "..." } }
{ "type": "shot",  "data": { ...shot fields... } }
{ "type": "club_change", "data": { "club": "Driver" } }
{ "type": "hole_change", "data": { ...course fields... } }
{ "type": "ping" }
```

### Client → Server messages

```json
{ "action": "set_club",    "club": "Driver" }
{ "action": "trigger_shot" }
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

## GSPro Integration

The backend is ready to accept real GSPro data. To connect:

1. Configure GSPro to send JSON data to `localhost:8000/api/shot/manual` (POST)  
   **or** implement a UDP listener in `simulator.py` that reads from GSPro's local data port
2. The WebSocket will automatically broadcast each received shot to all connected browsers

For direct WebSocket mode, modify `simulator.py` to read from GSPro's local stream instead of the random generator.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite, Tailwind CSS v3, Recharts, Framer Motion, React Router |
| Backend | FastAPI, uvicorn, websockets, aiosqlite |
| Database | SQLite (auto-created as `swing_data.db`) |
| Data | Simulated 9-club shot model with realistic stat distributions |