"""
History Service — Persist and retrieve conversation turns in MongoDB.
"""
from datetime import datetime, timezone
from database import get_db


COLLECTION = "conversations"


async def save_turn(session_id: str, user_id: str, role: str, content: str) -> None:
    db = get_db()
    await db[COLLECTION].insert_one(
        {
            "session_id": session_id,
            "user_id": user_id,
            "role": role,          # "user" | "model"
            "content": content,
            "timestamp": datetime.now(timezone.utc),
        }
    )


async def get_history(session_id: str, user_id: str) -> list[dict]:
    db = get_db()
    cursor = (
        db[COLLECTION]
        .find(
            {"session_id": session_id, "user_id": user_id},
            {"_id": 0},
        )
        .sort("timestamp", 1)
    )
    return await cursor.to_list(length=500)


async def clear_history(session_id: str, user_id: str) -> int:
    db = get_db()
    result = await db[COLLECTION].delete_many(
        {"session_id": session_id, "user_id": user_id}
    )
    return result.deleted_count
