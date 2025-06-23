from sqlalchemy import select

from src.db.models import face_embeddings_table

SIMILARITY_THRESHOLD = 0.6


def get_best_match_for_user(session, norm_emb, user_id):
    dist_expr = face_embeddings_table.c.embedding.l2_distance(norm_emb)
    sim_expr = (1 - dist_expr).label("similarity")

    stmt = (
        select(face_embeddings_table.c.user_id, sim_expr)
        .where(face_embeddings_table.c.user_id == user_id)
        .order_by(dist_expr)
        .limit(1)
    )

    res = session.execute(stmt).first()
    return res._mapping if res else None
