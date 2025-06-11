from dotenv import load_dotenv
import os

load_dotenv()

KEYCLOAK_URL = os.getenv("KEYCLOAK_URL")
REALM = os.getenv("KEYCLOAK_REALM")
CLIENT_ID = os.getenv("KEYCLOAK_CLIENT_ID")
USERNAME = os.getenv("KEYCLOAK_USERNAME")
PASSWORD = os.getenv("KEYCLOAK_PASSWORD")
DB_URL = os.getenv("DATABASE_URL")
SYNC_INTERVAL = int(os.getenv("SYNC_INTERVAL"))
