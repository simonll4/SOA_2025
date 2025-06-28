import { defineStore } from 'pinia'

export interface KeycloakUser {
  id: string
  username: string
  firstName?: string
  lastName?: string
  email?: string
  enabled: boolean
  emailVerified: boolean
  createdTimestamp?: number
}

export const useUsersStore = defineStore('users', {
  state: () => ({
    users: [] as KeycloakUser[],
    loading: false,
    error: null as string | null,
    lastFetch: null as Date | null,
  }),
  
  getters: {
    getUserById: (state) => (id: string) => {
      return state.users.find(user => user.id === id)
    },
    
    getUsersForSelect: (state) => {
      return state.users.map(user => ({
        value: user.id,
        label: `${user.username}${user.firstName || user.lastName ? ` (${[user.firstName, user.lastName].filter(Boolean).join(' ')})` : ''}`,
        user: user
      }))
    },
    
    enabledUsers: (state) => {
      return state.users.filter(user => user.enabled)
    }
  },
  
  actions: {
    setUsers(users: KeycloakUser[]) {
      this.users = users
      this.lastFetch = new Date()
      this.error = null
    },
    
    setLoading(loading: boolean) {
      this.loading = loading
    },
    
    setError(error: string | null) {
      this.error = error
    },
    
    clearUsers() {
      this.users = []
      this.lastFetch = null
      this.error = null
    },
    
    // Verifica si necesitamos refrescar los datos (cada 5 minutos)
    shouldRefresh(): boolean {
      if (!this.lastFetch) return true
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
      return this.lastFetch < fiveMinutesAgo
    }
  },
}) 