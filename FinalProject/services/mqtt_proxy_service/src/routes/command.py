from flask import request, jsonify

from src.auth.keycloak_auth import require_auth
from src.mqtt.client import client as mqtt_client
from src.utils.validate_command import validate_command
from src.auth.fvt_auth import require_face_verification


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


VALID_CRITICAL_COMMANDS = {
    "/startf": "1",
    "/stopf": "0",
    "/startd": "1",
    "/stopd": "0",
}


@require_auth(roles=["USER_ROLE", "ADMIN_ROLE"])
@require_face_verification()
def critical_command():
    data = request.get_json()
    raspberry_id = data.get("raspberry")
    topic = data.get("topic")

    if not raspberry_id or not topic:
        return jsonify({"error": "Faltan campos 'raspberry' o 'topic'"}), 400

    if topic not in VALID_CRITICAL_COMMANDS:
        return jsonify({"error": "Comando crítico no permitido"}), 400

    message = VALID_CRITICAL_COMMANDS[topic]

    # Validar que el usuario del FVT sea el mismo que el del token de Keycloak
    if str(request.user["username"]) != request.fvt.get("username"):
        return jsonify({"error": "El FVT no coincide con el usuario autenticado"}), 403

    full_topic = f"/{raspberry_id}{topic}"

    try:
        print(f"[CRITICAL MQTT] Publicando en {full_topic}: {message}")
        mqtt_client.publish(full_topic, message)
        return jsonify({"status": "ok", "published": True, "topic": full_topic})
    except Exception as e:
        return jsonify({"error": f"Fallo al publicar en MQTT: {str(e)}"}), 500
