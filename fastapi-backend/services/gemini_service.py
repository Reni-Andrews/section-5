"""
Gemini Service — Wraps the Google Generative AI SDK.
Builds context-aware chat sessions from history and streams responses.
"""
import asyncio
from typing import AsyncGenerator

import google.generativeai as genai
from config import get_settings

settings = get_settings()

# Configure the SDK with the API key
genai.configure(api_key=settings.gemini_api_key)

SYSTEM_PROMPT = """You are Deckzi Assistant, a helpful, professional, and friendly AI assistant.
You help users with their questions clearly and concisely.
Always be respectful, accurate, and avoid harmful content.
If you are unsure about something, say so honestly rather than guessing."""

GENERATION_CONFIG = genai.types.GenerationConfig(
    temperature=0.7,
    top_p=0.95,
    top_k=40,
    max_output_tokens=2048,
)

SAFETY_SETTINGS = [
    {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
]


def _build_history(turns: list[dict]) -> list[dict]:
    """Convert stored turns into Gemini SDK history format."""
    result = []
    for turn in turns:
        result.append(
            {
                "role": turn["role"],
                "parts": [turn["content"]],
            }
        )
    return result


async def stream_response(
    prompt: str, history: list[dict]
) -> AsyncGenerator[str, None]:
    """
    Streams the Gemini response token by token.
    Yields text chunks as they arrive.
    """
    model = genai.GenerativeModel(
        model_name="gemini-flash-latest",
        system_instruction=SYSTEM_PROMPT,
        generation_config=GENERATION_CONFIG,
        safety_settings=SAFETY_SETTINGS,
    )

    chat_history = _build_history(history)
    chat = model.start_chat(history=chat_history)

    # Run the blocking SDK call in a thread pool to stay non-blocking
    loop = asyncio.get_event_loop()
    response = await loop.run_in_executor(
        None,
        lambda: chat.send_message(prompt, stream=True),
    )

    full_response = ""
    try:
        for chunk in response:
            try:
                if hasattr(chunk, "text") and chunk.text:
                    full_response += chunk.text
                    yield chunk.text
            except ValueError:
                # This happens if the chunk is blocked by safety filters
                # and we try to access chunk.text
                error_msg = "\n[Response blocked by safety filters]"
                full_response += error_msg
                yield error_msg
                break
    except Exception as e:
        error_msg = f"\n[AI Error: {str(e)}]"
        full_response += error_msg
        yield error_msg

    # Return full response so caller can persist it
    yield f"\n__END__{full_response}__END__"
