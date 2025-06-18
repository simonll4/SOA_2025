from flask import Blueprint
from .upload import upload_image
from .root import root

api_blueprint = Blueprint("api", __name__)
api_blueprint.add_url_rule("/", view_func=root)
api_blueprint.add_url_rule("/upload", methods=["POST"], view_func=upload_image)