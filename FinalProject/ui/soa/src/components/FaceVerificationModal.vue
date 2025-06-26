<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">
          Verificación Facial Requerida
        </h3>
        <button
          @click="closeModal"
          class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="text-center">
        <p class="text-gray-600 dark:text-gray-300 mb-4">
          Para ejecutar comandos críticos, necesitas verificar tu identidad mediante reconocimiento facial.
        </p>

        <div v-if="!isCameraOpen" class="space-y-4">
          <button
            @click="startRecognition"
            class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Iniciar Verificación
          </button>
        </div>

        <div v-else class="space-y-4">
          <div class="relative">
            <video
              ref="video"
              autoplay
              playsinline
              class="w-full max-w-xs mx-auto rounded-lg border-2 border-gray-200 dark:border-gray-600"
            />
            
            <div class="absolute inset-0 flex items-center justify-center">
              <!-- Scanner line overlay -->
              <div class="absolute inset-2 border-2 border-transparent">
                <div
                  class="scanner-line"
                  :class="{
                    'bg-green-400': faceStatus === 'found',
                    'bg-red-400': faceStatus === 'error',
                    'bg-blue-400': faceStatus === 'searching'
                  }"
                />
              </div>
            </div>
          </div>

          <button
            @click="stopRecognition"
            class="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Cancelar
          </button>
        </div>

        <div v-if="loading" class="mt-4 text-blue-600 dark:text-blue-400">
          Procesando imagen...
        </div>

        <div v-if="error" class="mt-4 text-red-600 dark:text-red-400">
          {{ error }}
        </div>

        <div v-if="attempts > 0" class="mt-2 text-gray-500 text-sm">
          Intentos: {{ attempts }}/{{ maxAttempts }}
        </div>

        <div v-if="result && result.status === 'success'" class="mt-4 p-3 bg-green-100 dark:bg-green-900 rounded-lg">
          <p class="text-green-800 dark:text-green-200 font-medium">
            ✓ Verificación exitosa
          </p>
          <p class="text-green-600 dark:text-green-400 text-sm mt-1">
            {{ result.user_name || result.label }}
          </p>
          <button
            @click="closeModal"
            class="mt-3 w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useFaceVerification } from '@/composables/useFaceVerification'

defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'verified'): void
}>()

const {
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
} = useFaceVerification()

const closeModal = () => {
  stopRecognition()
  emit('close')
}

// Watch for successful verification
import { watch } from 'vue'
watch(() => result.value, (newResult) => {
  if (newResult && newResult.status === 'success') {
    setTimeout(() => {
      emit('verified')
      closeModal()
    }, 2000) // Wait 2 seconds to show success message
  }
})
</script>

<style scoped>
.scanner-line {
  position: absolute;
  left: 10%;
  width: 80%;
  height: 2px;
  animation: scan 2.5s infinite ease-in-out;
}

.scanner-line:not(.bg-green-400):not(.bg-red-400) {
  animation: scan 2.5s infinite ease-in-out;
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
</style> 