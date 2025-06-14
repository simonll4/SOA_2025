from face_recognition import load_image_file, face_encodings
from sqlalchemy import select
import numpy as np
import traceback
from src.db.models import face_embeddings_table  # tu tabla declarada

SIMILARITY_THRESHOLD = 0.6
MIN_FACE_CONFIDENCE = 0.4


def recognize_profile(file, session):
    try:
        img = load_image_file(file)
        encs = face_encodings(img)

        if not encs:
            return {"status": "error", "code": 400, "message": "No se detectaron caras"}

        emb = np.array(encs[0], dtype=np.float32)
        norm = np.linalg.norm(emb)
        if np.isclose(norm, 0):
            return {"status": "error", "code": 422, "message": "Embedding inválido"}

        norm_emb = (emb / norm).tolist()

        # Construir consulta usando pgvector SQLAlchemy
        dist_expr = face_embeddings_table.c.embedding.l2_distance(norm_emb)
        sim_expr = (1 - dist_expr).label("similarity")

        stmt = (
            select(face_embeddings_table.c.user_id, sim_expr)
            .order_by(dist_expr)
            .limit(1)
        )
        res = session.execute(stmt).first()
        if not res:
            return {"status": "not_found", "code": 404, "message": "No match"}

        user_id, similarity = res
        confidence = (similarity - SIMILARITY_THRESHOLD) / (1 - SIMILARITY_THRESHOLD)
        if similarity < SIMILARITY_THRESHOLD or confidence < MIN_FACE_CONFIDENCE:
            return {
                "status": "not_found",
                "code": 404,
                "message": f"No supera umbral (sim={similarity:.2f})",
                "data": {"similarity": similarity, "confidence": confidence},
            }

        return {
            "status": "success",
            "code": 200,
            "data": {
                "user_id": user_id,
                "similarity": similarity,
                "confidence": confidence,
            },
        }

    except Exception as e:
        print(traceback.format_exc())
        return {"status": "error", "code": 500, "message": f"Error interno: {e}"}
