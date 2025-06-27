<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
      <div class="px-4 py-5 sm:p-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              Gestión de Perfiles Biométricos
            </h1>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Administra los perfiles biométricos de los usuarios del sistema
            </p>
          </div>
          <div class="flex items-center space-x-3">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
              <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-1a2 2 0 00-2-2H6a2 2 0 00-2 2v1a2 2 0 002 2zM12 7a4 4 0 100 8 4 4 0 000-8z" />
              </svg>
              Solo Administradores
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Upload Form -->
    <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
      <div class="px-4 py-5 sm:p-6">
        <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-6">
          Registrar Nuevo Perfil Biométrico
        </h2>

        <form @submit.prevent="submitForm" class="space-y-6">
          <!-- User Selection -->
          <div>
            <label for="user-select" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Seleccionar Usuario
            </label>
            <div class="mt-1 relative">
              <select
                id="user-select"
                v-model="selectedUserId"
                :disabled="isLoading || usersLoading"
                class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                :class="{
                  'border-green-300 focus:ring-green-500 focus:border-green-500': selectedUserId
                }"
              >
                <option value="">{{ usersLoading ? 'Cargando usuarios...' : 'Seleccione un usuario' }}</option>
                <option
                  v-for="userOption in usersForSelect"
                  :key="userOption.value"
                  :value="userOption.value"
                >
                  {{ userOption.label }}
                </option>
              </select>
              
              <!-- Refresh button -->
              <button
                type="button"
                @click="refreshUsers"
                :disabled="usersLoading"
                class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                title="Actualizar lista de usuarios"
              >
                <svg 
                  :class="['h-5 w-5', { 'animate-spin': usersLoading }]" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
            
            <!-- Selected user info -->
            <div v-if="selectedUser" class="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
              <div class="flex items-center space-x-2 text-sm">
                <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span class="text-white text-xs font-medium">{{ selectedUser.username.charAt(0).toUpperCase() }}</span>
                </div>
                <div>
                  <p class="font-medium text-blue-900 dark:text-blue-200">{{ selectedUser.username }}</p>
                  <p class="text-blue-700 dark:text-blue-300 text-xs">
                    {{ selectedUser.firstName || selectedUser.lastName ? `${[selectedUser.firstName, selectedUser.lastName].filter(Boolean).join(' ')}` : '' }}
                    {{ selectedUser.email ? `• ${selectedUser.email}` : '' }}
                  </p>
                  <p class="text-blue-600 dark:text-blue-400 text-xs font-mono">UUID: {{ selectedUser.id }}</p>
                </div>
              </div>
            </div>
            
            <!-- Users loading error -->
            <p v-if="usersError" class="mt-2 text-sm text-red-600 dark:text-red-400">
              {{ usersError }}
              <button @click="refreshUsers" class="ml-2 underline hover:no-underline">
                Reintentar
              </button>
            </p>
          </div>

          <!-- File Upload -->
          <div>
            <label for="image-upload" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Imágenes Biométricas
            </label>
            <div class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
              <div class="space-y-1 text-center">
                <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <div class="flex text-sm text-gray-600 dark:text-gray-400">
                  <label for="image-upload" class="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                    <span>Subir archivos</span>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      multiple
                      @change="handleFileChange"
                      :disabled="isLoading"
                      class="sr-only"
                    />
                  </label>
                  <p class="pl-1">o arrastra y suelta</p>
                </div>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  PNG, JPG, JPEG hasta 10MB cada una
                </p>
              </div>
            </div>
          </div>

          <!-- Image Previews -->
          <div v-if="uploads.length > 0" class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <div
              v-for="(upload, index) in uploads"
              :key="index"
              class="relative group"
            >
              <div
                class="aspect-square w-full overflow-hidden rounded-lg border-2 transition-colors"
                :class="{
                  'border-gray-200 dark:border-gray-700': upload.status === 'pending',
                  'border-yellow-300 dark:border-yellow-600': upload.status === 'uploading',
                  'border-green-300 dark:border-green-600': upload.status === 'success',
                  'border-red-300 dark:border-red-600': upload.status === 'error'
                }"
              >
                <img
                  :src="upload.preview"
                  :alt="upload.name"
                  class="h-full w-full object-cover"
                />
                
                <!-- Status Overlay -->
                <div class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div class="text-center text-white">
                    <div v-if="upload.status === 'pending'" class="text-sm">Pendiente</div>
                    <div v-else-if="upload.status === 'uploading'" class="text-sm">
                      <svg class="animate-spin h-5 w-5 mx-auto mb-1" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Subiendo...
                    </div>
                    <div v-else-if="upload.status === 'success'" class="text-sm">
                      <svg class="h-5 w-5 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Exitoso
                    </div>
                    <div v-else-if="upload.status === 'error'" class="text-sm">
                      <svg class="h-5 w-5 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Error
                    </div>
                  </div>
                </div>
              </div>
              
              <p class="mt-2 text-xs text-gray-500 dark:text-gray-400 truncate">
                {{ upload.name }}
              </p>
              
              <p v-if="upload.status === 'error'" class="mt-1 text-xs text-red-600 dark:text-red-400">
                {{ upload.message }}
              </p>
            </div>
          </div>

          <!-- Submit Button -->
          <div class="flex justify-end">
            <button
              type="submit"
              :disabled="!isFormValid || isLoading"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg v-if="isLoading" class="animate-spin -ml-1 mr-3 h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ isLoading ? 'Procesando...' : 'Registrar Perfiles' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Success/Error Messages -->
    <div v-if="successMessage" class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm font-medium text-green-800 dark:text-green-200">
            {{ successMessage }}
          </p>
        </div>
      </div>
    </div>

    <div v-if="errorMessage" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm font-medium text-red-800 dark:text-red-200">
            {{ errorMessage }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useKeycloakUsers } from '@/composables/useKeycloakUsers'

