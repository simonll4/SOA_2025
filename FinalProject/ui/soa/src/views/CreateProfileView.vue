<template>
  <div class="upload-container">
    <h2>Registro Facial</h2>

    <div class="form-group">
      <label for="user-id">ID de Usuario (UUID)</label>
      <input
        id="user-id"
        type="text"
        v-model="userId"
        placeholder="Ingrese UUID"
        :disabled="isLoading"
      />
    </div>

    <div class="form-group">
      <label for="image-upload">Seleccionar Imágenes</label>
      <input
        id="image-upload"
        type="file"
        accept="image/*"
        multiple
        @change="handleFileChange"
        :disabled="isLoading"
      />
    </div>

    <div class="preview-list" v-if="uploads.length">
      <div
        v-for="(upload, index) in uploads"
        :key="index"
        class="preview-item"
        :class="upload.status"
      >
        <img :src="upload.preview" :alt="upload.name" />
        <div class="info">
          <p class="name">{{ upload.name }}</p>
          <p class="status">
            <span v-if="upload.status === 'pending'">⏳ Pendiente</span>
            <span v-if="upload.status === 'uploading'">🔄 Subiendo...</span>
            <span v-if="upload.status === 'success'">✅ Exitoso</span>
            <span v-if="upload.status === 'error'" style="color: black"
              >❌ {{ upload.message }}</span
            >
          </p>
        </div>
      </div>
    </div>

    <button @click="submitForm" :disabled="!isFormValid || isLoading" class="submit-button">
      <span v-if="isLoading"><i class="spinner"></i> Procesando...</span>
      <span v-else>Registrar Rostros</span>
    </button>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import axios from 'axios'
import { useAuth } from '@/composables/useAuth'

const userId = ref('')
const selectedFiles = ref([])
const isLoading = ref(false)
const uploads = ref([])

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const isFormValid = computed(() => {
  return UUID_REGEX.test(userId.value) && selectedFiles.value.length > 0
})

const handleFileChange = (event) => {
  const files = Array.from(event.target.files).filter((f) => f.type.startsWith('image/'))
  selectedFiles.value = files
  uploads.value = files.map((file) => ({
    name: file.name,
    file,
    status: 'pending',
    message: '',
    preview: URL.createObjectURL(file),
  }))
}

const { token } = useAuth()

const submitForm = async () => {
  if (!isFormValid.value) return

  isLoading.value = true

  for (const upload of uploads.value) {
    upload.status = 'uploading'
    upload.message = ''

    const formData = new FormData()
    formData.append('file', upload.file)
    formData.append('user_id', userId.value)

    try {
      // const response = await axios.post('https://lpn3.crabdance.com/api/profile/upload', formData, {
      //const response = await axios.post('http://localhost:5001/upload', formData, {
      const response = await axios.post('https://lpn3.crabdance.com/api/profile/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token.value}`,
        },
      })

      if (response.data.status === 'success') {
        upload.status = 'success'
      } else {
        upload.status = 'error'
        upload.message = response.data.message || 'Error en el registro'
      }
    } catch (error) {
      upload.status = 'error'
      console.log('Error al subir la imagen:', error)
      upload.message = error.response?.data?.message || 'Error al conectar con el servidor'
    }
  }

  isLoading.value = false
}
</script>

<style scoped>
.upload-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
  background: #1e1e1e;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.6);
  color: #f0f0f0;
}

h2 {
  text-align: center;
  margin-bottom: 1.5rem;
  color: #ffffff;
}

.form-group {
  margin-bottom: 1rem;
}

label {
  font-weight: 600;
  display: block;
  margin-bottom: 0.5rem;
  color: #d0d0d0;
}

input[type='text'],
input[type='file'] {
  width: 100%;
  padding: 0.5rem;
  background: #2c2c2c;
  color: #f0f0f0;
  border: 1px solid #444;
  border-radius: 6px;
  font-size: 1rem;
}

input[type='text']::placeholder {
  color: #888;
}

.preview-list {
  margin-top: 1rem;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 1rem;
}

.preview-item {
  border: 2px solid #555;
  border-radius: 6px;
  padding: 0.5rem;
  text-align: center;
  background: #2b2b2b;
  transition: border-color 0.3s;
}

.preview-item img {
  max-width: 100%;
  border-radius: 4px;
  height: 100px;
  object-fit: cover;
}

.preview-item .info {
  margin-top: 0.5rem;
}

.preview-item.pending {
  border-color: #999;
}

.preview-item.uploading {
  border-color: #fbc02d;
}

.preview-item.success {
  border-color: #4caf50;
}

.preview-item.error {
  border-color: #f44336;
}

.name {
  font-size: 0.9rem;
  font-weight: 600;
  color: #f0f0f0;
}

.status {
  font-size: 0.8rem;
  margin-top: 0.2rem;
  color: #ccc;
}

.submit-button {
  margin-top: 1.5rem;
  width: 100%;
  padding: 0.75rem;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s;
}

.submit-button:disabled {
  background-color: #555;
  color: #aaa;
  cursor: not-allowed;
}

.submit-button:hover:not(:disabled) {
  background-color: #43a047;
}

.spinner {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

<!-- <style scoped>
.upload-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

h2 {
  text-align: center;
  margin-bottom: 1.5rem;
  color: #333;
}

.form-group {
  margin-bottom: 1rem;
}

label {
  font-weight: bold;
  display: block;
  margin-bottom: 0.5rem;
}

input[type='number'],
input[type='file'] {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.preview-list {
  margin-top: 1rem;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 1rem;
}

.preview-item {
  border: 2px solid #ccc;
  border-radius: 6px;
  padding: 0.5rem;
  text-align: center;
  background: #fafafa;
  transition: border-color 0.3s;
}

.preview-item img {
  max-width: 100%;
  border-radius: 4px;
  height: 100px;
  object-fit: cover;
}

.preview-item .info {
  margin-top: 0.5rem;
}

.preview-item.pending {
  border-color: #999;
}

.preview-item.uploading {
  border-color: #fbc02d;
}

.preview-item.success {
  border-color: #4caf50;
}

.preview-item.error {
  border-color: #f44336;
}

.name {
  font-size: 0.9rem;
  font-weight: 600;
}

.status {
  font-size: 0.8rem;
  margin-top: 0.2rem;
}

.submit-button {
  margin-top: 1rem;
  width: 100%;
  padding: 0.75rem;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
}

.submit-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.submit-button:hover:not(:disabled) {
  background-color: #45a049;
}

.spinner {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style> -->
