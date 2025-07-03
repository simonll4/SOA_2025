<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()
const goHome = () => router.push('/dashboard')
</script>

<template>
  <div
    class="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-6"
  >
    <h1 class="text-9xl font-bold text-gray-300 dark:text-gray-600">404</h1>
    <h2 class="mt-4 text-3xl font-extrabold text-gray-900 dark:text-white">Página No Encontrada</h2>
    <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">La página que buscas no existe.</p>
    <button
      @click="goHome"
      class="mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
    >
      Volver al Dashboard
    </button>
  </div>
</template>
