<script setup lang="ts">
import StatCard from '@/components/StatCard.vue'
import StatCardSkeleton from '@/components/StatCardSkeleton.vue'
import DevicesTableSkeleton from '@/components/DevicesTableSkeleton.vue'
import { RouterLink } from 'vue-router'
import { onMounted } from 'vue'

import { useKeycloakAuth } from '@/composables/keycloak/useKeycloakAuth'
import useRaspberryStatus from '@/composables/services/useRaspberryDevices'

const { devices, onlineDevices, offlineDevices, loading, connectWebSocket } = useRaspberryStatus()
const { userInfo, isAdmin } = useKeycloakAuth()

onMounted(() => {
  connectWebSocket()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Bienvenida -->
    <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6 flex items-center">
      <div class="flex-shrink-0 w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <div class="ml-5 flex-1">
        <p class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
          Bienvenido de vuelta
        </p>
        <p class="text-lg font-medium text-gray-900 dark:text-white capitalize">
          {{ userInfo?.name }}
        </p>
      </div>
      <span
        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
        :class="
          isAdmin
            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
        "
        >{{ isAdmin ? 'Administrador' : 'Operador' }}</span
      >
    </div>

    <!-- Stats -->
    <div class="grid gap-5 grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
      <template v-if="loading">
        <StatCardSkeleton v-for="i in 3" :key="i" class="w-full" />
      </template>
      <template v-else>
        <StatCard
          class="w-full"
          title="Dispositivos Activos"
          :value="onlineDevices.length"
          icon-bg="bg-green-500"
          icon-path="M5 13l4 4L19 7"
        />
        <StatCard
          class="w-full"
          title="Dispositivos Offline"
          :value="offlineDevices.length"
          icon-bg="bg-red-500"
          icon-path="M6 18L18 6M6 6l12 12"
        />
        <StatCard
          class="w-full"
          title="Total Dispositivos"
          :value="devices.length"
          icon-bg="bg-purple-500"
          icon-path="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </template>
    </div>

    <!-- Tabla dispositivos -->
    <DevicesTableSkeleton v-if="loading" />
    <div v-else class="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 class="text-lg font-medium text-gray-900 dark:text-white">Dispositivos Raspberry Pi</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Selecciona un dispositivo para monitorear
        </p>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Dispositivo
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Estado
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Ubicación
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Última Conexión
              </th>
              <th class="px-6 py-3" />
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr
              v-for="device in devices"
              :key="device.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {{ device.name }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="[
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    device.status === 'online'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : device.status === 'unhealthy'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
                  ]"
                  >{{ device.status }}</span
                >
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                Córdoba, Argentina
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                {{ device.lastConnection.toLocaleString() }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <RouterLink
                  :to="`/dashboard/monitoring/${device.id}`"
                  class="text-blue-600 hover:text-blue-900 dark:text-blue-400"
                  >Ver</RouterLink
                >
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
