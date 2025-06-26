import { ref } from 'vue'
import axios from 'axios'
import { useAuth } from './useAuth'
import { useNotifications } from './useNotifications'

interface CommandHistoryItem {
  command: string
  status: 'success' | 'error'
  timestamp: Date
}

const isExecuting = ref(false)
const commandHistory = ref<CommandHistoryItem[]>([])
const faceVerificationToken = ref<string | null>(null)

export function useCommands() {
  const { token } = useAuth()
  const { addNotification } = useNotifications()

  // API base URL - usando la misma lógica que en HomeView.vue
  const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:5002' : 'https://lpn2.crabdance.com/mqtt'

  const executeCommand = async (topic: string, message = '', raspberryId = 'raspi-1') => {
    if (isExecuting.value) return

    isExecuting.value = true

    try {
      const payload = {
        raspberry: raspberryId,
        topic,
        message,
      }

      const response = await axios.post(`${API_BASE}/command`, payload, {
        headers: {
          Authorization: `Bearer ${token.value}`,
        },
      })

      commandHistory.value.push({
        command: `${raspberryId}${topic} ${message}`.trim(),
        status: 'success',
        timestamp: new Date(),
      })

      addNotification({ 
        type: 'success', 
        title: 'Comando ejecutado', 
        message: `Comando publicado correctamente en ${payload.raspberry}${topic}` 
      })
      
      return { success: true, data: response.data }
    } catch (error: any) {
      console.error('Error executing command:', error)

      commandHistory.value.push({
        command: `${raspberryId}${topic} ${message}`.trim(),
        status: 'error',
        timestamp: new Date(),
      })

      const errorMessage = error.response?.data?.error || 'Error enviando comando MQTT'
      addNotification({ type: 'error', title: 'Error en comando', message: errorMessage })
      throw error
    } finally {
      isExecuting.value = false
    }
  }

  const executeCriticalCommand = async (topic: string, raspberryId = 'raspi-1') => {
    if (isExecuting.value) return

    if (!faceVerificationToken.value) {
      const errorMessage = 'Debe verificar el rostro antes de enviar comandos críticos.'
      addNotification({ type: 'error', title: 'Verificación requerida', message: errorMessage })
      throw new Error(errorMessage)
    }

    isExecuting.value = true

    try {
      const payload = {
        raspberry: raspberryId,
        topic,
      }

      const response = await axios.post(`${API_BASE}/command/critic`, payload, {
        headers: {
          Authorization: `Bearer ${token.value}`,
          'X-Face-Verification': faceVerificationToken.value,
        },
      })

      commandHistory.value.push({
        command: `${raspberryId}${topic} (crítico)`,
        status: 'success',
        timestamp: new Date(),
      })

      addNotification({ 
        type: 'success', 
        title: 'Comando crítico ejecutado', 
        message: `Comando crítico publicado correctamente en ${payload.raspberry}${topic}` 
      })
      
      return { success: true, data: response.data }
    } catch (error: any) {
      console.error('Error executing critical command:', error)

      commandHistory.value.push({
        command: `${raspberryId}${topic} (crítico)`,
        status: 'error',
        timestamp: new Date(),
      })

      const errorMessage = error.response?.data?.error || 'Error enviando comando crítico MQTT'
      addNotification({ type: 'error', title: 'Error en comando crítico', message: errorMessage })
      throw error
    } finally {
      isExecuting.value = false
    }
  }

  const setFaceVerificationToken = (token: string | null) => {
    faceVerificationToken.value = token
    console.log('FVT actualizado:', token)
  }

  const clearHistory = () => {
    commandHistory.value = []
  }

  return {
    executeCommand,
    executeCriticalCommand,
    isExecuting,
    commandHistory,
    faceVerificationToken,
    setFaceVerificationToken,
    clearHistory,
  }
} 