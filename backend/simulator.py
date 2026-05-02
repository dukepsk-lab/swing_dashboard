import random
import math
import asyncio
import json
import logging
from datetime import datetime

import opengolfcoach

log = logging.getLogger(__name__)

MPH_TO_MPS = 1 / 2.23694
YDS_PER_METER = 1.09361

# Each profile defines the raw launch monitor inputs; OGC derives everything else.
CLUB_PROFILES = {
    "Driver": {"ball_speed": (155, 175), "club_speed": (105, 120), "launch": (10, 14),  "spin": (2200, 2800), "spin_axis_std": 10, "h_launch_std": 2.0},
    "3 Wood": {"ball_speed": (145, 162), "club_speed": (98, 110),  "launch": (12, 16),  "spin": (2800, 3400), "spin_axis_std": 11, "h_launch_std": 2.2},
    "5 Iron": {"ball_speed": (128, 145), "club_speed": (88, 98),   "launch": (17, 22),  "spin": (4200, 5200), "spin_axis_std": 12, "h_launch_std": 2.5},
    "6 Iron": {"ball_speed": (122, 138), "club_speed": (84, 94),   "launch": (18, 23),  "spin": (4800, 5800), "spin_axis_std": 13, "h_launch_std": 2.5},
    "7 Iron": {"ball_speed": (116, 132), "club_speed": (80, 90),   "launch": (19, 25),  "spin": (5500, 6500), "spin_axis_std": 13, "h_launch_std": 2.5},
    "8 Iron": {"ball_speed": (110, 126), "club_speed": (76, 86),   "launch": (21, 26),  "spin": (6200, 7200), "spin_axis_std": 14, "h_launch_std": 2.8},
    "9 Iron": {"ball_speed": (104, 120), "club_speed": (72, 82),   "launch": (23, 28),  "spin": (7000, 8200), "spin_axis_std": 14, "h_launch_std": 2.8},
    "PW":     {"ball_speed": (98, 114),  "club_speed": (68, 78),   "launch": (25, 30),  "spin": (8000, 9500), "spin_axis_std": 15, "h_launch_std": 3.0},
    "SW":     {"ball_speed": (88, 106),  "club_speed": (60, 72),   "launch": (27, 34),  "spin": (9500, 11000),"spin_axis_std": 16, "h_launch_std": 3.5},
}

_SHAPE_WORD_MAP = {"hook": "hook", "draw": "draw", "straight": "straight", "fade": "fade", "slice": "slice"}


def _rnd(lo, hi, noise=0.04):
    return round(random.uniform(lo, hi) * (1 + random.uniform(-noise, noise)), 1)


def _ogc_color_to_css(color_str: str) -> str:
    """Convert OGC hex '0xFF7043' → CSS '#FF7043'."""
    return "#" + color_str[2:] if color_str.startswith("0x") else color_str


