import logging
from datetime import datetime, UTC

from .keycloak_client import (
    get_admin_token,
    fetch_users,
    get_client_id,
    fetch_user_client_roles,
)
from .database import Session, users_table

log = logging.getLogger("sync")


def sync_users():
    log.info("Iniciando sincronización de usuarios...")
    try:
        token = get_admin_token()
        kc_users = fetch_users(token)
        client_id = get_client_id(token, "vue-app")  # ← usamos este cliente
    except Exception as e:
        log.error(f"Error obteniendo datos desde Keycloak: {e}")
        return

    session = Session()
    try:
        existing_users = {u.username: u for u in session.query(users_table).all()}
        usernames_in_kc = set()

        for user in kc_users:
            username = user.get("username")
            keycloak_id = user.get("id")
            roles = fetch_user_client_roles(token, keycloak_id, client_id)
            usernames_in_kc.add(username)

            existing = existing_users.get(username)

            if existing:
                # Si el keycloak_id cambió o los roles o está deshabilitado, actualizamos
                changes = {}
                if existing.keycloak_id != keycloak_id:
                    changes["keycloak_id"] = keycloak_id
                if existing.roles != roles:
                    changes["roles"] = roles
                if existing.enabled != 1:
                    changes["enabled"] = 1
                if changes:
                    changes["last_synced"] = datetime.now(UTC)
                    session.query(users_table).filter_by(username=username).update(
                        changes
                    )
                    log.info(f"Actualizado usuario existente: {username}")
            else:
                session.execute(
                    users_table.insert().values(
                        keycloak_id=keycloak_id,
                        username=username,
                        roles=roles,
                        enabled=1,
                        last_synced=datetime.now(UTC),
                    )
                )
                log.info(f"Usuario insertado: {username}")

        # Soft delete de los usuarios que ya no están en Keycloak
        users_to_disable = [
            u.username
            for u in existing_users.values()
            if u.username not in usernames_in_kc and u.enabled == 1
        ]

        if users_to_disable:
            session.query(users_table).filter(
                users_table.c.username.in_(users_to_disable)
            ).update(
                {"enabled": 0, "last_synced": datetime.now(UTC)},
                synchronize_session=False,
            )
            log.info(
                f"{len(users_to_disable)} usuarios marcados como desactivados: {users_to_disable}"
            )

        session.commit()
        log.info("Sincronización finalizada.")
    except Exception as e:
        log.exception(f"Error durante sincronización: {e}")
        session.rollback()
    finally:
        session.close()
