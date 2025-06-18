import os
from dotenv import load_dotenv

load_dotenv()

DB_URL = os.getenv("DB_URL")
PORT = int(os.getenv("PORT"))
KEYCLOAK_URL = os.getenv("KEYCLOAK_URL")
REALM = os.getenv("REALM")
CLIENT_ID = os.getenv("CLIENT_ID")
