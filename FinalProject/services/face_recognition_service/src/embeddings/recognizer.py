from face_recognition import load_image_file, face_encodings
import numpy as np
import traceback

from src.db.repositories.embedding_repo import (
    get_best_match_for_user,
    SIMILARITY_THRESHOLD,
)

MIN_FACE_CONFIDENCE = 0.4


def recognize_profile(file, session, user_id, username):
    try:
        img = load_image_file(file)
        encs = face_encodings(img)

        if not encs:
            return {"status": "error", "code": 400, "message": "No se detectaron caras"}

        emb = np.array(encs[0], dtype=np.float32)
        norm = np.linalg.norm(emb)
        if np.isclose(norm, 0):
            return {"status": "error", "code": 422, "message": "Embedding inválido"}

        norm_emb = emb / norm

        match = get_best_match_for_user(session, norm_emb.tolist(), user_id)
        if not match:
            return {
                "status": "not_found",
                "code": 404,
                "message": "No hay embeddings para el usuario",
            }

        similarity = match["similarity"]
        confidence = (similarity - SIMILARITY_THRESHOLD) / (1 - SIMILARITY_THRESHOLD)

        if similarity < SIMILARITY_THRESHOLD or confidence < MIN_FACE_CONFIDENCE:
            return {
                "status": "not_found",
                "code": 404,
                "message": "Rostro no coincide",
                "data": {"similarity": similarity, "confidence": confidence},
            }

        return {
            "status": "success",
            "code": 200,
            "data": {
                "user_id": user_id,
                "user_name": username,
                "similarity": similarity,
                "confidence": confidence,
            },
        }

    except Exception as e:
        traceback.print_exc()
        return {"status": "error", "code": 500, "message": f"Error interno: {e}"}
