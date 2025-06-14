from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
from src.config import PORT

from src.routes.api import api_blueprint


def create_app():
    app = Flask(__name__)
    CORS(app)  # Habilita CORS para todas las rutas

    # Registro de rutas
    app.register_blueprint(api_blueprint)

    return app


if __name__ == "__main__":
    app = create_app()

    print(f"Servidor corriendo en http://localhost:{PORT}")
    app.run(host="0.0.0.0", port=PORT, debug=True)
