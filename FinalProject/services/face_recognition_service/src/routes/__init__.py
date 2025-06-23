from flask import Blueprint
from .root import root
from .recognition import recognize_image

api_blueprint = Blueprint("api", __name__)
api_blueprint.add_url_rule("/", view_func=root)
api_blueprint.add_url_rule("/recognize", methods=["POST"], view_func=recognize_image)
