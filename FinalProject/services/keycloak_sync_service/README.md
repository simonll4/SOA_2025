# 🔄 Keycloak Sync Service

Este servicio se encarga de sincronizar usuarios y sus roles desde un servidor **Keycloak** hacia una base de datos local PostgreSQL. Está diseñado como parte de una arquitectura destribuida.

---

## 🧩 Funcionalidad

- Obtiene un token de acceso administrativo desde Keycloak.
- Consulta los usuarios del **Realm** configurado.
- Extrae sus roles a nivel de Realm.
- Inserta o actualiza los datos en la base de datos local.
- Elimina usuarios de la base de datos local si ya no existen en Keycloak.
- Se ejecuta automáticamente con un scheduler interno.

---

## ⚙️ Tecnologías

- **Python 3.12**
- **SQLAlchemy** – ORM para la base de datos.
- **PostgreSQL** – Base de datos relacional para almacenar usuarios.
- **APScheduler** – Programador de tareas automático.
- **Keycloak Admin REST API** – Interacción con Keycloak.

---


## 🗄️ Esquema de la base de datos

La base de datos contiene una sola tabla: `users`.

| Campo         | Tipo             | Descripción                             |
|---------------|------------------|-----------------------------------------|
| id            | `Integer`        | Clave primaria autoincremental          |
| keycloak_id   | `String`         | ID original del usuario en Keycloak     |
| username      | `String`         | Nombre de usuario                       |
| roles         | `ARRAY(Text)`    | Roles asignados al usuario              |
| last_synced   | `TIMESTAMP`      | Fecha y hora de la última sincronización|

---