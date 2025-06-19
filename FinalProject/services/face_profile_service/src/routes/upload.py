from flask import request, jsonify
import uuid

from src.embeddings.generator import generate_embedding
from src.embeddings.storage import save_embedding
from src.auth.keycloak_auth import require_auth


def is_valid_uuid(val: str) -> bool:
    try:
        uuid_obj = uuid.UUID(val, version=4)
        return str(uuid_obj) == val  # asegura que no es solo "parseable"
    except ValueError:
        return False


@require_auth(roles=["ADMIN_ROLE"])
def upload_image():

    try:
        file = request.files.get("file")
        user_keycloak_id = request.form.get("user_id")

        if not user_keycloak_id or not is_valid_uuid(user_keycloak_id):
            return (
                jsonify(
                    {
                        "status": "error",
                        "code": 400,
                        "message": "El ID del usuario no tiene formato UUID válido",
                        "data": {},
                    }
                ),
                400,
            )

        if not file:
            return (
                jsonify(
                    {
                        "status": "error",
                        "code": 400,
                        "message": "Se requiere archivo de imagen",
                        "data": {},
                    }
                ),
                400,
            )

        embedding = generate_embedding(file)
        result = save_embedding(user_keycloak_id, embedding)

        if result["status"] == "duplicate":
            return (
                jsonify(
                    {
                        "status": "error",
                        "code": result["code"],
                        "message": result["message"],
                        "data": {
                            "existing_user_id": result["data"].get("existing_user_id")
                        },
                    }
                ),
                result["code"],
            )

        if result["status"] != "success":
            return jsonify(result), result["code"]

        return (
            jsonify(
                {
                    "status": "success",
                    "code": 200,
                    "message": "Imagen procesada y almacenada exitosamente",
                    "data": {
                        "user_id": user_keycloak_id,
                        "embedding_length": len(embedding),
                    },
                }
            ),
            200,
        )

    except Exception as e:
        print(f"Error procesando la imagen: {str(e)}")
        return (
            jsonify(
                {
                    "status": "error",
                    "code": 500,
                    "message": f"Error procesando la imagen: {str(e)}",
                    "data": {},
                }
            ),
            500,
        )
