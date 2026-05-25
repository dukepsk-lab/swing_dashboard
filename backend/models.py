from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ShotData(BaseModel):
    id: Optional[int] = None
    session_id: str
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    club: str
    ball_speed: float
    club_speed: float
    smash_factor: float
    launch_angle: float
    spin_rate: float
    backspin: float = 0.0
    sidespin: float = 0.0
    spin_axis: float = 0.0
    carry_distance: float
    total_distance: float
    lateral_offset: float = 0.0
    shot_shape: str = "straight"
    apex_height: float = 0.0
    in_target: bool = True
    shot_number: int = 1
    angle_of_attack: float = -4.5
    club_path: float = 0.0
    face_to_target: float = 0.0
    face_to_path: float = 0.0
    h_face_impact: float = 0.0
    v_face_impact: float = 0.0
    shot_rank: str = "C"
    shot_rank_color: str = "#FFD600"


class CourseShot(BaseModel):
    id: Optional[int] = None
    session_id: str
    hole: int
    shot_number: int
    club: str
    distance: float
    result: str
    x: float = 0.0
    y: float = 0.0
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class HoleScore(BaseModel):
    hole: int
    par: int
    score: int
    fairway_hit: bool
    gir: bool
    putts: int
    shots: list = []


class CourseData(BaseModel):
    course_name: str
    hole: int
    par: int
    distance: int
    wind_speed: float = 0.0
    wind_direction: str = "N"


class SessionInfo(BaseModel):
    session_id: str
    start_time: str
    mode: str
    shot_count: int = 0
    current_club: str = "7 Iron"
