from src.db.database import Session
from typing import Dict, Any

from src.db.repositories.user_repo import get_active_user_by_keycloak_id
from src.db.repositories.embedding_repo import get_embedding_by_vector, insert_embedding


RESPONSE_MESSAGES = {
    "unknown_error": {
        "status": "error",
        "code": 500,
        "message": "Error desconocido",
        "data": {},
    },
    "user_not_found": lambda user_id: {
        "status": "error",
        "code": 404,
        "message": f"Usuario con ID {user_id} no existe o está desactivado",
        "data": {},
    },
    "embedding_duplicate": lambda existing_user_id: {
        "status": "duplicate",
        "code": 409,
        "message": "El embedding facial ya existe en la base de datos",
        "data": {"existing_user_id": existing_user_id},
    },
    "embedding_saved": lambda user_id: {
        "status": "success",
        "code": 201,
        "message": "Embedding facial almacenado exitosamente",
        "data": {"user_id": user_id},
    },
    "internal_error": lambda error_msg: {
        "status": "error",
        "code": 500,
        "message": f"Error al procesar el embedding: {error_msg}",
        "data": {},
    },
}


def save_embedding(user_keycloak_id: str, embedding: list[float]) -> Dict[str, Any]:
    session = Session()

    try:
        user = get_active_user_by_keycloak_id(session, user_keycloak_id)
        if not user:
            return RESPONSE_MESSAGES["user_not_found"](user_keycloak_id)

        existing = get_embedding_by_vector(session, embedding)
        if existing:
            return RESPONSE_MESSAGES["embedding_duplicate"](existing.user_id)

        insert_embedding(session, user.id, embedding)

        print(f"Embedding guardado para el usuario: {user.username} (ID: {user.id})")
        return RESPONSE_MESSAGES["embedding_saved"](user.username)

    except Exception as e:
        session.rollback()
        return RESPONSE_MESSAGES["internal_error"](str(e))

    finally:
        session.close()
