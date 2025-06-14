from sqlalchemy import (
    create_engine,
    MetaData,
    Table,
    Column,
    Integer,
    String,
    Text,
    ARRAY,
    TIMESTAMP,
)
from sqlalchemy.orm import sessionmaker
from datetime import datetime, UTC
from .config import DB_URL

engine = create_engine(DB_URL)
metadata = MetaData()

users_table = Table(
    "users",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("keycloak_id", String),
    Column("username", String, nullable=False, unique=True),
    Column("roles", ARRAY(Text), nullable=False),
    Column("enabled", Integer, default=1),  # 1 = activo, 0 = eliminado (soft delete)
    Column("last_synced", TIMESTAMP, default=lambda: datetime.now(UTC)),
)



metadata.create_all(engine)
Session = sessionmaker(bind=engine)
