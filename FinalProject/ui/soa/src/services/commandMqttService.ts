import { mqttHttp } from './http'
import { useAuthHeaders } from './useAuthHeaders'

interface CommandPayload {
  raspberry: string
  topic: string
  message: string
}

export async function sendCommand(payload: CommandPayload) {
  const headers = useAuthHeaders()
  return mqttHttp.post('/command', payload, { headers })
}

export async function sendCriticalCommand(payload: CommandPayload, faceVerificationToken: string) {
  const headers = useAuthHeaders({
    'X-Face-Verification': faceVerificationToken,
  })
  return mqttHttp.post('/command/critic', payload, { headers })
}
