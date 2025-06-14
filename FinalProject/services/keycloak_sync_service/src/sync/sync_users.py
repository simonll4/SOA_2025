from sqlalchemy.dialects.postgresql import insert
import logging
from datetime import datetime, UTC

from .keycloak_client import get_admin_token, fetch_users, fetch_user_roles
from .database import Session, users_table

log = logging.getLogger("sync")


def sync_users():
    log.info("Iniciando sincronización de usuarios...")
    try:
        token = get_admin_token()
        kc_users = fetch_users(token)
    except Exception as e:
        log.error(f"Error obteniendo usuarios desde Keycloak: {e}")
        return

    session = Session()
    try:
        existing_users = {u.username: u for u in session.query(users_table).all()}

        usernames_in_kc = set()

        for user in kc_users:
            username = user.get("username")
            keycloak_id = user.get("id")
            roles = fetch_user_roles(token, keycloak_id)
            usernames_in_kc.add(username)

            existing = existing_users.get(username)

            if existing:
                # Si el keycloak_id cambió, actualizamos
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


# def sync_users():
#     log.info("Iniciando sincronización de usuarios...")
#     token = get_admin_token()
#     users = fetch_users(token)

#     session = Session()
#     keycloak_ids = set()

#     for user in users:
#         user_id = user.get("id")
#         username = user.get("username")
#         keycloak_ids.add(user_id)

#         roles = fetch_user_roles(token, user_id)

#         stmt = (
#             insert(users_table)
#             .values(
#                 keycloak_id=user_id,
#                 username=username,
#                 roles=roles,
#                 last_synced=datetime.now(UTC),
#             )
#             .on_conflict_do_update(
#                 index_elements=["keycloak_id"],
#                 set_={
#                     "username": username,
#                     "roles": roles,
#                     "last_synced": datetime.now(UTC),
#                 },
#             )
#         )
#         session.execute(stmt)

#     # TODO implemntar soporte para usuarios boorrados en Keycloak, usar name para indentificar users de modoo que si se vuelve activar un user coon el mismo name
#     #se actualiza el id de keeycloack een el postgres local
#     # Eliminar usuarios que ya no están en KeycloakI
#     db_ids = {row[0] for row in session.query(users_table.c.keycloak_id).all()}
#     ids_to_deactivate = db_ids - keycloak_ids

#     if ids_to_deactivate:
#         log.info(
#             f"Eliminando {len(ids_to_deactivate)} usuarios que ya no están en Keycloak..."
#         )
#         session.execute(
#             users_table.delete().where(users_table.c.keycloak_id.in_(ids_to_deactivate))
#         )

#     session.commit()
#     session.close()
#     log.info("Sincronización finalizada.")
