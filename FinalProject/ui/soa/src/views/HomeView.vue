<!-- <template>
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
      <p v-if="result.similarity"><strong>Similitud:</strong> {{ result.similarity }}</p>
      <p v-if="result.confidence"><strong>Confianza:</strong> {{ result.confidence }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import axios from 'axios'

const video = ref(null)
const isCameraOpen = ref(false)
const loading = ref(false)
const error = ref('')
const result = ref(null)
const attempts = ref(0)
const maxAttempts = ref(5)
const recognitionInterval = ref(null)
const stream = ref(null)
const faceStatus = ref('searching') // 'searching', 'found', 'error', 'none'

async function startRecognition() {
  error.value = ''
  result.value = null
  attempts.value = 0
  faceStatus.value = 'searching'

  try {
    stream.value = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'user',
        width: { ideal: 640 },
        height: { ideal: 480 },
      },
      audio: false,
    })

    isCameraOpen.value = true
    await nextTick()

    if (!video.value) throw new Error('No se encontró el elemento de video')
    video.value.srcObject = stream.value

    recognitionInterval.value = setInterval(async () => {
      if (attempts.value >= maxAttempts.value) {
        stopRecognition()
        faceStatus.value = 'error'
        error.value = 'No se pudo reconocer el rostro después de varios intentos'
        return
      }

      await captureAndRecognize()
    }, 1000)
  } catch (err) {
    error.value = `Error al acceder a la cámara: ${err.message}`
    console.error(err)
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

  attempts.value += 1
  loading.value = true

  try {
    const canvas = document.createElement('canvas')
    canvas.width = video.value.videoWidth
    canvas.height = video.value.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video.value, 0, 0, canvas.width, canvas.height)

    const blob = await new Promise((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', 0.8)
    })

    const formData = new FormData()
    formData.append('file', blob, 'capture.jpg')

    const response = await axios.post('http://localhost:5000/recognize', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })

    result.value = response.data

    if (response.data.status === 'ok') {
      faceStatus.value = 'found'
      stopRecognition()
    } else {
      faceStatus.value = 'searching'
    }
  } catch (err) {
    faceStatus.value = 'error'
    if (err.response?.data?.detail) {
      error.value = err.response.data.detail
    } else {
      error.value = 'Error al comunicarse con el servidor'
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
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
</style> -->
<template>
  <div class="upload-container">
    <h2>Subir Imagen para Verificación Facial</h2>

    <input type="file" accept="image/*" @change="handleFileChange" />

    <button :disabled="!selectedFile || loading" @click="submitImage">
      {{ loading ? 'Procesando...' : 'Verificar' }}
    </button>

    <div v-if="error" class="error">{{ error }}</div>

    <div v-if="result" class="result">
      <p><strong>Estado:</strong> {{ result.status }}</p>
      <p><strong>Etiqueta:</strong> {{ result.label }}</p>
      <p v-if="result.user_id"><strong>User ID:</strong> {{ result.user_id }}</p>
      <p v-if="result.similarity"><strong>Similitud:</strong> {{ result.similarity }}</p>
      <p v-if="result.confidence"><strong>Confianza:</strong> {{ result.confidence }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'

const selectedFile = ref(null)
const loading = ref(false)
const error = ref('')
const result = ref(null)

function handleFileChange(event) {
  error.value = ''
  result.value = null
  selectedFile.value = event.target.files[0] || null
}

async function submitImage() {
  if (!selectedFile.value) return

  loading.value = true
  error.value = ''
  result.value = null

  const formData = new FormData()
  formData.append('file', selectedFile.value)

  try {
    const response = await axios.post('http://localhost:5000/recognize', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    result.value = response.data
  } catch (err) {
    error.value = err.response?.data?.detail || 'Error al comunicarse con el servidor'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.upload-container {
  max-width: 500px;
  margin: 2rem auto;
  padding: 20px;
  text-align: center;
  font-family: Arial, sans-serif;
}

button {
  margin-top: 1rem;
  padding: 10px 20px;
  font-size: 16px;
  background: #2196f3;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

button:disabled {
  background: #aaa;
  cursor: not-allowed;
}

.error {
  margin-top: 1rem;
  color: red;
  font-weight: bold;
}

.result {
  margin-top: 2rem;
  background: #f3f3f3;
  color: #111;
  padding: 15px;
  border-radius: 10px;
  text-align: left;
}
</style>



    <!-- <div class="container-id-input">
      <label for="containerId">Container ID:</label>
      <input
        id="containerId"
        v-model="containerId"
        type="text"
        placeholder="Ingrese el Container ID"
      />
    </div>

    <iframe
      :src="`https://lpn3.crabdance.com/d-solo/tank-monitoring-001/f09f8fad-tank-monitoring-dashboard?orgId=1&from=1750107445797&to=1750107745797&timezone=browser&var-container_id=${String(containerId)}&var-height=20&refresh=5s&panelId=3&__feature.dashboardSceneSolo`"
      width="450"
      height="200"
      frameborder="0"
    ></iframe>-->
