import os
from dotenv import load_dotenv

load_dotenv()

PORT = int(os.getenv("PORT_PROXY_SERVICE"))
KEYCLOAK_URL = os.getenv("KEYCLOAK_URL")
REALM = os.getenv("REALM")
CLIENT_ID = os.getenv("CLIENT_ID")

# MQTT
MQTT_HOST = os.getenv("MQTT_HOST")
MQTT_PORT = int(os.getenv("MQTT_PORT", 1883))
MQTT_USERNAME = os.getenv("MQTT_USERNAME")
MQTT_PASSWORD = os.getenv("MQTT_PASSWORD")

FVT_SECRET_KEY = os.getenv("FVT_SECRET_KEY")
FVT_ALGORITHM = "HS256"