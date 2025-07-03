import Keycloak from 'keycloak-js'
import type KeycloakType from 'keycloak-js'

let keycloakInstance: KeycloakType | null = null

export function getKeycloakInstance(): KeycloakType {
  if (!keycloakInstance) {
    keycloakInstance = new Keycloak({
      url: import.meta.env.VITE_KEYCLOAK_API_URL,
      realm: import.meta.env.VITE_KEYCLOAK_REALM,
      clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
      // @ts-expect-error: propiedad personalizada para redirectUri
      redirectUri: window.location.origin + '/',
    })
  }
  return keycloakInstance
}
