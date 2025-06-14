# main.py (Flask)
from flask import Flask, jsonify
from src.routes.routes import api_blueprint
from src.db.database import metadata, engine
from flask_cors import CORS


app = Flask(__name__)
app.register_blueprint(api_blueprint, url_prefix="/")
CORS(app)


@app.route("/")
def root():
    return jsonify({"msg": "Face Recognition Service"})


if __name__ == "__main__":
    app.run(debug=True)
