from sqlalchemy import select

from src.db.models import users_table


def get_active_user_by_keycloak_id(session, keycloak_id: str):
    return session.execute(
        select(users_table.c.id, users_table.c.username).where(
            users_table.c.keycloak_id == keycloak_id,
            users_table.c.enabled == 1,
        )
    ).first()
