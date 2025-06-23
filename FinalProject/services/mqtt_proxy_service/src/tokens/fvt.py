# src/tokens/fvt.py
from jose import jwt, JWTError, ExpiredSignatureError
from datetime import datetime
from src.config import FVT_SECRET_KEY, FVT_ALGORITHM


def verify_fvt(token: str):
    try:
        payload = jwt.decode(token, FVT_SECRET_KEY, algorithms=[FVT_ALGORITHM])
        if not payload.get("verified_face"):
            raise ValueError("Token no contiene verificación facial")
        return payload
    except ExpiredSignatureError:
        raise ValueError("FVT expirado")
    except JWTError as e:
        raise ValueError(f"FVT inválido: {e}")
