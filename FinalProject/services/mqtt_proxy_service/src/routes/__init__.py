from flask import Blueprint
from .root import root
from .command import command, critical_command


api_blueprint = Blueprint("api", __name__)
api_blueprint.add_url_rule("/", view_func=root)
api_blueprint.add_url_rule("/command", methods=["POST"], view_func=command)
api_blueprint.add_url_rule(
    "/command/critic", "critical_command", critical_command, methods=["POST"]
)
