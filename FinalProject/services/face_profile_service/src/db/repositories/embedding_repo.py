from sqlalchemy import select, insert
from datetime import datetime, timezone

from src.db.models import face_embeddings_table


def get_embedding_by_vector(session, embedding: list[float]):
    return session.execute(
        select(face_embeddings_table).where(
            face_embeddings_table.c.embedding == embedding
        )
    ).first()


def insert_embedding(session, user_id: int, embedding: list[float]):
    session.execute(
        insert(face_embeddings_table).values(
            user_id=user_id,
            embedding=embedding,
            created_at=datetime.now(timezone.utc),
        )
    )
    session.commit()
