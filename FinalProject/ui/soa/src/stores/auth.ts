import { defineStore } from 'pinia'
import { ref } from 'vue'

interface UserInfo {
  username: string
  name: string
  email?: string
  roles: string[]
}

export const useAuthStore = defineStore('auth', () => {
  const isAuthenticated = ref(false)
  const token = ref<string | null>(null)
  const userInfo = ref<UserInfo | null>(null)

  function setAuth(newToken: string, newUserInfo: UserInfo) {
    token.value = newToken
    userInfo.value = newUserInfo
    isAuthenticated.value = true
  }

  function clearAuth() {
    token.value = null
    userInfo.value = null
    isAuthenticated.value = false
  }

  return {
    isAuthenticated,
    token,
    userInfo,
    setAuth,
    clearAuth,
  }
})