"""
Chat Router — /chat (POST), /history (GET), /clear (POST)
All endpoints are JWT-protected.
"""
import asyncio
import re
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from routers.auth import get_current_user
from services.safety_service import scan_prompt
from services.history_service import save_turn, get_history, clear_history
from services.gemini_service import stream_response

router = APIRouter(prefix="/chat", tags=["Chat"])

CurrentUser = Annotated[dict, Depends(get_current_user)]

# Regex to detect our end-of-stream sentinel
_END_PATTERN = re.compile(r"\n__END__(.*)__END__$", re.DOTALL)


# ── Schemas ───────────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    prompt: str
    session_id: str = "default"


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("")
async def chat(body: ChatRequest, current_user: CurrentUser):
    """
    1. Safety scan the prompt
    2. Load existing history from MongoDB
    3. Stream Gemini response back to client (SSE-style plain text chunks)
    4. Persist both the user prompt and model reply to MongoDB
    """
    # Step 1 — Safety layer
    scan_prompt(body.prompt)

    user_id = current_user["user_id"]

    # Step 2 — Load history for context
    history = await get_history(body.session_id, user_id)

    # Step 3 — Stream response
    collected_chunks: list[str] = []

    async def event_stream():
        full_model_reply = ""
        async for chunk in stream_response(body.prompt, history):
            match = _END_PATTERN.search(chunk)
            if match:
                full_model_reply = match.group(1)
                # Persist both turns after streaming completes
                try:
                    asyncio.create_task(
                        save_turn(body.session_id, user_id, "user", body.prompt)
                    )
                    asyncio.create_task(
                        save_turn(body.session_id, user_id, "model", full_model_reply)
                    )
                except Exception as e:
                    print(f"Failed to save history to MongoDB: {e}")
                # Don't send sentinel to client
                break
            else:
                collected_chunks.append(chunk)
                yield chunk

    return StreamingResponse(event_stream(), media_type="text/plain; charset=utf-8")


@router.get("/history")
async def history(
    current_user: CurrentUser,
    session_id: str = Query(default="default"),
):
    user_id = current_user["user_id"]
    turns = await get_history(session_id, user_id)
    return {"session_id": session_id, "turns": turns}


@router.post("/clear")
async def clear(
    current_user: CurrentUser,
    session_id: str = Query(default="default"),
):
    user_id = current_user["user_id"]
    deleted = await clear_history(session_id, user_id)
    return {"deleted_count": deleted, "session_id": session_id}
