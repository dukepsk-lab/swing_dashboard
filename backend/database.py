import aiosqlite
import json
from typing import List, Optional

DB_PATH = "swing_data.db"


async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS shots (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                timestamp TEXT,
                club TEXT,
                ball_speed REAL,
                club_speed REAL,
                smash_factor REAL,
                launch_angle REAL,
                spin_rate REAL,
                carry_distance REAL,
                total_distance REAL,
                lateral_offset REAL,
                shot_shape TEXT,
                apex_height REAL,
                in_target INTEGER,
                shot_number INTEGER
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS course_rounds (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                course_name TEXT,
                scores TEXT,
                created_at TEXT
            )
        """)
        await db.commit()


async def save_shot(shot: dict):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            INSERT INTO shots (session_id, timestamp, club, ball_speed, club_speed,
                smash_factor, launch_angle, spin_rate, carry_distance, total_distance,
                lateral_offset, shot_shape, apex_height, in_target, shot_number)
            VALUES (:session_id, :timestamp, :club, :ball_speed, :club_speed,
                :smash_factor, :launch_angle, :spin_rate, :carry_distance, :total_distance,
                :lateral_offset, :shot_shape, :apex_height, :in_target, :shot_number)
        """, {**shot, "in_target": int(shot.get("in_target", True))})
        await db.commit()


async def get_session_shots(session_id: str, limit: int = 50) -> List[dict]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM shots WHERE session_id = ? ORDER BY shot_number DESC LIMIT ?",
            (session_id, limit)
        ) as cursor:
            rows = await cursor.fetchall()
            return [dict(r) for r in rows]


async def get_all_sessions() -> List[dict]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT session_id, COUNT(*) as shot_count, MIN(timestamp) as start, MAX(timestamp) as last "
            "FROM shots GROUP BY session_id ORDER BY last DESC LIMIT 20"
        ) as cursor:
            rows = await cursor.fetchall()
            return [dict(r) for r in rows]


async def save_round(session_id: str, course_name: str, scores: list):
    from datetime import datetime
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "INSERT INTO course_rounds (session_id, course_name, scores, created_at) VALUES (?, ?, ?, ?)",
            (session_id, course_name, json.dumps(scores), datetime.utcnow().isoformat())
        )
        await db.commit()


async def get_rounds(limit: int = 10) -> List[dict]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM course_rounds ORDER BY created_at DESC LIMIT ?", (limit,)
        ) as cursor:
            rows = await cursor.fetchall()
            result = []
            for r in rows:
                d = dict(r)
                d["scores"] = json.loads(d["scores"])
                result.append(d)
            return result
