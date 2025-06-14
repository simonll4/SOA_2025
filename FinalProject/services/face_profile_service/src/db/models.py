# src/db/models.py
from sqlalchemy import (
    Table,
    Column,
    Integer,
    String,
    Text,
    ARRAY,
    TIMESTAMP,
    ForeignKey,
    MetaData,
)
from pgvector.sqlalchemy import Vector
from datetime import datetime, timezone

# Define una sola instancia compartida
metadata = MetaData()

users_table = Table(
    "users",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("keycloak_id", String, unique=True),
    Column("username", String, nullable=False),
    Column("roles", ARRAY(Text), nullable=False),
    Column("enabled", Integer, default=1),
    Column("last_synced", TIMESTAMP, default=lambda: datetime.now(timezone.utc)),
)

face_embeddings_table = Table(
    "face_embeddings",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("user_id", Integer, ForeignKey("users.id"), nullable=False),
    Column("embedding", Vector(128), nullable=False),
    Column("created_at", TIMESTAMP, default=lambda: datetime.now(timezone.utc)),
)


# from sqlalchemy import (
#     Table,
#     Column,
#     Integer,
#     String,
#     Text,
#     ARRAY,
#     TIMESTAMP,
#     ForeignKey,
#     MetaData,
# )
# from pgvector.sqlalchemy import Vector
# from datetime import datetime, timezone

# metadata = MetaData()

# users_table = Table(
#     "users",
#     metadata,
#     Column("id", Integer, primary_key=True),
#     Column("keycloak_id", String, unique=True),
#     Column("username", String, nullable=False),
#     Column("roles", ARRAY(Text), nullable=False),
#     Column("enabled", Integer, default=1),  # 1 = activo, 0 = eliminado (soft delete)
#     Column("last_synced", TIMESTAMP, default=lambda: datetime.now(timezone.utc)),
# )

# face_embeddings_table = Table(
#     "face_embeddings",
#     metadata,
#     Column("id", Integer, primary_key=True),
#     Column("user_id", Integer, ForeignKey("users.id"), nullable=False),
#     Column("embedding", Vector(128), nullable=False),
#     Column("created_at", TIMESTAMP, default=lambda: datetime.now(timezone.utc)),
# )
