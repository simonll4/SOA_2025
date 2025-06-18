from sqlalchemy import select

from src.db.models import users_table

def get_user_by_keycloak_id(session, keycloak_id: str):
    stmt = select(users_table).where(users_table.c.keycloak_id == keycloak_id)
    result = session.execute(stmt).first()
    return result._mapping if result else None