const { token } = useAuth()
const { 
  usersForSelect, 
  loading: usersLoading, 
  error: usersError, 
  fetchUsers, 
  refreshUsers,
  getUserById 
} = useKeycloakUsers()

const selectedUserId = ref('')
const selectedFiles = ref([])
const isLoading = ref(false)
const uploads = ref([])
const successMessage = ref('')
const errorMessage = ref('')

// Computed para obtener el usuario seleccionado
const selectedUser = computed(() => {
  return selectedUserId.value ? getUserById(selectedUserId.value) : null
})

const isFormValid = computed(() => {
  return selectedUserId.value && selectedFiles.value.length > 0
})

// Cargar usuarios al montar el componente
onMounted(() => {
  fetchUsers()
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
  
  successMessage.value = ''
  errorMessage.value = ''
}

const submitForm = async () => {
  if (!isFormValid.value) return

  isLoading.value = true
  successMessage.value = ''
  errorMessage.value = ''

  let successCount = 0
  let errorCount = 0

  for (const upload of uploads.value) {
    upload.status = 'uploading'
    upload.message = ''

    const formData = new FormData()
    formData.append('file', upload.file)
    formData.append('user_id', selectedUserId.value) // Usar selectedUserId en lugar de userId

    try {
      const response = await fetch('https://lpn3.crabdance.com/api/profile/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token.value}`,
        },
        body: formData
      })

      const data = await response.json()

      if (response.ok && data.status === 'success') {
        upload.status = 'success'
        successCount++
      } else {
        upload.status = 'error'
        upload.message = data.message || 'Error en el registro'
        errorCount++
      }
    } catch (error) {
      upload.status = 'error'
      upload.message = 'Error al conectar con el servidor'
      errorCount++
      console.error('Error uploading image:', error)
    }
  }

  if (successCount > 0) {
    const userName = selectedUser.value?.username || 'usuario'
    successMessage.value = `${successCount} imagen(es) registrada(s) correctamente para ${userName}`
  }
  
  if (errorCount > 0) {
    errorMessage.value = `${errorCount} imagen(es) fallaron al registrarse`
  }

  isLoading.value = false

  if (errorCount === 0) {
    setTimeout(() => {
      selectedUserId.value = ''
      selectedFiles.value = []
      uploads.value = []
      successMessage.value = ''
    }, 3000)
  }
}
</script> 