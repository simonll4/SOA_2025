import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface RaspberryDevice {
  id: string
  name: string
  location: string
  ipAddress: string
  status: 'healthy' | 'unhealthy' | 'offline'
  lastConnection: Date
}

export const useRaspberryDevicesStore = defineStore('raspberryDevices', () => {
  const devices = ref<RaspberryDevice[]>([])

  function upsertDeviceStatus(
    id: string,
    status: 'healthy' | 'unhealthy' | 'offline',
    timestamp: string | Date,
  ) {
    const existing = devices.value.find((d) => d.id === id)
    if (existing) {
      existing.status = status
      existing.lastConnection = new Date(timestamp)
    } else {
      devices.value.push({
        id,
        name: id,
        location: 'Desconocido',
        ipAddress: '0.0.0.0',
        status,
        lastConnection: new Date(timestamp),
      })
    }
  }

  function getDeviceById(id: string) {
    return devices.value.find((d) => d.id === id)
  }

  return {
    devices,
    upsertDeviceStatus,
    getDeviceById,
  }
})