def enrich_with_ogc(
    ball_speed_mph: float,
    vertical_launch: float,
    h_launch: float,
    total_spin_rpm: float,
    spin_axis_deg: float,
    traj_hz: int = 30,
) -> dict:
    """
    Call open-golf-coach to derive carry/total/offline distance, trajectory,
    shot classification, and spin decomposition from raw launch monitor inputs.
    Returns a flat dict of enriched fields, or an empty dict on failure.
    """
    ogc_input = {
        "ball_speed_meters_per_second": ball_speed_mph * MPH_TO_MPS,
        "vertical_launch_angle_degrees": vertical_launch,
        "horizontal_launch_angle_degrees": h_launch,
        "total_spin_rpm": total_spin_rpm,
        "spin_axis_degrees": spin_axis_deg,
        "trajectory_enabled": True,
        "trajectory_output_framerate_hz": traj_hz,
    }
    try:
        result = json.loads(opengolfcoach.calculate_derived_values(json.dumps(ogc_input)))
    except Exception as exc:
        log.warning("open-golf-coach failed: %s", exc)
        return {}

    ogc = result["open_golf_coach"]
    us  = ogc["us_customary_units"]

    # Shot classification (right-handed perspective)
    shot_name_rh  = ogc["shot_name"]["right_handed"]
    shot_rank_rh  = ogc["shot_rank"]["right_handed"]
    shot_color_rh = _ogc_color_to_css(ogc["shot_color_rgb"]["right_handed"])
    shape_word    = shot_name_rh.split()[-1].lower()
    shot_shape    = _SHAPE_WORD_MAP.get(shape_word, "straight")

    # Trajectory: convert metres → yards, downsample to ≤60 points for WS payload
    raw_pts = ogc["trajectory"]["points"]
    step    = max(1, len(raw_pts) // 60)
    trajectory = [
        {"t": p["t"],
         "x": round(p["x"] * YDS_PER_METER, 2),   # forward (yds)
         "y": round(p["y"] * YDS_PER_METER, 2),   # lateral right (yds)
         "z": round(p["z"] * YDS_PER_METER, 2)}   # height (yds)
        for p in raw_pts[::step]
    ]

    # Peak height from trajectory
    apex = round(max((p["z"] for p in raw_pts), default=0.0) * YDS_PER_METER, 1)

    return {
        "carry_distance":  round(us["carry_distance_yards"], 1),
        "total_distance":  round(us["total_distance_yards"], 1),
        "lateral_offset":  round(us["offline_distance_yards"], 1),
        "apex_height":     apex,
        "shot_shape":      shot_shape,
        "shot_name":       shot_name_rh,
        "shot_rank":       shot_rank_rh,
        "shot_color":      shot_color_rh,
        "backspin_rpm":    round(ogc.get("backspin_rpm", 0.0), 1),
        "sidespin_rpm":    round(ogc.get("sidespin_rpm", 0.0), 1),
        "trajectory":      trajectory,
    }


def generate_shot(club: str = None, shot_number: int = 1, session_id: str = "default") -> dict:
    if club is None:
        club = random.choice(list(CLUB_PROFILES.keys()))
    p = CLUB_PROFILES.get(club, CLUB_PROFILES["7 Iron"])

    ball_speed  = _rnd(*p["ball_speed"])
    club_speed  = _rnd(*p["club_speed"])
    smash       = round(ball_speed / club_speed, 3)
    launch      = _rnd(*p["launch"])
    spin_rpm    = _rnd(*p["spin"])
    spin_axis   = round(random.gauss(0, p["spin_axis_std"]), 1)
    h_launch    = round(random.gauss(0, p["h_launch_std"]), 1)

    enriched = enrich_with_ogc(ball_speed, launch, h_launch, spin_rpm, spin_axis)

    # Fallback values if OGC fails (keeps old parabola logic)
    if not enriched:
        min_carry = p.get("carry_min", p["ball_speed"][0] * 1.3)
        lateral   = round(random.gauss(0, 12), 1)
        carry     = round(ball_speed * 1.38 + random.gauss(0, 8), 1)
        enriched  = {
            "carry_distance": carry,
            "total_distance": round(carry * 1.08, 1),
            "lateral_offset": lateral,
            "apex_height":    round(carry * math.tan(math.radians(launch)) * 0.18, 1),
            "shot_shape":     "straight",
            "shot_name":      "Straight",
            "shot_rank":      "C",
            "shot_color":     "#39FF14",
            "backspin_rpm":   0.0,
            "sidespin_rpm":   0.0,
            "trajectory":     [],
        }

    in_target = (abs(enriched["lateral_offset"]) < 18
                 and enriched["carry_distance"] > p["ball_speed"][0] * 1.15)

    return {
        "id":           shot_number,
        "session_id":   session_id,
        "timestamp":    datetime.utcnow().isoformat(),
        "club":         club,
        "ball_speed":   ball_speed,
        "club_speed":   club_speed,
        "smash_factor": smash,
        "launch_angle": launch,
        "spin_rate":    int(spin_rpm),
        "in_target":    in_target,
        "shot_number":  shot_number,
        "source":       "simulated",
        **enriched,
    }


def generate_course_session() -> dict:
    scores = []
    for i in range(18):
        par = HOLE_PARS[i]
        dist = HOLE_DISTANCES[i]
        variance = random.randint(-2, 3)
        score = max(1, par + variance)
        scores.append({
            "hole": i + 1,
            "par": par,
            "distance": dist,
            "score": score,
            "fairway_hit": random.random() > 0.35,
            "gir": random.random() > 0.40,
            "putts": random.randint(1, 3),
        })
    return {
        "course_name": random.choice(COURSE_NAMES),
        "scores": scores,
    }


def generate_hole_shot_path(hole: int, par: int, distance: int) -> list:
    shots = []
    remaining = distance
    x, y = 0.0, 0.0

    for shot_num in range(par + 1):
        if remaining <= 0:
            break
        lateral = random.gauss(0, 15)
        advance  = min(remaining, remaining * random.uniform(0.45, 0.85))
        x += lateral
        y += advance
        remaining -= advance
        shots.append({"x": round(x, 1), "y": round(y, 1), "label": f"S{shot_num+1}"})
        if remaining < 40:
            break

    shots.append({"x": round(x + random.gauss(0, 5), 1), "y": round(distance, 1), "label": "Hole"})
    return shots


class DataSimulator:
    def __init__(self):
        self._shot_counter = 0
        self._current_club = "7 Iron"
        self._club_cycle = 0
        self._club_list = CLUBS

    def next_shot(self, session_id: str = "live") -> dict:
        self._shot_counter += 1
        if self._shot_counter % 5 == 0:
            self._club_cycle = (self._club_cycle + 1) % len(self._club_list)
            self._current_club = self._club_list[self._club_cycle]
        return generate_shot(self._current_club, self._shot_counter, session_id)

    async def stream(self, callback, interval: float = 3.0, session_id: str = "live"):
        while True:
            await asyncio.sleep(interval)
            shot = self.next_shot(session_id)
            await callback(shot)
