"""
Auth Router — Register, Login, and JWT token issuance.
Users are stored in MongoDB for the FastAPI service.
"""
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr

from config import get_settings
from database import get_db

router = APIRouter(prefix="/auth", tags=["Auth"])
settings = get_settings()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


# ── Schemas ──────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str


# ── Helpers ───────────────────────────────────────────────────────────────────

def _hash(password: str) -> str:
    return pwd_context.hash(password)


def _verify(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def _create_token(data: dict) -> str:
    payload = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes)
    payload.update({"exp": expire})
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        print(f"DEBUG: Validating token: {token}")
        payload = jwt.decode(
            token, 
            settings.jwt_secret, 
            algorithms=[settings.jwt_algorithm], 
            options={
                "verify_signature": False,
                "verify_aud": False,
                "verify_iss": False
            }
        )
        user_id: str = payload.get("sub")
        username: str = payload.get("username")
        
        if user_id is None:
            print(f"DEBUG: Token missing 'sub' claim. Payload: {payload}")
            raise credentials_exception
            
        return {"user_id": user_id, "username": username}
    except JWTError as e:
        print(f"DEBUG: JWT decode error: {e}")
        raise credentials_exception
    except Exception as e:
        print(f"DEBUG: Unexpected auth error: {e}")
        raise credentials_exception


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest):
    db = get_db()
    existing = await db["users"].find_one({"email": body.email})
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    user_doc = {
        "username": body.username,
        "email": body.email,
        "password_hash": _hash(body.password),
        "created_at": datetime.now(timezone.utc),
    }
    result = await db["users"].insert_one(user_doc)
    token = _create_token({"sub": str(result.inserted_id), "username": body.username})
    return TokenResponse(access_token=token, username=body.username)


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest):
    db = get_db()
    user = await db["users"].find_one({"email": body.email})
    if not user or not _verify(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = _create_token({"sub": str(user["_id"]), "username": user["username"]})
    return TokenResponse(access_token=token, username=user["username"])
