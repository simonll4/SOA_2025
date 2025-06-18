# src/routes/recognize.py
from flask import request, jsonify
from src.auth.keycloak_auth import require_auth
from src.embeddings.recognizer import recognize_profile
from src.db.database import Session


@require_auth(roles=["USER_ROLE", "ADMIN_ROLE"])
def recognize_image():
    try:
        file = request.files.get("file")
        if not file:
            return (
                jsonify(
                    {
                        "status": "error",
                        "code": 400,
                        "message": "Falta el archivo de imagen",
                        "data": {},
                    }
                ),
                400,
            )

        user_id = request.user["id"]
        user_name = request.user["username"]
        with Session() as session:
            result = recognize_profile(file, session, user_id, user_name)

        return jsonify(result), result["code"]

    except Exception as e:
        return (
            jsonify(
                {
                    "status": "error",
                    "code": 500,
                    "message": f"Error inesperado: {str(e)}",
                    "data": {},
                }
            ),
            500,
        )
