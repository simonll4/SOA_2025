from flask import request, jsonify
from functools import wraps
from jose import jwt, JWTError, ExpiredSignatureError
import requests
from cachetools import TTLCache, cached

from src.config import KEYCLOAK_URL, REALM, CLIENT_ID
from src.db.database import Session
from src.db.repositories.user_repo import get_user_by_keycloak_id

JWKS_URL = f"{KEYCLOAK_URL}/realms/{REALM}/protocol/openid-connect/certs"
jwks_cache = TTLCache(maxsize=1, ttl=600)


@cached(jwks_cache)
def get_jwks():
    return requests.get(JWKS_URL, timeout=5).json()


def _get_public_key(token):
    header = jwt.get_unverified_header(token)
    for key in get_jwks()["keys"]:
        if key["kid"] == header["kid"]:
            return key
    raise Exception("Clave pública no encontrada")


def require_auth(roles=None):
    roles = roles or []

    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            auth_header = request.headers.get("Authorization", "")
            if not auth_header.startswith("Bearer "):
                return (
                    jsonify({"status": "error", "message": "Token no proporcionado"}),
                    401,
                )

            token = auth_header.split(" ")[1]

            try:
                key = _get_public_key(token)
                decoded = jwt.decode(
                    token,
                    key,
                    algorithms=["RS256"],
                    issuer=f"{KEYCLOAK_URL}/realms/{REALM}",
                    options={"verify_aud": False},
                )

                token_roles = (
                    decoded.get("resource_access", {})
                    .get(CLIENT_ID, {})
                    .get("roles", [])
                )

                if roles and not any(role in token_roles for role in roles):
                    return (
                        jsonify({"status": "error", "message": "Acceso denegado"}),
                        403,
                    )

                with Session() as session:
                    db_user = get_user_by_keycloak_id(session, decoded["sub"])
                    if not db_user:
                        return (
                            jsonify(
                                {"status": "error", "message": "Usuario no encontrado"}
                            ),
                            404,
                        )

                    request.user = {
                        "id": db_user["id"],
                        "keycloak_id": decoded["sub"],
                        "username": db_user["username"],
                        "roles": token_roles,
                    }

                return f(*args, **kwargs)

            except ExpiredSignatureError:
                print("Token expirado")
                return jsonify({"status": "error", "message": "Token expirado"}), 401
            except JWTError as e:
                print(f"Error decodificando el token JWT: {str(e)}")
                return jsonify({"status": "error", "message": "Token inválido"}), 401
            except Exception as e:
                print(f"Error autenticando: {str(e)}")
                return (
                    jsonify(
                        {"status": "error", "message": f"Error autenticando: {str(e)}"}
                    ),
                    500,
                )

        return wrapper

    return decorator
