from sqlalchemy import insert, select
from src.db.database import Session
from src.db.models import face_embeddings_table, users_table
from datetime import datetime, timezone
import numpy as np
from typing import Dict, Any


def save_embedding(user_id: int, embedding: list[float]) -> Dict[str, Any]:
    session = Session()
    response = {
        "status": "error",
        "code": 500,
        "message": "Error desconocido",
        "data": {},
    }

    try:
        # 1. Validar usuario existente y activo
        user = session.execute(
            select(users_table.c.id).where(
                users_table.c.id == user_id, users_table.c.enabled == 1
            )
        ).first()

        if not user:
            response.update(
                {
                    "status": "error",
                    "code": 404,
                    "message": f"Usuario con ID {user_id} no existe o está desactivado",
                }
            )
            return response

        # 2. Verificar si el embedding ya existe en CUALQUIER usuario
        new_embedding = np.array(embedding, dtype=np.float32)

        existing_record = session.execute(
            select(face_embeddings_table).where(
                face_embeddings_table.c.embedding == embedding
            )
        ).first()

        if existing_record:
            existing_user_id = existing_record.user_id
            response.update(
                {
                    "status": "duplicate",
                    "code": 409,
                    "message": "El embedding facial ya existe en la base de datos",
                    "data": {"existing_user_id": existing_user_id},
                }
            )
            return response

        # 3. Insertar nuevo embedding
        session.execute(
            insert(face_embeddings_table).values(
                user_id=user_id,
                embedding=embedding,
                created_at=datetime.now(timezone.utc),
            )
        )
        session.commit()

        response.update(
            {
                "status": "success",
                "code": 201,
                "message": "Embedding facial almacenado exitosamente",
                "data": {},
            }
        )
        return response

    except Exception as e:
        session.rollback()
        response.update({"message": f"Error al procesar el embedding: {str(e)}"})
        return response
    finally:
        session.close()
