<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-6">
    <svg class="h-20 w-20 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M12 15v2m-6 4h12a2 2 0 002-2v-1a2 2 0 00-2-2H6a2 2 0 00-2 2v1a2 2 0 002 2zM12 7a4 4 0 100 8 4 4 0 000-8z" />
    </svg>
    <h2 class="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">Acceso No Autorizado</h2>
    <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">No tienes permisos para acceder a esta página.</p>
    <div class="mt-6 flex space-x-3">
      <button @click="retry" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md">Reintentar</button>
      <button @click="goHome" class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md">Inicio</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { initKeycloak } = useAuth()

const retry = async () => {
  try {
    await initKeycloak()
    router.push('/dashboard')
  } catch (err) {
    console.error('Retry auth failed', err)
  }
}
const goHome = () => router.push('/dashboard')
</script> 