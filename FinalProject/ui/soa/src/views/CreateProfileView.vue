<template>
  <div class="upload-container">
    <h2>Registro Facial</h2>

    <div class="form-group">
      <label for="user-id">ID de Usuario</label>
      <input
        id="user-id"
        type="number"
        v-model.number="userId"
        placeholder="Ingrese ID numérico"
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
      <div v-for="(upload, index) in uploads" :key="index" class="preview-item" :class="upload.status">
        <img :src="upload.preview" :alt="upload.name" />
        <div class="info">
          <p class="name">{{ upload.name }}</p>
          <p class="status">
            <span v-if="upload.status === 'pending'">⏳ Pendiente</span>
            <span v-if="upload.status === 'uploading'">🔄 Subiendo...</span>
            <span v-if="upload.status === 'success'">✅ Exitoso</span>
            <span v-if="upload.status === 'error'">❌ {{ upload.message }}</span>
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

const userId = ref(null)
const selectedFiles = ref([])
const isLoading = ref(false)
const uploads = ref([])

const isFormValid = computed(() => {
  return userId.value && selectedFiles.value.length > 0
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
      const response = await axios.post('http://localhost:5000/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      if (response.data.status === 'success') {
        upload.status = 'success'
      } else {
        upload.status = 'error'
        upload.message = response.data.message || 'Error en el registro'
      }
    } catch (error) {
      upload.status = 'error'
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
</style>
