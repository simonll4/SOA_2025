import { ref, computed } from 'vue'

export interface RaspberryDevice {
  id: string
  name: string
  location: string
  status: 'online' | 'offline' | 'warning'
  lastConnection: Date
  ipAddress: string
}

const devices = ref<RaspberryDevice[]>([
  {
    id: 'rpi-001',
    name: 'Raspberry Pi Lab 1',
    location: 'Laboratorio Principal',
    status: 'online',
    lastConnection: new Date('2024-01-15T10:30:00'),
    ipAddress: '192.168.1.100',
  },
  {
    id: 'rpi-002',
    name: 'Raspberry Pi Lab 2',
    location: 'Laboratorio Secundario',
    status: 'warning',
    lastConnection: new Date('2024-01-15T09:45:00'),
    ipAddress: '192.168.1.101',
  },
  {
    id: 'rpi-003',
    name: 'Raspberry Pi Producción',
    location: 'Área de Producción',
    status: 'offline',
    lastConnection: new Date('2024-01-14T16:20:00'),
    ipAddress: '192.168.1.102',
  },
  {
    id: 'rpi-004',
    name: 'Raspberry Pi Monitoreo',
    location: 'Sala de Control',
    status: 'online',
    lastConnection: new Date('2024-01-15T11:00:00'),
    ipAddress: '192.168.1.103',
  },
])

export function useRaspberryDevices() {
  const loadDevices = async (): Promise<RaspberryDevice[]> => {
    // Simular llamada API
    return new Promise((resolve) => {
      setTimeout(() => resolve(devices.value), 1000)
    })
  }

  const getDeviceById = (id: string) => devices.value.find((d) => d.id === id)

  const updateDeviceStatus = (id: string, status: RaspberryDevice['status']) => {
    const device = getDeviceById(id)
    if (device) {
      device.status = status
      device.lastConnection = new Date()
    }
  }

  const onlineDevices = computed(() => devices.value.filter((d) => d.status === 'online'))
  const offlineDevices = computed(() => devices.value.filter((d) => d.status === 'offline'))

  return {
    devices,
    loadDevices,
    getDeviceById,
    updateDeviceStatus,
    onlineDevices,
    offlineDevices,
  }
} 