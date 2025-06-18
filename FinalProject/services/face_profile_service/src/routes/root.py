from flask import jsonify

def root():
    return jsonify({"msg": "Face Profile Service"}) 