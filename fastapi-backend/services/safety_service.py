"""
Safety Service — Prompt Injection Detection
Scans user prompts for known injection patterns and raises an error if triggered.
"""
import re
from fastapi import HTTPException

# Patterns that indicate prompt injection attempts
INJECTION_PATTERNS = [
    r"ignore\s+(all\s+)?(previous|prior|above|earlier)\s+(instructions?|prompts?|rules?|context)",
    r"pretend\s+(you\s+are|to\s+be|you're)",
    r"forget\s+(all\s+)?(previous|prior|above|your)\s+(instructions?|training|rules?)",
    r"disregard\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?|rules?)",
    r"you\s+are\s+now\s+(a\s+)?(?!an?\s+assistant)",
    r"act\s+as\s+(if\s+you\s+are|a)\s+(?!an?\s+assistant)",
    r"new\s+(system\s+)?prompt\s*:",
    r"override\s+(your\s+)?(instructions?|programming|rules?)",
    r"reveal\s+(your\s+)?(system\s+prompt|instructions?|training)",
    r"jailbreak",
    r"bypass\s+(your\s+)?(safety|filter|restriction)",
    r"do\s+anything\s+now",
    r"\bdan\b.*\bmode\b",
]

_compiled = [re.compile(p, re.IGNORECASE) for p in INJECTION_PATTERNS]


def scan_prompt(prompt: str) -> None:
    """
    Raises HTTP 400 if the prompt contains injection patterns.
    """
    for pattern in _compiled:
        if pattern.search(prompt):
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "prompt_injection_detected",
                    "message": "Your message was flagged by the safety layer and cannot be processed.",
                },
            )
