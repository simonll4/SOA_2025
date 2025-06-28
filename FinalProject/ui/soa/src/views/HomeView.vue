<template>
  <div class="recognize-container">
    <h2>Verificación Facial</h2>

    <div v-if="!isCameraOpen">
      <button @click="startRecognition">Iniciar Verificación</button>
    </div>

    <div v-else class="camera-wrapper">
      <video ref="video" autoplay playsinline class="camera-feed"></video>

      <div class="overlay">
        <div class="scanner-line" :class="faceStatus"></div>
      </div>

      <div class="controls">
        <button class="cancel-btn" @click="stopRecognition">Cancelar</button>
      </div>
    </div>

    <div v-if="loading">Procesando imagen...</div>
    <div v-if="error" class="error">{{ error }}</div>
    <div v-if="attempts > 0" class="attempts">Intentos: {{ attempts }}/{{ maxAttempts }}</div>

    <div v-if="result" class="result">
      <p><strong>Estado:</strong> {{ result.status }}</p>
      <p><strong>Etiqueta:</strong> {{ result.label }}</p>
      <p v-if="result.user_id"><strong>User ID:</strong> {{ result.user_id }}</p>
      <p v-if="result.user_name"><strong>User Name:</strong> {{ result.user_name }}</p>
      <p v-if="result.similarity"><strong>Similitud:</strong> {{ result.similarity }}</p>
      <p v-if="result.confidence"><strong>Confianza:</strong> {{ result.confidence }}</p>
    </div>
  </div>

  <div class="test-commands" v-if="token">
    <h3>Probar comandos MQTT</h3>

    <label>
      Raspberry ID:
      <input v-model="raspberryId" />
    </label>

    <div class="btn-row">
      <button @click="sendTestCommand('/led', 'on')">LED ON</button>
      <button @click="sendTestCommand('/led', 'off')">LED OFF</button>
      <button @click="sendTestCommand('/moveservo', '90')">Mover Servo 90°</button>
      <button @click="sendTestCommand('/rgb', '255 0 0')">RGB Rojo</button>
      <button @click="sendTestCommand('/rgb', '0 255 0')">RGB Verde</button>
      <button @click="sendTestCommand('/rgb', '0 0 255')">RGB Azul</button>
    </div>

    <h3>Comandos Críticos</h3>
    <div class="btn-row">
      <button @click="sendCriticalCommand('/startf')">Iniciar Bomba F</button>
      <button @click="sendCriticalCommand('/stopf')">Detener Bomba F</button>
      <button @click="sendCriticalCommand('/startd')">Iniciar Bomba D</button>
      <button @click="sendCriticalCommand('/stopd')">Detener Bomba D</button>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import axios from 'axios'
import { useAuth } from '@/composables/useAuth'

const { token } = useAuth()

const video = ref(null)
const isCameraOpen = ref(false)
const loading = ref(false)
const error = ref('')
const result = ref(null)
const attempts = ref(0)
const maxAttempts = 5
const recognitionInterval = ref(null)
const stream = ref(null)
const faceStatus = ref('searching')
const raspberryId = ref('raspi-1')
const faceVerificationToken = ref(null)

const API_BASE =
  'localhost1' === 'localhost' ? 'http://localhost:5173' : 'https://lpn2.crabdance.com/mqtt'

async function startRecognition() {
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

    recognitionInterval.value = setInterval(() => {
      if (attempts.value >= maxAttempts) {
        stopRecognition()
        faceStatus.value = 'error'
        error.value = 'No se pudo reconocer el rostro después de varios intentos.'
        return
      }

      captureAndRecognize()
    }, 1000)
  } catch (err) {
    error.value = `Error al acceder a la cámara: ${err.message}`
    faceStatus.value = 'error'
  }
}

function stopRecognition() {
  if (stream.value) {
    stream.value.getTracks().forEach((track) => track.stop())
    stream.value = null
  }
  if (recognitionInterval.value) {
    clearInterval(recognitionInterval.value)
    recognitionInterval.value = null
  }

  isCameraOpen.value = false
  loading.value = false
  faceStatus.value = 'none'
}

async function captureAndRecognize() {
  if (loading.value || !video.value) return

  attempts.value++
  loading.value = true
  error.value = ''

  try {
    const canvas = document.createElement('canvas')
    canvas.width = video.value.videoWidth
    canvas.height = video.value.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video.value, 0, 0, canvas.width, canvas.height)

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.8))

    const formData = new FormData()
    formData.append('file', blob, 'capture.jpg')
    const response = await axios.post('https://lpn3.crabdance.com/api/face/recognize', formData, {
    //const response = await axios.post('http://localhost:5000/recognize', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token.value}`,
      },
    })

    result.value = {
      ...response.data.data,
      status: response.data.status,
      message: response.data.message,
    }

    // Guardar el FVT si existe
    if (response.data.data?.face_verification_token) {
      faceVerificationToken.value = response.data.data.face_verification_token
      console.log('FVT guardado:', faceVerificationToken.value)
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
  } catch (err) {
    faceStatus.value = 'error'
    error.value = err.response?.data?.message || 'Error al comunicarse con el servidor'
  } finally {
    loading.value = false
  }
}

