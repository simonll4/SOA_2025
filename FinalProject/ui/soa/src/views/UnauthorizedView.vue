<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useKeycloakAuth } from '@/composables/keycloak/useKeycloakAuth'

const router = useRouter()
const { initKeycloak, isAuthenticated, userInfo, hasValidRoles, logout } = useKeycloakAuth()

const errorMessage = computed(() => {
  return 'Tu cuenta no tiene los roles necesarios para acceder a esta aplicación. Necesitas tener asignado USER_ROLE o ADMIN_ROLE. Contacta al administrador del sistema o inicia sesión con una cuenta que tenga los permisos apropiados.'
})

const showRoleInfo = computed(() => true)

const requestRoles = async () => {
  try {
    // Asegurarse de que Keycloak esté inicializado antes del logout
    if (!isAuthenticated.value) {
      await initKeycloak()
    }
    // Hacer logout para redirigir a Keycloak
    logout()
  } catch (err) {
    console.error('Error al inicializar Keycloak antes del logout:', err)
    // Si falla, redirigir manualmente
    window.location.href = window.location.origin
  }
}
</script>

<template>
  <div
    class="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-6"
  >
    <svg class="h-20 w-20 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="1"
        d="M12 15v2m-6 4h12a2 2 0 002-2v-1a2 2 0 00-2-2H6a2 2 0 00-2 2v1a2 2 0 002 2zM12 7a4 4 0 100 8 4 4 0 000-8z"
      />
    </svg>
    <h2 class="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">Acceso No Autorizado</h2>
    <p class="mt-2 text-sm text-gray-600 dark:text-gray-400 max-w-md text-center">
      {{ errorMessage }}
    </p>

    <!-- Información adicional para usuarios sin roles -->
    <div
      v-if="showRoleInfo"
      class="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800 max-w-md"
    >
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clip-rule="evenodd"
            />
          </svg>
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-yellow-800 dark:text-yellow-200">Roles Actuales</h3>
          <div class="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
            <p v-if="userInfo?.roles && userInfo.roles.length > 0">
              Tienes: {{ userInfo.roles.join(', ') }}
            </p>
            <p v-else>No tienes roles asignados.</p>
            <p class="mt-1">Se requiere: USER_ROLE o ADMIN_ROLE</p>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-6 flex space-x-3">
      <button
        @click="requestRoles"
        class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
      >
        Iniciar Sesión Nuevamente
      </button>
    </div>
  </div>
</template>
