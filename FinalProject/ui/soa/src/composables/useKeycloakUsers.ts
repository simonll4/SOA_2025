import { ref, computed } from 'vue'
import { useUsersStore, type KeycloakUser } from '@/stores/users'
import { useAuth } from '@/composables/useAuth'
import { storeToRefs } from 'pinia'

export function useKeycloakUsers() {
  const store = useUsersStore()
  const { users, loading, error } = storeToRefs(store)
  const { keycloak, token, isAdmin } = useAuth()

  // Computed para el select
  const usersForSelect = computed(() => store.getUsersForSelect)
  const enabledUsers = computed(() => store.enabledUsers)

  // Función para obtener usuarios usando la API de administración de Keycloak
  const fetchUsers = async (force = false) => {
    if (!isAdmin.value) {
      store.setError('No tienes permisos para ver los usuarios')
      return
    }

    if (!force && !store.shouldRefresh()) {
      return // Ya tenemos datos recientes
    }

    store.setLoading(true)
    store.setError(null)

    try {
      // Usar la API de administración de Keycloak
      const keycloakUrl = keycloak.authServerUrl || 'https://keycloak.lpn1.crabdance.com'
      const response = await fetch(
        `${keycloakUrl}/admin/realms/${keycloak.realm}/users?briefRepresentation=false&max=1000`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token.value}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('No tienes permisos para acceder a los usuarios de Keycloak')
        }
        throw new Error(`Error HTTP: ${response.status}`)
      }

      const userData: any[] = await response.json()
      
      // Mapear los datos de Keycloak a nuestro formato
      const mappedUsers: KeycloakUser[] = userData.map(user => ({
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

  // Función para obtener un usuario específico por ID
  const getUserById = (id: string) => {
    return store.getUserById(id)
  }

  // Función para refrescar usuarios
  const refreshUsers = () => {
    return fetchUsers(true)
  }

  // Función para buscar usuarios (filtro local)
  const searchUsers = (query: string) => {
    if (!query.trim()) return users.value

    const searchTerm = query.toLowerCase()
    return users.value.filter(user => 
      user.username.toLowerCase().includes(searchTerm) ||
      user.firstName?.toLowerCase().includes(searchTerm) ||
      user.lastName?.toLowerCase().includes(searchTerm) ||
      user.email?.toLowerCase().includes(searchTerm)
    )
  }

  return {
    // State
    users,
    loading,
    error,
    usersForSelect,
    enabledUsers,
    
    // Actions
    fetchUsers,
    refreshUsers,
    getUserById,
    searchUsers,
  }
} 