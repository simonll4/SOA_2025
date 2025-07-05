import { computed, toRefs, onUnmounted, ref } from 'vue'
import { useRaspberryDevicesStore } from '@/stores/raspberryDevicesStore'

const WS_TOPIC = import.meta.env.VITE_RASPBERRY_STATUS_API_URL

export default function useRaspberryStatus() {
  const raspberryStore = useRaspberryDevicesStore()

  const socket = ref<WebSocket | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const connectWebSocket = () => {
    loading.value = true
    socket.value = new WebSocket(WS_TOPIC)

    socket.value.onopen = () => {
      loading.value = false
      console.log('WebSocket conectado')
    }

    socket.value.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log('data', data)
        if (data.results && typeof data.results === 'object') {
          Object.entries(data.results).forEach(([id, rawStatus]) => {
            let status: 'healthy' | 'unhealthy' | 'offline'
            if (rawStatus === 'online') status = 'healthy'
            else if (rawStatus === 'warning') status = 'unhealthy'
            else status = 'offline'

            raspberryStore.upsertDeviceStatus(id, status, data.timestamp || new Date())
          })
        }
      } catch (e) {
        error.value = 'Error parseando mensaje WebSocket'
        console.error('Error JSON:', e)
      }
    }

    socket.value.onerror = (e) => {
      loading.value = false
      error.value = 'WebSocket error'
      console.error('WS error:', e)
    }

    socket.value.onclose = () => {
      loading.value = false
      console.log('WebSocket desconectado')
    }
  }

  const disconnectWebSocket = () => {
    socket.value?.close()
    socket.value = null
  }

  onUnmounted(() => {
    disconnectWebSocket()
  })

  const devices = computed(() => raspberryStore.devices)
  const onlineDevices = computed(() => devices.value.filter((d) => d.status === 'healthy'))
  const offlineDevices = computed(() => devices.value.filter((d) => d.status === 'offline'))

  return {
    ...toRefs(raspberryStore),
    connectWebSocket,
    disconnectWebSocket,
    devices,
    onlineDevices,
    offlineDevices,
    loading,
    error,
    getDeviceById: raspberryStore.getDeviceById,
  }
}
