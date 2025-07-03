import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'

import { useAuthStore } from '@/stores/auth'
import { getKeycloakInstance } from '@/services/keycloak/keycloak'

const initialized = ref(false)

export function useKeycloakAuth() {
  const keycloak = getKeycloakInstance()
  const store = useAuthStore()
  const { isAuthenticated, userInfo, token } = storeToRefs(store)

  const isAdmin = computed(() => userInfo.value?.roles?.includes('ADMIN_ROLE') || false)
  const isOperator = computed(() => userInfo.value?.roles?.includes('USER_ROLE') || false)

  const initKeycloak = async () => {
    if (initialized.value) return

    try {
      const authenticated = await keycloak.init({
        onLoad: 'login-required',
        checkLoginIframe: false,
      })

      if (authenticated && keycloak.token) {
        const parsedToken: any = keycloak.tokenParsed

        const userInfo = {
          username: parsedToken?.preferred_username,
          email: parsedToken?.email,
          roles: parsedToken?.resource_access?.['vue-app']?.roles || [],
          name: parsedToken?.name,
        }

        store.setAuth(keycloak.token, userInfo)
        initialized.value = true

        // Refrescar el token periódicamente
        setInterval(async () => {
          try {
            const refreshed = await keycloak.updateToken(60)
            if (refreshed && keycloak.token) {
              store.token = keycloak.token
            }
          } catch (err) {
            console.error('Error al refrescar token:', err)
          }
        }, 60000)
      } else {
        store.clearAuth()
      }
    } catch (err) {
      console.error('Fallo la autenticación:', err)
      store.clearAuth()
    }
  }

  const logout = () => {
    keycloak.logout()
    store.clearAuth()
  }

  return {
    keycloak,
    initKeycloak,
    logout,
    isAuthenticated,
    userInfo,
    token,
    isAdmin,
    isOperator,
  }
}
