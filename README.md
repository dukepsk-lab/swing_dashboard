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
│   ├── gspro_connect.py   # GSPro Open Connect V1 receiver + transparent relay (port 921)
│   ├── ogc.py             # open-golf-coach reverse-calc wrapper
│   ├── gspro_codes.py     # GSPro club-code → label / handedness helpers
│   ├── simulator.py       # Course Play demo-round generator
│   ├── database.py        # aiosqlite helpers
│   ├── models.py          # Pydantic models
│   ├── tools/
│   │   ├── fake_lm.py     # Fake launch monitor (test client, no hardware needed)
│   │   └── fake_gspro.py  # Fake upstream GSPro (for testing relay mode)
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

### One-click (recommended)

Run everything — backend, dashboard, and the GSPro Connect receiver — from a single command.
It serves the built dashboard from FastAPI, so the whole app lives on **one port**
(`http://localhost:8000`) and the browser opens automatically.

| OS | Run |
|----|-----|
| **Windows** | double-click **`start.bat`** |
| **macOS / Linux** | `./start.sh` |

The first run creates a Python virtual env, installs dependencies, and builds the dashboard
(needs **Python 3.10+** and **Node 18+** installed); later runs skip straight to launching.
Keep the window open while you play; close it to stop.

#### Standalone Windows program (.exe)

Want a single file that needs **neither Python nor Node** on the playing PC? On a Windows
machine run **`build_exe.bat`** — it builds the dashboard and packages everything with
PyInstaller into **`dist\SWINGBOX.exe`**. Copy that one file anywhere and double-click to run.

> The `.exe` must be built on Windows (PyInstaller is platform-specific). `start.bat` is the
> simplest option if Python + Node are already installed.

### Manual / development setup

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

#### Modes: standalone vs relay

| Mode | Topology | What you get |
|------|----------|--------------|
| **Standalone** (default) | launch monitor → SwingDash :921 | Ball data → reverse-calc. Club is chosen in the dashboard. |
| **Relay** | launch monitor → SwingDash → real GSPro | Same reverse-calc **plus** the selected club & handedness that GSPro reports back (`Player.Club`/`Player.Handed`). Bytes are forwarded unchanged both ways, so GSPro and the launch monitor behave exactly as normal. |

Enable relay with env vars (point the launch monitor at SwingDash, and SwingDash at GSPro):

```bash
# SwingDash listens on 922 for the LM and relays to real GSPro on 127.0.0.1:921
GSPRO_CONNECT_PORT=922 GSPRO_UPSTREAM_HOST=127.0.0.1 GSPRO_UPSTREAM_PORT=921 \
  uvicorn main:app --port 8000
```

> Since GSPro itself uses port 921, on a single machine run SwingDash's listener on another
> port (point the LM connector there) or run GSPro on a second machine. If the upstream GSPro is
> unreachable, SwingDash falls back to self-acking so the launch monitor keeps working.
>
> Test relay with no hardware: `python tools/fake_gspro.py 922 I7 RH` (a stub GSPro that acks
> with a selected club), then run the backend in relay mode against it and fire `fake_lm.py`.

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
{ "type": "club_change", "data": { "club": "Driver", "source": "gspro" } }
{ "type": "hand_change", "data": { "hand": "right_handed" } }
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

- **Non-intrusive:** in **standalone** mode SwingDash *is* the GSPro Connect endpoint the launch
  monitor talks to — point the LM at SwingDash directly, no real GSPro needed. In **relay** mode
  SwingDash forwards every byte unchanged between the LM and a real GSPro and only *taps* the
  stream, so both programs behave exactly as normal (nothing injected into GSPro).
- **Reverse calculation:** launch monitors typically report only ball flight; open-golf-coach
  derives the club/swing-side numbers from that ball data. If the monitor *does* send measured
  `ClubData`, those values override the estimate (see `ogc._apply_measured_club_data`).
- **Selected club & handedness (relay only):** GSPro's response carries a `Player` object with
  `{Handed, Club}` — the only downstream info the protocol provides. The relay reads it
  (`gspro_connect._tap_gspro_to_lm` → `main.on_player`), expands the club code via
  `gspro_codes.club_label`, auto-updates the dashboard club, and feeds handedness into
  `ogc.derive(hand=...)`. The protocol carries **no** course, hole, lie/surface, or ball-position
  data, so those are out of scope.
- **Handedness:** the library returns hand-dependent fields as `{left_handed, right_handed}`;
  SwingDash uses right-handed by default and switches to GSPro's reported hand in relay mode.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite, Tailwind CSS v3, Recharts, Framer Motion, React Router |
| Backend | FastAPI, uvicorn, websockets, aiosqlite |
| Database | SQLite (auto-created as `swing_data.db`) |
| Live data | GSPro Open Connect V1 (standalone receiver or transparent relay) + open-golf-coach reverse-calc |