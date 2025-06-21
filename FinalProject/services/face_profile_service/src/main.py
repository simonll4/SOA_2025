from flask import Flask
from flask_cors import CORS
from src.routes import api_blueprint
from src.config import PORT



def create_app():
    app = Flask(__name__)
    CORS(app)
    app.register_blueprint(api_blueprint)
    return app

app = create_app()

if __name__ == "__main__":

    print(f"Servidor corriendo en http://localhost:{PORT}")
    app.run(port=PORT, debug=True)