import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'

import { useAuthStore } from '@/stores/auth'
import { getKeycloakInstance } from '@/services/keycloak/keycloak'

const initialized = ref(false)

// Roles requeridos para acceder a la aplicación
const REQUIRED_ROLES = ['USER_ROLE', 'ADMIN_ROLE']

export function useKeycloakAuth() {
  const keycloak = getKeycloakInstance()
  const store = useAuthStore()
  const { isAuthenticated, userInfo, token } = storeToRefs(store)

  const isAdmin = computed(() => userInfo.value?.roles?.includes('ADMIN_ROLE') || false)
  const isOperator = computed(() => userInfo.value?.roles?.includes('USER_ROLE') || false)
  const hasValidRoles = computed(() => isAdmin.value || isOperator.value)

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

        // Verificar si el usuario tiene los roles requeridos
        const hasRequiredRoles =
          userInfo.roles.includes('USER_ROLE') || userInfo.roles.includes('ADMIN_ROLE')

        if (!hasRequiredRoles) {
          console.warn('Usuario sin roles requeridos')
          // No hacemos logout automático, dejamos que el router maneje la redirección
        }

        store.setAuth(keycloak.token, userInfo)
        initialized.value = true

        // Refrescar el token periódicamente
        setInterval(async () => {
          try {
            const refreshed = await keycloak.updateToken(60)
            if (refreshed && keycloak.token) {
              const refreshedToken: any = keycloak.tokenParsed
              const refreshedUserInfo = {
                username: refreshedToken?.preferred_username,
                email: refreshedToken?.email,
                roles: refreshedToken?.resource_access?.['vue-app']?.roles || [],
                name: refreshedToken?.name,
              }

              // Verificar roles nuevamente al refrescar el token
              const stillHasRequiredRoles =
                refreshedUserInfo.roles.includes('USER_ROLE') ||
                refreshedUserInfo.roles.includes('ADMIN_ROLE')

              if (!stillHasRequiredRoles) {
                console.warn('Usuario perdió roles requeridos')
                // No hacemos logout automático durante el refresh
              }

              store.setAuth(keycloak.token, refreshedUserInfo)
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
    if (keycloak && keycloak.logout) {
      keycloak.logout({
        redirectUri: window.location.origin,
      })
    } else {
      // Si keycloak no está disponible, redirigir manualmente
      window.location.href = window.location.origin
    }
    store.clearAuth()
  }

  const hasRole = (role: string) => {
    return userInfo.value?.roles?.includes(role) || false
  }

  const hasAnyRole = (roles: string[]) => {
    return roles.some((role) => userInfo.value?.roles?.includes(role))
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
    hasValidRoles,
    hasRole,
    hasAnyRole,
  }
}
