"""Course Play demo data.

The live driving-range feed now comes from a real launch monitor via the GSPro Connect
receiver (see gspro_connect.py + ogc.py). The random shot simulator has been removed.
What remains here is the demo-round generator used by the Course Play page, which is a
separate illustrative feature and is not fed by the launch monitor.
"""

import random

CLUBS = ["Driver", "3 Wood", "5 Iron", "6 Iron", "7 Iron", "8 Iron", "9 Iron", "PW", "SW"]
COURSE_NAMES = ["Pebble Beach", "Augusta National", "St Andrews", "Torrey Pines", "Bethpage Black"]

HOLE_PARS = [4, 4, 3, 5, 4, 3, 4, 4, 5, 4, 3, 4, 5, 4, 3, 4, 4, 5]
HOLE_DISTANCES = [420, 380, 175, 520, 395, 165, 410, 440, 540, 385, 190, 370, 510, 430, 180, 400, 415, 550]


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
        advance = min(remaining, remaining * random.uniform(0.45, 0.85))
        x += lateral
        y += advance
        remaining -= advance
        shots.append({"x": round(x, 1), "y": round(y, 1), "label": f"S{shot_num+1}"})
        if remaining < 40:
            break

    shots.append({"x": round(x + random.gauss(0, 5), 1), "y": round(distance, 1), "label": "Hole"})
    return shots
