from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from src.config import DB_URL

engine = create_engine(DB_URL)
Session = sessionmaker(bind=engine)
