from flask import request, jsonify
from jose import jwt, JWTError, ExpiredSignatureError
from cachetools import cached, TTLCache
import requests
from functools import wraps

from src.config import KEYCLOAK_URL, REALM, CLIENT_ID


KEYCLOAK_URL = KEYCLOAK_URL
REALM = REALM
CLIENT_ID = CLIENT_ID
JWKS_URL = f"{KEYCLOAK_URL}/realms/{REALM}/protocol/openid-connect/certs"

jwks_cache = TTLCache(maxsize=1, ttl=600)  # cache de 10 minutos


@cached(jwks_cache)
def get_jwks():
    response = requests.get(JWKS_URL, timeout=5)
    response.raise_for_status()
    return response.json()


def _get_public_key(token):
    unverified_header = jwt.get_unverified_header(token)
    jwks = get_jwks()
    for key in jwks["keys"]:
        if key["kid"] == unverified_header["kid"]:
            return key
    raise Exception("Clave pública no encontrada para el token")


def require_auth(roles=None):
    roles = roles or []

    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            auth_header = request.headers.get("Authorization", "")
            if not auth_header.startswith("Bearer "):
                return jsonify({"error": "Token no proporcionado"}), 401

            token = auth_header.split(" ")[1]

            try:
                public_key = _get_public_key(token)
                decoded_token = jwt.decode(
                    token,
                    public_key,
                    algorithms=["RS256"],
                    issuer=f"{KEYCLOAK_URL}/realms/{REALM}",
                    options={"verify_aud": False},
                )

                token_roles = (
                    decoded_token.get("resource_access", {})
                    .get(CLIENT_ID, {})
                    .get("roles", [])
                )

                if roles and not any(role in token_roles for role in roles):
                    return jsonify({"error": "Acceso denegado: rol insuficiente"}), 403

                request.user = {
                    "username": decoded_token.get("preferred_username"),
                    "email": decoded_token.get("email"),
                    "roles": token_roles,
                    "sub": decoded_token.get("sub"),
                }

                return f(*args, **kwargs)

            except ExpiredSignatureError:
                print("Token expirado")
                return jsonify({"error": "Token expirado"}), 401
            except JWTError as e:
                print(f"Error decodificando el token: {str(e)}")
                return jsonify({"error": f"Token inválido: {str(e)}"}), 401
            except Exception as e:
                print(f"Error autenticando: {str(e)}")
                return jsonify({"error": f"Error autenticando: {str(e)}"}), 500

        return wrapper

    return decorator
