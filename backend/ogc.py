"""open-golf-coach reverse-calculation wrapper.

Takes GSPro Connect `BallData` (ball flight measured by the launch monitor) and uses the
official `opengolfcoach` library to *derive* the club/swing-side metrics that the launch
monitor did not measure - club speed, smash factor, club path, face-to-target,
face-to-path - plus distances, spin decomposition and a shot classification.

Library: https://github.com/OpenLaunchLabs/open-golf-coach  (pip install opengolfcoach)
    opengolfcoach.calculate_derived_values(json_string) -> json_string

The library returns an `open_golf_coach` object. Several fields are hand-dependent and
come as {"left_handed": ..., "right_handed": ...}; we read the right-handed variant by
default. Distances are available in metres and (under `us_customary_units`) in yards.
"""

import json
import logging
import math
from datetime import datetime
from typing import Optional

log = logging.getLogger("ogc")

MPH_PER_MS = 2.2369362921
YARDS_PER_METER = 1.0936132983
FEET_PER_YARD = 3.0
FEET_PER_METER = 3.280839895

# Shot-shape thresholds (degrees of spin axis) - matches open-golf-coach shot_classifier
SHAPE_HOOK, SHAPE_DRAW, SHAPE_NONE, SHAPE_FADE = -12.0, -3.0, 3.0, 12.0

RANK_COLORS = {
    "S+": "#00BFFF", "S": "#4FC3F7", "A": "#39FF14",
    "B": "#ADFF2F", "C": "#FFD600", "D": "#FF6B35", "E": "#FF4444",
}

_lib = None
_lib_checked = False


def _get_lib():
    """Import opengolfcoach lazily so the server still boots if it is not installed."""
    global _lib, _lib_checked
    if not _lib_checked:
        _lib_checked = True
        try:
            import opengolfcoach  # type: ignore
            _lib = opengolfcoach
        except Exception as e:  # pragma: no cover - depends on runtime env
            log.error("opengolfcoach not available (%s); install with `pip install opengolfcoach`", e)
            _lib = None
    return _lib


def available() -> bool:
    return _get_lib() is not None


def _to_float(v, default=0.0):
    try:
        return float(v)
    except (TypeError, ValueError):
        return default


def _handed(value, hand="right_handed"):
    """Hand-dependent OGC fields arrive as {left_handed, right_handed}; pick one."""
    if isinstance(value, dict):
        return value.get(hand)
    return value


def _shape_from_axis(spin_axis: float) -> str:
    if spin_axis < SHAPE_HOOK:
        return "hook"
    if spin_axis < SHAPE_DRAW:
        return "draw"
    if spin_axis <= SHAPE_NONE:
        return "straight"
    if spin_axis <= SHAPE_FADE:
        return "fade"
    return "slice"


def _build_input(ball: dict) -> dict:
    """Map GSPro BallData (mph / rpm / degrees) to the library's metric input."""
    speed_mph = _to_float(ball.get("Speed"))
    inp = {
        "ball_speed_meters_per_second": speed_mph / MPH_PER_MS,
        "vertical_launch_angle_degrees": _to_float(ball.get("VLA")),
        "horizontal_launch_angle_degrees": _to_float(ball.get("HLA")),
        "trajectory_enabled": False,
    }
    total_spin = ball.get("TotalSpin")
    if total_spin is not None:
        inp["total_spin_rpm"] = _to_float(total_spin)
        inp["spin_axis_degrees"] = _to_float(ball.get("SpinAxis"))
    elif ball.get("BackSpin") is not None or ball.get("SideSpin") is not None:
        inp["backspin_rpm"] = _to_float(ball.get("BackSpin"))
        inp["sidespin_rpm"] = _to_float(ball.get("SideSpin"))
    return inp


