import { computed } from 'vue'
import { storeToRefs } from 'pinia'

import { useUsersStore, type KeycloakUser } from '@/stores/users'
import { getKeycloakInstance } from '@/services/keycloak/keycloak'
import { useAuthStore } from '@/stores/auth'

export function useKeycloakUsers() {
  const store = useUsersStore()
  const { users, loading, error } = storeToRefs(store)

  const authStore = useAuthStore()
  const { token, userInfo } = storeToRefs(authStore)
  const keycloak = getKeycloakInstance()

  const isAdmin = computed(() => userInfo.value?.roles?.includes('ADMIN_ROLE') || false)

  const usersForSelect = computed(() => store.getUsersForSelect)
  const enabledUsers = computed(() => store.enabledUsers)

  const fetchUsers = async (force = false) => {
    if (!isAdmin.value) {
      store.setError('No tienes permisos para ver los usuarios')
      return
    }

    if (!force && !store.shouldRefresh()) return

    store.setLoading(true)
    store.setError(null)

    try {
      const keycloakUrl = keycloak.authServerUrl
      const response = await fetch(
        `${keycloakUrl}/admin/realms/${keycloak.realm}/users?briefRepresentation=false&max=1000`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token.value}`,
            'Content-Type': 'application/json',
          },
        },
      )

      if (!response.ok) {
        const errorMsg =
          response.status === 403
            ? 'No tienes permisos para acceder a los usuarios de Keycloak'
            : `Error HTTP: ${response.status}`
        throw new Error(errorMsg)
      }

      const userData: any[] = await response.json()
      const mappedUsers: KeycloakUser[] = userData.map((user) => ({
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        enabled: user.enabled ?? true,
        emailVerified: user.emailVerified ?? false,
        createdTimestamp: user.createdTimestamp,
      }))

      store.setUsers(mappedUsers)
    } catch (err: any) {
      console.error('Error al obtener usuarios de Keycloak:', err)
      store.setError(err.message || 'Error al obtener usuarios')
    } finally {
      store.setLoading(false)
    }
  }

  const getUserById = (id: string) => store.getUserById(id)
  const refreshUsers = () => fetchUsers(true)

  const searchUsers = (query: string) => {
    if (!query.trim()) return users.value

    const searchTerm = query.toLowerCase()
    return users.value.filter(
      (user) =>
        user.username.toLowerCase().includes(searchTerm) ||
        user.firstName?.toLowerCase().includes(searchTerm) ||
        user.lastName?.toLowerCase().includes(searchTerm) ||
        user.email?.toLowerCase().includes(searchTerm),
    )
  }

  return {
    users,
    loading,
    error,
    usersForSelect,
    enabledUsers,
    fetchUsers,
    refreshUsers,
    getUserById,
    searchUsers,
  }
}
