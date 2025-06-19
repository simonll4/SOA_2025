from flask import jsonify

def root():
    return jsonify({"message": "MQTT Proxy Service"})
