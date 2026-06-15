"""GSPro Connect club-code helpers.

GSPro reports the currently selected club in its response `Player.Club` as a short code
(e.g. "DR", "I7", "W3", "PT"). Expand it to a readable label for the dashboard.
"""

_FIXED = {
    "DR": "Driver",
    "HY": "Hybrid",
    "PT": "Putter",
    "PW": "PW",
    "GW": "GW",
    "AW": "AW",
    "SW": "SW",
    "LW": "LW",
}


def club_label(code: str) -> str:
    if not code:
        return ""
    c = str(code).strip().upper()
    if c in _FIXED:
        return _FIXED[c]
    # W2..W7 -> "2 Wood"; I1..I9 -> "1 Iron"
    if len(c) == 2 and c[1].isdigit():
        if c[0] == "W":
            return f"{c[1]} Wood"
        if c[0] == "I":
            return f"{c[1]} Iron"
    return code  # unknown -> pass through raw


def hand_from_gspro(handed: str) -> str:
    """Map GSPro 'RH'/'LH' to the open-golf-coach handedness key."""
    return "left_handed" if str(handed or "").strip().upper() == "LH" else "right_handed"
