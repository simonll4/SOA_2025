from datetime import datetime, timedelta, timezone
from jose import jwt
from src.config import FVT_SECRET_KEY, FVT_EXP_SECONDS, FVT_ALGORITHM


def generate_fvt(user_id: int, username: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "username": username,
        "verified_face": True,
        "iat": now,
        "exp": now + timedelta(seconds=FVT_EXP_SECONDS),
    }
    token = jwt.encode(payload, FVT_SECRET_KEY, algorithm=FVT_ALGORITHM)
    return token
