import os
from dotenv import load_dotenv

load_dotenv()

PORT = int(os.getenv("PORT", 5001))
DB_URL = os.getenv("DB_URL")
KEYCLOAK_URL = os.getenv("KEYCLOAK_URL")
REALM = os.getenv("REALM")
CLIENT_ID = os.getenv("CLIENT_ID")