async function sendTestCommand(topic, message) {
  if (!raspberryId.value) {
    error.value = 'Debe ingresar un ID de Raspberry'
    return
  }

  try {
    const payload = {
      raspberry: raspberryId.value,
      topic,
      message,
    }

    const response = await axios.post(`${API_BASE}/command`, payload, {
      headers: {
        Authorization: `Bearer ${token.value}`,
      },
    })

    console.log('Comando MQTT enviado:', response.data)
    alert(`Comando publicado correctamente en ${payload.raspberry}${topic}`)
  } catch (err) {
    console.log('Error enviando comando:', err)
    error.value = err.response?.data?.error || 'Error enviando comando MQTT'
  }
}

async function sendCriticalCommand(topic) {
  if (!raspberryId.value) {
    error.value = 'Debe ingresar un ID de Raspberry'
    return
  }

  // if (!faceVerificationToken.value) {
  //   error.value = 'Debe verificar el rostro antes de enviar comandos críticos.'
  //   return
  // }

  try {
    const payload = {
      raspberry: raspberryId.value,
      topic,
    }

    const response = await axios.post(`${API_BASE}/command/critic`, payload, {
      headers: {
        Authorization: `Bearer ${token.value}`,
        'X-Face-Verification': faceVerificationToken.value,
      },
    })

    console.log('Comando crítico enviado:', response.data)
    alert(`Comando crítico publicado correctamente en ${payload.raspberry}${topic}`)
  } catch (err) {
    console.error('Error enviando comando crítico:', err)
    error.value = err.response?.data?.error || 'Error enviando comando crítico MQTT'
  }
}
</script>

<!-- 

<template>
  <div class="recognize-container">
    <h2>Verificación Facial</h2>

    <div v-if="!isCameraOpen">
      <button @click="startRecognition">Iniciar Verificación</button>
    </div>

    <div v-else class="camera-wrapper">
      <video ref="video" autoplay playsinline class="camera-feed"></video>

      <div class="overlay">
        <div class="scanner-line" :class="faceStatus"></div>
      </div>

      <div class="controls">
        <button class="cancel-btn" @click="stopRecognition">Cancelar</button>
      </div>
    </div>

    <div v-if="loading">Procesando imagen...</div>
    <div v-if="error" class="error">{{ error }}</div>
    <div v-if="attempts > 0" class="attempts">Intentos: {{ attempts }}/{{ maxAttempts }}</div>

    <div v-if="result" class="result">
      <p><strong>Estado:</strong> {{ result.status }}</p>
      <p><strong>Etiqueta:</strong> {{ result.label }}</p>
      <p v-if="result.user_id"><strong>User ID:</strong> {{ result.user_id }}</p>
      <p v-if="result.user_name"><strong>User Name:</strong> {{ result.user_name }}</p>
      <p v-if="result.similarity"><strong>Similitud:</strong> {{ result.similarity }}</p>
      <p v-if="result.confidence"><strong>Confianza:</strong> {{ result.confidence }}</p>
    </div>
  </div>

  <div class="test-commands" v-if="token">
    <h3>Probar comandos MQTT</h3>

    <label>
      Raspberry ID:
      <input v-model="raspberryId" />
    </label>

    <div class="btn-row">
      <button @click="sendTestCommand('/led', 'on')">LED ON</button>
      <button @click="sendTestCommand('/led', 'off')">LED OFF</button>
      <button @click="sendTestCommand('/moveservo', '90')">Mover Servo 90°</button>
      <button @click="sendTestCommand('/rgb', '255 0 0')">RGB Rojo</button>
      <button @click="sendTestCommand('/rgb', '0 255 0')">RGB Verde</button>
      <button @click="sendTestCommand('/rgb', '0 0 255')">RGB Azul</button>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import axios from 'axios'
import { useAuth } from '@/composables/useAuth'

const { token } = useAuth()

const video = ref(null)
const isCameraOpen = ref(false)
const loading = ref(false)
const error = ref('')
const result = ref(null)
const attempts = ref(0)
const maxAttempts = 5
const recognitionInterval = ref(null)
const stream = ref(null)
const faceStatus = ref('searching')