def derive(ball: dict, club_data: Optional[dict] = None, club: str = "7 Iron",
           session_id: str = "live", shot_number: int = 1, hand: str = "right_handed") -> dict:
    """Run the open-golf-coach reverse calculation and return a SwingDash shot dict.

    Measured launch-monitor club data (if the monitor sent any) overrides the estimate.
    """
    lib = _get_lib()

    speed_mph = _to_float(ball.get("Speed"))
    vla = _to_float(ball.get("VLA"))
    hla = _to_float(ball.get("HLA"))
    total_spin = _to_float(ball.get("TotalSpin"))
    spin_axis = _to_float(ball.get("SpinAxis"))

    out, us = {}, {}
    if lib is not None:
        try:
            result = json.loads(lib.calculate_derived_values(json.dumps(_build_input(ball))))
            out = result.get("open_golf_coach", {}) or {}
            us = out.get("us_customary_units", {}) or {}
        except Exception:
            log.exception("opengolfcoach.calculate_derived_values failed; using ball data only")

    # --- derived club / swing metrics ---
    club_speed_mph = _to_float(us.get("club_speed_mph"))
    if not club_speed_mph:
        club_speed_mph = _to_float(out.get("club_speed_meters_per_second")) * MPH_PER_MS
    smash = _to_float(out.get("smash_factor"))
    if not smash and club_speed_mph:
        smash = speed_mph / club_speed_mph
    club_path = _to_float(_handed(out.get("club_path_degrees"), hand))
    face_target = _to_float(_handed(out.get("club_face_to_target_degrees"), hand))
    face_path = _to_float(_handed(out.get("club_face_to_path_degrees"), hand))

    # --- distances (prefer yards) ---
    carry = _to_float(us.get("carry_distance_yards")) or _to_float(out.get("carry_distance_meters")) * YARDS_PER_METER
    total = _to_float(us.get("total_distance_yards")) or _to_float(out.get("total_distance_meters")) * YARDS_PER_METER
    if "offline_distance_yards" in us:
        lateral = _to_float(us.get("offline_distance_yards"))
    elif "offline_distance_meters" in out:
        lateral = _to_float(out.get("offline_distance_meters")) * YARDS_PER_METER
    else:
        lateral = round(carry * math.tan(math.radians(hla)), 1)

    # --- spin decomposition ---
    backspin = _to_float(out.get("backspin_rpm", ball.get("BackSpin")))
    sidespin = _to_float(out.get("sidespin_rpm", ball.get("SideSpin")))
    if not backspin and total_spin:
        backspin = total_spin * math.cos(math.radians(abs(spin_axis)))
    if not sidespin and total_spin:
        sidespin = total_spin * math.sin(math.radians(spin_axis))

    # --- apex (feet) ---
    if "peak_height_yards" in us:
        apex_ft = _to_float(us.get("peak_height_yards")) * FEET_PER_YARD
    elif "peak_height_meters" in out:
        apex_ft = _to_float(out.get("peak_height_meters")) * FEET_PER_METER
    else:
        apex_ft = round(carry * math.tan(math.radians(vla)) * 0.18, 1)

    # --- classification ---
    shot_name = _handed(out.get("shot_name"), hand)
    rank = _handed(out.get("shot_rank"), hand) or "C"
    color = _handed(out.get("shot_color_rgb"), hand)
    if isinstance(color, str) and color.lower().startswith("0x"):
        color = "#" + color[2:]
    if not color:
        color = RANK_COLORS.get(rank, "#FFD600")

    shot = {
        "id": shot_number,
        "session_id": session_id,
        "timestamp": datetime.utcnow().isoformat(),
        "club": club,
        "ball_speed": round(speed_mph, 1),
        "club_speed": round(club_speed_mph, 1),
        "smash_factor": round(smash, 2),
        "launch_angle": round(vla, 1),
        "spin_rate": int(total_spin) if total_spin else int(math.hypot(backspin, sidespin)),
        "backspin": int(backspin),
        "sidespin": int(sidespin),
        "spin_axis": round(spin_axis, 1),
        "carry_distance": round(carry, 1),
        "total_distance": round(total, 1),
        "lateral_offset": round(lateral, 1),
        "shot_shape": _shape_from_axis(spin_axis),
        "shot_name": shot_name or _shape_from_axis(spin_axis).title(),
        "apex_height": round(apex_ft, 1),
        "in_target": abs(lateral) < 18,
        "shot_number": shot_number,
        "angle_of_attack": -4.5,
        "club_path": round(club_path, 1),
        "face_to_target": round(face_target, 1),
        "face_to_path": round(face_path, 1),
        "h_face_impact": 0.0,
        "v_face_impact": 0.0,
        "shot_rank": rank,
        "shot_rank_color": color,
    }

    _apply_measured_club_data(shot, club_data)
    return shot


def _apply_measured_club_data(shot: dict, club_data: Optional[dict]):
    """If the launch monitor actually measured club data, prefer it over the estimate."""
    if not club_data:
        return
    if club_data.get("Speed"):
        shot["club_speed"] = round(_to_float(club_data["Speed"]), 1)
        if shot["club_speed"]:
            shot["smash_factor"] = round(shot["ball_speed"] / shot["club_speed"], 2)
    for src, dst in (("Path", "club_path"), ("FaceToTarget", "face_to_target"),
                     ("AngleOfAttack", "angle_of_attack")):
        if club_data.get(src) is not None:
            shot[dst] = round(_to_float(club_data[src]), 1)
    if club_data.get("Path") is not None and club_data.get("FaceToTarget") is not None:
        shot["face_to_path"] = round(shot["face_to_target"] - shot["club_path"], 1)
    if club_data.get("HorizontalFaceImpact") is not None:
        shot["h_face_impact"] = max(-1.0, min(1.0, _to_float(club_data["HorizontalFaceImpact"])))
    if club_data.get("VerticalFaceImpact") is not None:
        shot["v_face_impact"] = max(-1.0, min(1.0, _to_float(club_data["VerticalFaceImpact"])))
