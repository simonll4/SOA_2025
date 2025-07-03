import { ref, nextTick } from 'vue'

import { useServiceCommands } from './useServiceCommands'
import { useNotifications } from '../useNotifications'
import { recognizeFace } from '@/services/faceRecognitionService'

export function useFaceVerification() {
  const { setFaceVerificationToken } = useServiceCommands()
  const { addNotification } = useNotifications()

  const video = ref<HTMLVideoElement | null>(null)
  const isCameraOpen = ref(false)
  const loading = ref(false)
  const error = ref('')
  const result = ref<any>(null)
  const attempts = ref(0)
  const maxAttempts = 5
  const recognitionInterval = ref<number | null>(null)
  const stream = ref<MediaStream | null>(null)
  const faceStatus = ref<'searching' | 'found' | 'error' | 'none'>('searching')

  const startRecognition = async () => {
    error.value = ''
    result.value = null
    attempts.value = 0
    faceStatus.value = 'searching'

    try {
      stream.value = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      })

      isCameraOpen.value = true
      await nextTick()

      if (!video.value) throw new Error('No se encontró el elemento de video')
      video.value.srcObject = stream.value

      recognitionInterval.value = window.setInterval(() => {
        if (attempts.value >= maxAttempts) {
          stopRecognition()
          faceStatus.value = 'error'
          error.value = 'No se pudo reconocer el rostro después de varios intentos.'
          return
        }

        captureAndRecognize()
      }, 1000)
    } catch (err: any) {
      error.value = `Error al acceder a la cámara: ${err.message}`
      faceStatus.value = 'error'
    }
  }

  const stopRecognition = () => {
    stream.value?.getTracks().forEach((track) => track.stop())
    stream.value = null

    if (recognitionInterval.value) {
      clearInterval(recognitionInterval.value)
      recognitionInterval.value = null
    }

    isCameraOpen.value = false
    loading.value = false
    faceStatus.value = 'none'
  }

  const captureAndRecognize = async () => {
    if (loading.value || !video.value) return

    attempts.value++
    loading.value = true
    error.value = ''

    try {
      const canvas = document.createElement('canvas')
      canvas.width = video.value.videoWidth
      canvas.height = video.value.videoHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('No se pudo obtener el contexto del canvas')

      ctx.drawImage(video.value, 0, 0, canvas.width, canvas.height)

      const blob = await new Promise<Blob>((resolve) =>
        canvas.toBlob(resolve as BlobCallback, 'image/jpeg', 0.8),
      )
      if (!blob) throw new Error('No se pudo crear la imagen')

      const formData = new FormData()
      formData.append('file', blob, 'capture.jpg')

      const response = await recognizeFace(formData)

      result.value = {
        ...response.data.data,
        status: response.data.status,
        message: response.data.message,
      }

      if (response.data.data?.face_verification_token) {
        const fvt = response.data.data.face_verification_token
        setFaceVerificationToken(fvt)
        addNotification({
          type: 'success',
          title: 'Verificación exitosa',
          message: 'Rostro verificado correctamente. Comandos críticos habilitados.',
        })
      }

      if (response.data.status === 'success') {
        faceStatus.value = 'found'
        stopRecognition()
      } else if (response.data.status === 'not_found') {
        faceStatus.value = 'searching'
      } else {
        faceStatus.value = 'error'
        error.value = response.data.message || 'Error desconocido'
      }
    } catch (err: any) {
      faceStatus.value = 'error'
      error.value = err.response?.data?.message || 'Error al comunicarse con el servidor'
    } finally {
      loading.value = false
    }
  }

  return {
    video,
    isCameraOpen,
    loading,
    error,
    result,
    attempts,
    maxAttempts,
    faceStatus,
    startRecognition,
    stopRecognition,
  }
}
