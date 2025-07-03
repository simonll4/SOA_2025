<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, RouterLink, RouterView } from 'vue-router'

import { useKeycloakAuth } from '@/composables/keycloak/useKeycloakAuth'
import useRaspberryStatus from '@/composables/services/useRaspberryDevices'
import { useTheme } from '@/composables/useTheme'

const { initKeycloak } = useKeycloakAuth()
const { connectWebSocket } = useRaspberryStatus()

onMounted(() => {
  initKeycloak()
  connectWebSocket()
})

const route = useRoute()
const { userInfo, logout, isAdmin } = useKeycloakAuth()
const { isDark, toggleTheme } = useTheme()

const sidebarOpen = ref(false)

const titleMap: Record<string, string> = {
  '/dashboard': 'Panel de Control',
  '/dashboard/admin/profiles': 'Perfiles Biométricos',
}
const pageTitle = computed(() => titleMap[route.path] || 'SOA Monitor')

const toggleSidebar = () => (sidebarOpen.value = !sidebarOpen.value)
const closeSidebar = () => (sidebarOpen.value = false)
</script>

<style scoped></style>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- SIDEBAR -->
    <div
      :class="[
        'fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        'lg:translate-x-0',
      ]"
    >
      <div class="flex items-center justify-center h-16 px-4 bg-blue-600 dark:bg-blue-700">
        <h1 class="text-xl font-bold text-white">SOA Monitor</h1>
      </div>

      <nav class="mt-8">
        <div class="px-4 space-y-2">
          <RouterLink
            to="/dashboard"
            class="flex items-center px-4 py-2 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            :class="{
              'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200':
                $route.path === '/dashboard',
            }"
          >
            <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
              />
            </svg>
            Dashboard
          </RouterLink>

          <RouterLink
            v-if="isAdmin"
            to="/dashboard/admin/profiles"
            class="flex items-center px-4 py-2 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            :class="{
              'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200':
                $route.path === '/admin/profiles',
            }"
          >
            <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            Perfiles Biométricos
          </RouterLink>
        </div>
      </nav>

      <!-- USER INFO -->
      <div
        class="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700"
      >
        <div class="flex items-center">
          <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <span class="text-white text-sm font-medium">{{
              userInfo?.username?.charAt(0).toUpperCase()
            }}</span>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-700 dark:text-gray-200">
              {{ userInfo?.username }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              {{ isAdmin ? 'Administrador' : 'Operador' }}
            </p>
          </div>
          <button
            @click="logout"
            class="ml-auto p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- MAIN -->
    <div class="lg:pl-64 flex flex-col min-h-screen">
      <!-- TOP BAR -->
      <div
        class="sticky top-0 z-40 flex h-16 items-center gap-x-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8"
      >
        <button
          @click="toggleSidebar"
          class="lg:hidden -m-2.5 p-2.5 text-gray-700 dark:text-gray-200"
        >
          <svg
            class="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
            />
          </svg>
        </button>

        <div class="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
          <div class="flex items-center gap-x-4 lg:gap-x-6">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">{{ pageTitle }}</h2>
          </div>

          <div class="ml-auto flex items-center gap-x-4 lg:gap-x-6">
            <button
              @click="toggleTheme"
              class="p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <svg
                v-if="isDark"
                class="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              <svg v-else class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- PAGE -->
      <main class="flex-1 min-h-0 overflow-auto py-6 px-4 sm:px-6 lg:px-8">
        <RouterView />
      </main>
    </div>

    <!-- Mobile overlay -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
      @click="closeSidebar"
    ></div>
  </div>
</template>
