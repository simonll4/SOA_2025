from flask import Blueprint, request, jsonify
from src.embeddings.generator import generate_embedding
from src.embeddings.storage import save_embedding

api_blueprint = Blueprint("api", __name__)


@api_blueprint.route("/upload", methods=["POST"])
def upload_image():
    try:
        user_id = request.form.get("user_id", type=int)
        file = request.files.get("file")

        if not user_id or not file:
            return (
                jsonify(
                    {
                        "status": "error",
                        "code": 400,
                        "message": "Se requieren user_id y archivo de imagen",
                        "data": {},
                    }
                ),
                400,
            )

        embedding = generate_embedding(file)
        print(f"Embedding generado: {embedding}")
        result = save_embedding(user_id, embedding)

        if result["status"] == "duplicate":
            return (
                jsonify(
                    {
                        "status": "error",
                        "code": result["code"],
                        "message": result["message"],
                        "data": {
                            "existing_user_id": result["data"]["existing_user_id"]
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
                    "data": {"user_id": user_id, "embedding_length": len(embedding)},
                }
            ),
            200,
        )

    except ValueError as ve:
        return (
            jsonify({"status": "error", "code": 400, "message": str(ve), "data": {}}),
            400,
        )
    except Exception as e:
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