async function startRecognition() {
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

    recognitionInterval.value = setInterval(() => {
      if (attempts.value >= maxAttempts) {
        stopRecognition()
        faceStatus.value = 'error'
        error.value = 'No se pudo reconocer el rostro después de varios intentos.'
        return
      }

      captureAndRecognize()
    }, 1000)
  } catch (err) {
    error.value = `Error al acceder a la cámara: ${err.message}`
    faceStatus.value = 'error'
  }
}

function stopRecognition() {
  if (stream.value) {
    stream.value.getTracks().forEach((track) => track.stop())
    stream.value = null
  }
  if (recognitionInterval.value) {
    clearInterval(recognitionInterval.value)
    recognitionInterval.value = null
  }

  isCameraOpen.value = false
  loading.value = false
  faceStatus.value = 'none'
}

async function captureAndRecognize() {
  if (loading.value || !video.value) return

  attempts.value++
  loading.value = true
  error.value = ''

  try {
    const canvas = document.createElement('canvas')
    canvas.width = video.value.videoWidth
    canvas.height = video.value.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video.value, 0, 0, canvas.width, canvas.height)

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.8))

    const formData = new FormData()
    formData.append('file', blob, 'capture.jpg')

    const response = await axios.post('http://localhost:5000/recognize', formData, {
      //const response = await axios.post('https://lpn3.crabdance.com/api/face/recognize', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token.value}`,
      },
    })
    console.log('Respuesta del servidor:', response.data)

    // Guardamos el resultado
    result.value = {
      ...response.data.data,
      status: response.data.status,
      message: response.data.message,
    }

    console.log('Resultado de reconocimiento:', result.value)

    if (response.data.status === 'success') {
      faceStatus.value = 'found'
      stopRecognition()
    } else if (response.data.status === 'not_found') {
      faceStatus.value = 'searching'
    } else {
      faceStatus.value = 'error'
      error.value = response.data.message || 'Error desconocido'
    }
  } catch (err) {
    faceStatus.value = 'error'
    error.value = err.response?.data?.message || 'Error al comunicarse con el servidor'
  } finally {
    loading.value = false
  }
}

const raspberryId = ref('raspi-1')

async function sendTestCommand(topic, message) {
  if (!raspberryId.value) {
    error.value = 'Debe ingresar un ID de Raspberry'
    return
  }

  try {
    const payload = {
      raspberry: raspberryId.value,
      topic,
      message,
    }
    
    const response = await axios.post('localhost:5002/command', payload, {
    //const response = await axios.post('https://lpn2.crabdance.com/mqtt/command', payload, {
      headers: {
        Authorization: `Bearer ${token.value}`,
      },
    })

    console.log('Comando MQTT enviado:', response.data)
    alert(`Comando publicado correctamente en ${payload.raspberry}${topic}`)
  } catch (err) {
    console.error('Error enviando comando:', err)
    error.value = err.response?.data?.error || 'Error enviando comando MQTT'
  }
}
</script> -->

<style scoped>
.test-commands {
  margin-top: 2rem;
}

.test-commands input {
  margin-bottom: 1rem;
  padding: 0.5rem;
}

.btn-row button {
  margin: 0.3rem;
  padding: 0.5rem 1rem;
}

.recognize-container {
  max-width: 600px;
  margin: 0 auto;
  text-align: center;
  font-family: 'Segoe UI', sans-serif;
  position: relative;
  padding: 20px;
}

.camera-wrapper {
  position: relative;
  display: inline-block;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
}

.camera-feed {
  width: 100%;
  max-width: 500px;
  border-radius: 12px;
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.scanner-line {
  position: absolute;
  left: 10%;
  width: 80%;
  height: 2px;
  background: rgba(0, 255, 0, 0.8);
  animation: scan 2.5s infinite ease-in-out;
}

.scanner-line.found {
  background: #4caf50;
  animation: none;
}

.scanner-line.error {
  background: red;
  animation: none;
}

@keyframes scan {
  0% {
    top: 10%;
  }
  50% {
    top: 90%;
  }
  100% {
    top: 10%;
  }
}

.controls {
  margin: 10px 0;
}

button {
  margin: 10px;
  padding: 10px 20px;
  background-color: #2196f3;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.3s;
}

button:hover {
  background-color: #1976d2;
}

.cancel-btn {
  background-color: #f44336;
}

.cancel-btn:hover {
  background-color: #d32f2f;
}

.error {
  margin-top: 10px;
  color: red;
  font-weight: bold;
}

.attempts {
  margin-top: 10px;
  color: #aaa;
}

.result {
  margin-top: 20px;
  background: #f3f3f3;
  padding: 15px;
  border-radius: 10px;
  text-align: left;
  color: #111; /* ✅ Texto oscuro para mejor contraste */
}
</style>
