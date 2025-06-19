import paho.mqtt.client as mqtt
from src.config import MQTT_HOST, MQTT_PORT, MQTT_USERNAME, MQTT_PASSWORD

client = mqtt.Client()

# Set credentials
client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)

# Connect immediately on import
try:
    client.connect(MQTT_HOST, MQTT_PORT)
    client.loop_start()
except Exception as e:
    print(f"Error conectando al broker MQTT: {e}")
