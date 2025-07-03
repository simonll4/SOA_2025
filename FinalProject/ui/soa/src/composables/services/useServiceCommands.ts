import { ref } from 'vue'
import { useRoute } from 'vue-router'

import { useNotifications } from '../useNotifications'
import { sendCommand, sendCriticalCommand } from '@/services/commandMqttService'

interface CommandHistoryItem {
  command: string
  status: 'success' | 'error'
  timestamp: Date
}

const isExecuting = ref(false)
const commandHistory = ref<CommandHistoryItem[]>([])
const faceVerificationToken = ref<string | null>(null)

export function useServiceCommands() {
  const route = useRoute()
  const raspberryId = route.params.id as string
  const { addNotification } = useNotifications()

  const executeCommand = async (topic: string, message = '', id = raspberryId) => {
    if (isExecuting.value) return
    isExecuting.value = true

    const payload = {
      raspberry: id,
      topic,
      message,
    }

    try {
      const response = await sendCommand(payload)

      commandHistory.value.push({
        command: `${id}${topic} ${message}`.trim(),
        status: 'success',
        timestamp: new Date(),
      })

      addNotification({
        type: 'success',
        title: 'Comando ejecutado',
        message: `Comando publicado correctamente en ${payload.raspberry}${topic}`,
      })

      return { success: true, data: response.data }
    } catch (error: any) {
      console.error('Error ejecutando comando:', error)

      commandHistory.value.push({
        command: `${id}${topic} ${message}`.trim(),
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

  const executeCriticalCommand = async (topic: string, id = raspberryId) => {
    if (isExecuting.value) return

    if (!faceVerificationToken.value) {
      const errorMessage = 'Debe verificar el rostro antes de enviar comandos críticos.'
      addNotification({ type: 'error', title: 'Verificación requerida', message: errorMessage })
      throw new Error(errorMessage)
    }

    isExecuting.value = true

    const payload = {
      raspberry: id,
      topic,
      message: '',
    }

    try {
      const response = await sendCriticalCommand(payload, faceVerificationToken.value)

      commandHistory.value.push({
        command: `${id}${topic} (crítico)`,
        status: 'success',
        timestamp: new Date(),
      })

      addNotification({
        type: 'success',
        title: 'Comando crítico ejecutado',
        message: `Comando crítico publicado correctamente en ${payload.raspberry}${topic}`,
      })

      return { success: true, data: response.data }
    } catch (error: any) {
      console.error('Error ejecutando comando crítico:', error)

      commandHistory.value.push({
        command: `${id}${topic} (crítico)`,
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
