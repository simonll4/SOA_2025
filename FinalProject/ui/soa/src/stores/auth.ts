// stores/auth.ts
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    isAuthenticated: false,
    token: null as string | null,
    userInfo: null as {
      username: string
      email?: string
      roles: string[]
    } | null,
  }),
  actions: {
    setAuth(token: string, userInfo: any) {
      this.token = token
      this.userInfo = userInfo
      this.isAuthenticated = true
    },
    clearAuth() {
      this.token = null
      this.userInfo = null
      this.isAuthenticated = false
    },
  },
})
