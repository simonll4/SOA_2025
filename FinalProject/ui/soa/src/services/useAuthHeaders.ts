import { useAuthStore } from '@/stores/auth'

export function useAuthHeaders(extraHeaders: Record<string, string> = {}) {
  const authStore = useAuthStore()

  return {
    Authorization: `Bearer ${authStore.token}`,
    ...extraHeaders,
  }
}
