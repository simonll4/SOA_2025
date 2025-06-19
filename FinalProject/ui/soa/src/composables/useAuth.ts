import Keycloak from 'keycloak-js'
import { onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'

const keycloak = new Keycloak({
  url: 'https://keycloak.lpn1.crabdance.com/',
  realm: 'SOA-2025',
  clientId: 'vue-app',
})

const initialized = ref(false)

export function useAuth() {
  const store = useAuthStore()
const { isAuthenticated, userInfo, token } = storeToRefs(store)

  const initKeycloak = async () => {
    if (initialized.value) return

    try {
      const authenticated = await keycloak.init({
        onLoad: 'login-required',
        checkLoginIframe: false,
      })

      if (authenticated) {
        const token = keycloak.token!
        const parsedToken: any = keycloak.tokenParsed

        const userInfo = {
          username: parsedToken?.preferred_username,
          email: parsedToken?.email,
          //roles: parsedToken?.realm_access?.roles || [],
          roles: parsedToken?.resource_access?.['vue-app']?.roles || [],
        }

        store.setAuth(token, userInfo)
        initialized.value = true

        // Token refresh automático
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

  onMounted(() => {
    initKeycloak()
  })

  return {
    keycloak,
    initKeycloak,
    logout,
    isAuthenticated,
    userInfo,
    token
  }
}
