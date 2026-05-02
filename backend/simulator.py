import random
import math
import asyncio
from datetime import datetime

CLUB_PROFILES = {
    "Driver":    {"ball_speed": (155, 175), "club_speed": (105, 120), "launch": (10, 14),  "spin": (2200, 2800), "carry": (240, 290), "total": (260, 320)},
    "3 Wood":    {"ball_speed": (145, 162), "club_speed": (98, 110),  "launch": (12, 16),  "spin": (2800, 3400), "carry": (215, 255), "total": (235, 275)},
    "5 Iron":    {"ball_speed": (128, 145), "club_speed": (88, 98),   "launch": (17, 22),  "spin": (4200, 5200), "carry": (175, 205), "total": (190, 220)},
    "6 Iron":    {"ball_speed": (122, 138), "club_speed": (84, 94),   "launch": (18, 23),  "spin": (4800, 5800), "carry": (162, 192), "total": (175, 208)},
    "7 Iron":    {"ball_speed": (116, 132), "club_speed": (80, 90),   "launch": (19, 25),  "spin": (5500, 6500), "carry": (148, 178), "total": (160, 193)},
    "8 Iron":    {"ball_speed": (110, 126), "club_speed": (76, 86),   "launch": (21, 26),  "spin": (6200, 7200), "carry": (135, 162), "total": (146, 176)},
    "9 Iron":    {"ball_speed": (104, 120), "club_speed": (72, 82),   "launch": (23, 28),  "spin": (7000, 8200), "carry": (120, 148), "total": (130, 160)},
    "PW":        {"ball_speed": (98, 114),  "club_speed": (68, 78),   "launch": (25, 30),  "spin": (8000, 9500), "carry": (108, 132), "total": (115, 142)},
    "SW":        {"ball_speed": (88, 106),  "club_speed": (60, 72),   "launch": (27, 34),  "spin": (9500, 11000),"carry": (85, 115),  "total": (88, 120)},
}

CLUBS = list(CLUB_PROFILES.keys())
COURSE_NAMES = ["Pebble Beach", "Augusta National", "St Andrews", "Torrey Pines", "Bethpage Black"]

HOLE_PARS = [4, 4, 3, 5, 4, 3, 4, 4, 5, 4, 3, 4, 5, 4, 3, 4, 4, 5]
HOLE_DISTANCES = [420, 380, 175, 520, 395, 165, 410, 440, 540, 385, 190, 370, 510, 430, 180, 400, 415, 550]


def _rnd(lo, hi, noise=0.05):
    base = random.uniform(lo, hi)
    return round(base * (1 + random.uniform(-noise, noise)), 1)


def generate_shot(club: str = None, shot_number: int = 1, session_id: str = "default") -> dict:
    if club is None:
        club = random.choice(CLUBS)
    p = CLUB_PROFILES.get(club, CLUB_PROFILES["7 Iron"])

    ball_speed  = _rnd(*p["ball_speed"])
    club_speed  = _rnd(*p["club_speed"])
    smash       = round(ball_speed / club_speed, 2)
    launch      = _rnd(*p["launch"])
    spin        = int(_rnd(*p["spin"]))
    carry       = _rnd(*p["carry"])
    total       = _rnd(*p["total"])
    lateral     = round(random.gauss(0, 12), 1)
    apex        = round(carry * math.tan(math.radians(launch)) * 0.18, 1)

    if abs(lateral) < 8:
        shot_shape = "straight"
    elif lateral > 0:
        shot_shape = "fade" if lateral < 20 else "slice"
    else:
        shot_shape = "draw" if lateral > -20 else "hook"

    in_target = abs(lateral) < 18 and carry > p["carry"][0] * 0.85

    return {
        "id": shot_number,
        "session_id": session_id,
        "timestamp": datetime.utcnow().isoformat(),
        "club": club,
        "ball_speed": ball_speed,
        "club_speed": club_speed,
        "smash_factor": smash,
        "launch_angle": launch,
        "spin_rate": spin,
        "carry_distance": carry,
        "total_distance": total,
        "lateral_offset": lateral,
        "shot_shape": shot_shape,
        "apex_height": apex,
        "in_target": in_target,
        "shot_number": shot_number,
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
