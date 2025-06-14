from flask import request, jsonify, Blueprint
from src.db.database import Session
from src.embeddings.recognizer import recognize_profile

api_blueprint = Blueprint("api", __name__)


@api_blueprint.route("/recognize", methods=["POST"])
def recognize_image():
    try:
        file = request.files.get("file")

        if not file:
            return jsonify({"detail": "Falta el archivo de imagen"}), 400

        with Session() as session:
            result = recognize_profile(file, session)

        if result["status"] == "error":
            return jsonify({"detail": result["message"]}), result["code"]
        elif result["status"] == "not_found":
            return (
                jsonify(
                    {
                        "user_id": None,
                        "status": "unknown",
                        "label": "Desconocido",
                        "similarity": result.get("data", {}).get("similarity"),
                        "confidence": result.get("data", {}).get("confidence"),
                    }
                ),
                result["code"],
            )
        else:
            return (
                jsonify(
                    {
                        "user_id": result["data"]["user_id"],
                        "status": "ok",
                        "similarity": result["data"]["similarity"],
                        "confidence": result["data"]["confidence"],
                        "label": "Reconocido",
                    }
                ),
                result["code"],
            )

    except ValueError as ve:
        return jsonify({"detail": str(ve)}), 400
    except Exception as e:
        return jsonify({"detail": f"Error procesando la imagen: {str(e)}"}), 500


# from flask import request, jsonify, Blueprint
# from src.db.database import Session
# from src.embeddings.recognizer import recognize_profile

# api_blueprint = Blueprint("api", __name__)

# @api_blueprint.route("/recognize", methods=["POST"])
# def recognize_image():
#     try:
#         file = request.files.get("file")

#         if not file:
#             return jsonify({"detail": "Falta el archivo de imagen"}), 400

#         with Session() as session:
#             label, user_id = recognize_profile(file, session)

#         return jsonify({
#             "user_id": user_id,
#             "status": "ok" if user_id else "unknown",
#             "label": label or "Desconocido"
#         })

#     except ValueError as ve:
#         return jsonify({"detail": str(ve)}), 400
#     except Exception as e:
#         return jsonify({"detail": f"Error procesando la imagen: {str(e)}"}), 500


# # from flask import request, jsonify, Blueprint
# # from src.db.database import Session
# # from src.embeddings.recognizer import recognize_profile

# # api_blueprint = Blueprint("api", __name__)

# # @api_blueprint.route("/recognize", methods=["POST"])
# # def recognize_image():
# #     try:
# #         file = request.files.get("file")

# #         if not file:
# #             return jsonify({"detail": "Falta el archivo de imagen"}), 400

# #         with Session() as session:
# #             name, user_id = recognize_profile(file, session)

# #         return jsonify({
# #             "user_id": user_id,
# #             "status": "ok" if user_id else "unknown",
# #             "label": name
# #         })

# #     except ValueError as ve:
# #         return jsonify({"detail": str(ve)}), 400
# #     except Exception as e:
# #         return jsonify({"detail": f"Error procesando la imagen: {str(e)}"}), 500
