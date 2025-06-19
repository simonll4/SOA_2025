from flask import request, jsonify
from src.auth.keycloak_auth import require_auth
from src.mqtt.client import client as mqtt_client
from src.utils.validate_command import validate_command


@require_auth(roles=["USER_ROLE", "ADMIN_ROLE"])
def command():
    data = request.get_json()
    raspberry_id = data.get("raspberry")
    topic = data.get("topic")
    message = data.get("message")

    if not raspberry_id or not topic or not message:
        return jsonify({"error": "Faltan campos 'raspberry', 'topic' o 'message'"}), 400

    # Validar topic (sin raspberry_id)
    is_valid, error_msg = validate_command(topic, message)
    if not is_valid:
        return jsonify({"error": error_msg}), 400

    # Armar topic completo
    full_topic = f"/{raspberry_id}{topic}"

    try:
        print(f"[MQTT] Publicando en {full_topic}: {message}")
        mqtt_client.publish(full_topic, message)
        return jsonify({"status": "ok", "published": True, "topic": full_topic})
    except Exception as e:
        return jsonify({"error": f"Fallo al publicar en MQTT: {str(e)}"}), 500
