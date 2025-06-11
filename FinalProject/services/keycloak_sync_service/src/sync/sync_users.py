from sqlalchemy.dialects.postgresql import insert
import logging
from datetime import datetime, UTC

from .keycloak_client import get_admin_token, fetch_users, fetch_user_roles
from .database import Session, users_table

log = logging.getLogger("sync")


def sync_users():
    log.info("Iniciando sincronización de usuarios...")
    token = get_admin_token()
    users = fetch_users(token)

    session = Session()
    keycloak_ids = set()

    for user in users:
        user_id = user.get("id")
        username = user.get("username")
        keycloak_ids.add(user_id)

        roles = fetch_user_roles(token, user_id)

        stmt = (
            insert(users_table)
            .values(
                keycloak_id=user_id,
                username=username,
                roles=roles,
                last_synced=datetime.now(UTC),
            )
            .on_conflict_do_update(
                index_elements=["keycloak_id"],
                set_={
                    "username": username,
                    "roles": roles,
                    "last_synced": datetime.now(UTC),
                },
            )
        )
        session.execute(stmt)

    # Eliminar usuarios que ya no están en Keycloak
    db_ids = {row[0] for row in session.query(users_table.c.keycloak_id).all()}
    ids_to_deactivate = db_ids - keycloak_ids

    if ids_to_deactivate:
        log.info(
            f"Eliminando {len(ids_to_deactivate)} usuarios que ya no están en Keycloak..."
        )
        session.execute(
            users_table.delete().where(users_table.c.keycloak_id.in_(ids_to_deactivate))
        )

    session.commit()
    session.close()
    log.info("Sincronización finalizada.")
