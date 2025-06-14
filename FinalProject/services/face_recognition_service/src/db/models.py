from sqlalchemy import Table, Column, Integer, TIMESTAMP, MetaData
from pgvector.sqlalchemy import Vector
from sqlalchemy.sql import func

metadata = MetaData()

face_embeddings_table = Table(
    "face_embeddings",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("user_id", Integer, nullable=False),
    Column("embedding", Vector(128)),
    Column("created_at", TIMESTAMP, server_default=func.now()),
)
