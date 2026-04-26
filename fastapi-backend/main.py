"""
FastAPI Application Entry Point
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import connect_db, close_db
from routers import auth, chat


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await connect_db()
        # Verify connection by pinging
        from database import get_db
        db = get_db()
        await db.command("ping")
        print(">>> MongoDB connected successfully.")
    except Exception as e:
        print(f">>> WARNING: Could not connect to MongoDB. Error: {e}")
        print(">>> AI Chat history will NOT be saved, but the service will still attempt to respond.")
    yield
    await close_db()


app = FastAPI(
    title="Deckzi AI Backend",
    description="FastAPI service powering the Gemini AI chat feature",
    version="1.0.0",
    lifespan=lifespan,
)

# Request Logger Middleware
@app.middleware("http")
async def log_requests(request, call_next):
    print(f">>> incoming {request.method} {request.url.path}")
    response = await call_next(request)
    print(f">>> outgoing status {response.status_code}")
    return response

# Open CORS for easier local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4200",
        "http://127.0.0.1:4200",
        "http://localhost:4201",
        "http://127.0.0.1:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(chat.router)


@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "service": "Deckzi AI Backend"}


@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}
