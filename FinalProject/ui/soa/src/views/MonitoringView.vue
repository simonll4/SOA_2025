<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'

import GrafanaDashboard from '@/components/GrafanaDashboard.vue'
import CommandPanel from '@/components/CommandPanel.vue'
import useRaspberryStatus from '@/composables/services/useRaspberryDevices'

const route = useRoute()

const { getDeviceById } = useRaspberryStatus()

const deviceInfo = computed(() => getDeviceById(deviceId.value))
const deviceId = computed(() => String(route.params.id))
const showCommandPanel = ref(false)

const toggleCommandPanel = () => (showCommandPanel.value = !showCommandPanel.value)
const closeCommandPanel = () => (showCommandPanel.value = false)
</script>

<style scoped>
.grafana-container {
  flex: 1;
  position: relative;
  min-height: calc(100vh - 200px); /* Altura mínima considerando header */
  height: 100%;
}
</style>
<template>
  <div class="h-full flex flex-col">
    <!-- HEADER -->
    <div
      class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-6 py-4"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <button
            @click="$router.push('/')"
            class="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Volver
          </button>
          <div>
            <h1 class="text-xl font-semibold text-gray-900 dark:text-white">
              Monitoreo - {{ deviceInfo?.name || deviceId }}
            </h1>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ deviceInfo?.location || 'Ubicación no especificada' }}
            </p>
          </div>
        </div>
        <div class="flex items-center space-x-3">
          <div class="flex items-center space-x-2">
            <span
              :class="[
                'w-2 h-2 rounded-full',
                deviceInfo?.status === 'online' ? 'bg-green-400' : 'bg-red-400',
              ]"
            ></span>
            <span class="leading-4 font-medium text-gray-600 dark:text-gray-300">{{
              deviceInfo?.status === 'online' ? 'En línea' : 'Desconectado'
            }}</span>
          </div>
          <button
            @click="toggleCommandPanel"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
            Panel de Comandos
          </button>
        </div>
      </div>
    </div>
    <!-- GRAFANA -->
    <div class="grafana-container"><GrafanaDashboard :device-id="deviceId" /></div>

    <!-- Slide-over -->
    <div
      v-if="showCommandPanel"
      class="fixed inset-0 overflow-hidden z-50"
      @keydown.esc="closeCommandPanel"
    >
      <div class="absolute inset-0 overflow-hidden">
        <div
          class="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          @click="closeCommandPanel"
        ></div>
        <section class="absolute right-0 top-0 h-full w-screen max-w-md">
          <div class="flex h-full flex-col overflow-y-scroll bg-white dark:bg-gray-800 shadow-xl">
            <div class="px-4 py-6 sm:px-6">
              <div class="flex items-start justify-between">
                <h2 class="text-lg font-medium text-gray-900 dark:text-white">Panel de Comandos</h2>
                <div class="ml-3 flex h-7 items-center">
                  <button
                    @click="closeCommandPanel"
                    class="rounded-md bg-white dark:bg-gray-800 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            <div class="relative flex-1 px-4 sm:px-6">
              <CommandPanel :raspberry-id="deviceId" />
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>
