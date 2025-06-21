import os
from dotenv import load_dotenv

load_dotenv()

PORT = int(os.getenv("FACE_RECOGNITION_SERVICE_PORT"))
DB_URL = os.getenv("DB_URL")
KEYCLOAK_URL = os.getenv("KEYCLOAK_URL")
REALM = os.getenv("REALM")
CLIENT_ID = os.getenv("CLIENT_ID")

FVT_SECRET_KEY = os.getenv("FVT_SECRET_KEY")
FVT_EXP_SECONDS = int(os.getenv("FVT_EXP_SECONDS", 30))
FVT_ALGORITHM = "HS256"
