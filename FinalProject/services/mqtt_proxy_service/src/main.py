from flask import Flask
from flask_cors import CORS
from src.routes import api_blueprint

def create_app():
    app = Flask(__name__)
    CORS(app)
    app.register_blueprint(api_blueprint)
    return app

app = create_app()  # necesario para Gunicorn

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001)