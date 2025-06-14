import requests
from urllib3.exceptions import InsecureRequestWarning

from .config import KEYCLOAK_URL, REALM, CLIENT_ID, USERNAME, PASSWORD


requests.packages.urllib3.disable_warnings(category=InsecureRequestWarning)


def get_admin_token():
    token_url = f"{KEYCLOAK_URL}/realms/master/protocol/openid-connect/token"
    data = {
        "client_id": CLIENT_ID,
        "username": USERNAME,
        "password": PASSWORD,
        "grant_type": "password",
    }
    response = requests.post(token_url, data=data, verify=False)
    response.raise_for_status()
    return response.json()["access_token"]


def fetch_users(token):
    url = f"{KEYCLOAK_URL}/admin/realms/{REALM}/users"
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(url, headers=headers, verify=False)
    response.raise_for_status()
    return response.json()


# TODO solo se traen los roles del realm, no de los clientes
#  cuando se defina el cliente con los roles ver esto
def fetch_user_roles(token, user_id):
    url = f"{KEYCLOAK_URL}/admin/realms/{REALM}/users/{user_id}/role-mappings/realm"
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(url, headers=headers, verify=False)
    return [r["name"] for r in response.json()] if response.ok else []
