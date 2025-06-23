# src/auth/fvt_auth.py
from flask import request, jsonify
from functools import wraps
from src.tokens.fvt import verify_fvt


def require_face_verification():
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            fvt_token = request.headers.get("X-Face-Verification")
            if not fvt_token:
                return jsonify({"error": "FVT no proporcionado"}), 401
            try:
                payload = verify_fvt(fvt_token)
                request.fvt = payload
                return f(*args, **kwargs)
            except ValueError as e:
                return jsonify({"error": f"Verificación facial inválida: {e}"}), 403

        return wrapper

    return decorator
