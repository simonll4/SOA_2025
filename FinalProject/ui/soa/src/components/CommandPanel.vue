<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useServiceCommands } from '@/composables/services/useServiceCommands'
import FaceVerificationModal from './FaceVerificationModal.vue'

const props = defineProps<{ raspberryId: string }>()

const {
  executeCommand: execCmd,
  executeCriticalCommand,
  isExecuting,
  commandHistory,
} = useServiceCommands()

// Face verification modal state
const showFaceVerificationModal = ref(false)
const pendingCriticalCommand = ref<any>(null)

// LED State
const ledState = ref(false)

// Servo State
const servoAngle = ref(90)

// RGB State
const selectedColor = ref('#ff0000')
const rgbValues = ref({ r: 255, g: 0, b: 0 })
const colorPicker = ref<HTMLInputElement>()

// Color presets
const colorPresets = {
  Rojo: '#ff0000',
  Verde: '#00ff00',
  Azul: '#0000ff',
  Amarillo: '#ffff00',
  Magenta: '#ff00ff',
  Cian: '#00ffff',
  Blanco: '#ffffff',
  Apagado: '#000000',
}

// Critical commands
const criticalCommands = ref([
  {
    id: 'pump-start-f',
    label: 'Iniciar Bomba F',
    description: 'Activar bomba de fluido F',
    topic: '/startf',
  },
  {
    id: 'pump-stop-f',
    label: 'Detener Bomba F',
    description: 'Desactivar bomba de fluido F',
    topic: '/stopf',
  },
  {
    id: 'pump-start-d',
    label: 'Iniciar Bomba D',
    description: 'Activar bomba de fluido D',
    topic: '/startd',
  },
  {
    id: 'pump-stop-d',
    label: 'Detener Bomba D',
    description: 'Desactivar bomba de fluido D',
    topic: '/stopd',
  },
])

// Methods
const toggleLED = async () => {
  const currentState = ledState.value
  const newState = !currentState
  const message = newState ? 'on' : 'off'

  console.log(`LED Toggle: ${currentState} -> ${newState}, sending: ${message}`)

  try {
    await execCmd('/led', message, props.raspberryId)
    // Solo actualizar el estado si el comando fue exitoso
    ledState.value = newState
    console.log(`LED state updated to: ${ledState.value}`)
  } catch (error) {
    console.error('Error toggling LED:', error)
    // No cambiar el estado si hubo error
  }
}

const updateServoAngle = async () => {
  try {
    await execCmd('/moveservo', servoAngle.value.toString(), props.raspberryId)
  } catch (error) {
    console.error('Error moving servo:', error)
  }
}

const setServoAngle = (angle: number) => {
  servoAngle.value = angle
  updateServoAngle()
}

const getServoArcPath = () => {
  const centerX = 100
  const centerY = 100
  const radius = 80

  // Punto de inicio fijo (siempre en la izquierda del semicírculo)
  const startX = centerX + radius * Math.cos(Math.PI) // cos(π) = -1
  const startY = centerY - radius * Math.sin(Math.PI) // sin(π) = 0, pero usamos - para ir hacia arriba

  // Mapear servo angle (0-180°) a ángulos del semicírculo superior
  // 0° servo = izquierda (π rad), 180° servo = derecha (0 rad)
  const endAngleRad = Math.PI - (servoAngle.value * Math.PI) / 180
  const endX = centerX + radius * Math.cos(endAngleRad)
  const endY = centerY - radius * Math.sin(endAngleRad) // CLAVE: usar - para que vaya hacia arriba

  // Determinar si necesitamos el arco largo
  const largeArcFlag = 0 // Siempre usar el arco corto para el semicírculo
  
  // Sweep flag = 1 para ir en sentido horario por el semicírculo superior
  const sweepFlag = 1

  return `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${endX} ${endY}`
}

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 }
}

const updateRGBColor = async () => {
  rgbValues.value = hexToRgb(selectedColor.value)
  const message = `${rgbValues.value.r} ${rgbValues.value.g} ${rgbValues.value.b}`

  try {
    await execCmd('/rgb', message, props.raspberryId)
  } catch (error) {
    console.error('Error updating RGB:', error)
  }
}

const setPresetColor = (color: string) => {
  selectedColor.value = color
  updateRGBColor()
}

const handleCriticalCommand = async (command: any) => {
  // Siempre solicitar verificación biométrica para comandos críticos
  pendingCriticalCommand.value = command
  showFaceVerificationModal.value = true
}

const onFaceVerified = async () => {
  if (pendingCriticalCommand.value) {
    try {
      await executeCriticalCommand(pendingCriticalCommand.value.topic, props.raspberryId)
      pendingCriticalCommand.value = null
    } catch (error) {
      console.error('Error executing pending critical command:', error)
    }
  }
}

// Initialize RGB values on mount
onMounted(() => {
  rgbValues.value = hexToRgb(selectedColor.value)
})
</script>

<template>
  <div class="space-y-4 sm:space-y-6">
    <!-- Face Verification Modal -->
    <FaceVerificationModal
      :is-open="showFaceVerificationModal"
      @close="showFaceVerificationModal = false"
      @verified="onFaceVerified"
    />
    <!-- Device Info -->
    <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4">
      <h3 class="text-xs sm:text-sm font-medium text-gray-900 dark:text-white mb-2">
        Dispositivo Seleccionado
      </h3>
      <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-300">{{ raspberryId }}</p>
    </div>

    <!-- Common Commands -->
    <div>
      <h3 class="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center">
        <svg
          class="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-green-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M5 13l4 4L19 7"
          />
        </svg>
        Comandos Comunes
      </h3>

      <div class="space-y-4 sm:space-y-6">
        <!-- LED Toggle Button -->
        <div class="flex flex-col items-center space-y-2 sm:space-y-3">
          <h4 class="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Control LED</h4>
          <button
            @click="toggleLED"
            :disabled="isExecuting"
            :class="[
              'relative inline-flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full transition-all duration-500 shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed',
              ledState
                ? 'bg-gradient-to-r from-yellow-300 via-yellow-400 to-orange-400 shadow-yellow-400/60 ring-4 ring-yellow-200/50'
                : 'bg-gradient-to-r from-slate-400 to-slate-600 shadow-slate-400/30',
            ]"
          >
            <svg
              class="w-6 h-6 sm:w-8 sm:h-8 transition-all duration-300"
              :class="ledState ? 'text-white drop-shadow-lg' : 'text-slate-200'"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
            <!-- Glow effect when LED is on -->
            <div
              v-if="ledState"
              class="absolute inset-0 rounded-full bg-yellow-300 opacity-30 animate-pulse"
            ></div>
            <!-- Inner bright core when LED is on -->
            <div v-if="ledState" class="absolute inset-2 rounded-full bg-white opacity-20"></div>
          </button>
          <span
            class="text-xs sm:text-sm font-medium transition-all duration-300"
            :class="
              ledState
                ? 'text-yellow-600 dark:text-yellow-400 font-bold'
                : 'text-gray-500 dark:text-gray-400'
            "
          >
            LED {{ ledState ? 'ENCENDIDO' : 'APAGADO' }}
          </span>
        </div>

        <!-- Servo Control with Circular Gauge -->
        <div class="flex flex-col items-center space-y-3 sm:space-y-4">
          <h4 class="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Control Servo</h4>
          <div class="relative">
            <!-- Circular gauge background -->
            <svg width="160" height="96" viewBox="0 0 200 120" class="overflow-visible sm:w-[200px] sm:h-[120px]">
              <!-- Background arc (semicírculo completo) -->
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="#e5e7eb"
                stroke-width="8"
                class="dark:stroke-gray-600"
              />
              <!-- Progress arc (se actualiza dinámicamente) -->
              <path
                :d="getServoArcPath()"
                fill="none"
                stroke="url(#servoGradient)"
                stroke-width="8"
                stroke-linecap="round"
              />
              <!-- Gradient definition -->
              <defs>
                <linearGradient id="servoGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style="stop-color: #3b82f6; stop-opacity: 1" />
                  <stop offset="50%" style="stop-color: #8b5cf6; stop-opacity: 1" />
                  <stop offset="100%" style="stop-color: #ef4444; stop-opacity: 1" />
                </linearGradient>
              </defs>
              <!-- Angle indicators -->
              <text x="20" y="115" text-anchor="middle" class="fill-gray-500 text-xs font-medium">
                0°
              </text>
              <text x="100" y="25" text-anchor="middle" class="fill-gray-500 text-xs font-medium">
                90°
              </text>
              <text x="180" y="115" text-anchor="middle" class="fill-gray-500 text-xs font-medium">
                180°
              </text>
            </svg>

            <!-- Servo angle input -->
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="text-center">
                <div class="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {{ servoAngle }}°
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Servo</div>
              </div>
            </div>
          </div>

          <!-- Slider for servo control -->
          <div class="w-full max-w-xs">
            <input
              type="range"
              min="0"
              max="180"
              v-model="servoAngle"
              @change="updateServoAngle"
              @mouseup="updateServoAngle"
              @touchend="updateServoAngle"
              :disabled="isExecuting"
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 slider"
            />
            <div class="flex justify-between text-xs text-gray-500 mt-1">
              <span>00</span>
              <span>90°</span>
              <span>180°</span>
            </div>
          </div>

          <!-- Quick angle buttons -->
          <div class="flex flex-wrap justify-center gap-1 sm:gap-2">
            <button
              v-for="angle in [0, 45, 90, 135, 180]"
              :key="angle"
              @click="setServoAngle(angle)"
              :disabled="isExecuting"
              class="px-2 sm:px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              {{ angle }}°
            </button>
          </div>
        </div>

        <!-- RGB Color Picker -->
        <div class="flex flex-col items-center space-y-3 sm:space-y-4">
          <h4 class="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Control RGB</h4>

          <!-- Color preview circle -->
          <div class="relative">
            <div
              class="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-white shadow-lg cursor-pointer transform hover:scale-105 transition-transform"
              :style="{ backgroundColor: selectedColor }"
              @click="colorPicker?.click()"
            >
              <div
                class="absolute inset-0 rounded-full bg-gradient-to-br from-transparent via-transparent to-black opacity-10"
              ></div>
            </div>
            <!-- Hidden color input -->
            <input
              ref="colorPicker"
              type="color"
              v-model="selectedColor"
              @change="updateRGBColor"
              class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              :disabled="isExecuting"
            />
          </div>

          <!-- RGB values display -->
          <div class="flex space-x-3 sm:space-x-4 text-xs sm:text-sm">
            <div class="text-center">
              <div class="font-medium text-red-500">R</div>
              <div class="text-gray-700 dark:text-gray-300">{{ rgbValues.r }}</div>
            </div>
            <div class="text-center">
              <div class="font-medium text-green-500">G</div>
              <div class="text-gray-700 dark:text-gray-300">{{ rgbValues.g }}</div>
            </div>
            <div class="text-center">
              <div class="font-medium text-blue-500">B</div>
              <div class="text-gray-700 dark:text-gray-300">{{ rgbValues.b }}</div>
            </div>
          </div>

          <!-- Quick color presets -->
          <div class="flex flex-wrap justify-center gap-1 sm:gap-2">
            <button
              v-for="(color, name) in colorPresets"
              :key="name"
              @click="setPresetColor(color)"
              :disabled="isExecuting"
              class="w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 border-white shadow-md hover:scale-110 transition-transform"
              :style="{ backgroundColor: color }"
              :title="name"
            ></button>
          </div>
        </div>
      </div>
    </div>

    <!-- Critical Commands -->
    <div>
      <h3 class="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center">
        <svg
          class="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-red-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
        Comandos Críticos
      </h3>

      <div class="grid grid-cols-1 gap-2 sm:gap-3">
        <button
          v-for="command in criticalCommands"
          :key="command.id"
          @click="handleCriticalCommand(command)"
          :disabled="isExecuting"
          class="flex items-center justify-between p-3 sm:p-4 border-2 border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <div class="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
            <svg
              class="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
            <div class="text-left min-w-0 flex-1">
              <div class="font-medium text-gray-900 dark:text-white text-sm sm:text-base truncate">{{ command.label }}</div>
              <div class="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">{{ command.description }}</div>
            </div>
          </div>
          <div class="flex items-center space-x-1 sm:space-x-2 text-red-600 dark:text-red-400 flex-shrink-0">
            <svg class="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
            <span class="text-xs font-medium hidden sm:inline">Requiere verificación</span>
            <span class="text-xs font-medium sm:hidden">Verificar</span>
          </div>
        </button>
      </div>
    </div>

    <!-- Command History -->
    <div v-if="commandHistory.length > 0">
      <h3 class="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-3 sm:mb-4">Historial de Comandos</h3>

      <div class="space-y-2 max-h-32 sm:max-h-40 overflow-y-auto">
        <div
          v-for="(historyItem, index) in commandHistory.slice(-5)"
          :key="index"
          class="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded text-xs sm:text-sm"
        >
          <span class="text-gray-900 dark:text-white truncate flex-1 mr-2">{{ historyItem.command }}</span>
          <span
            :class="[
              'px-2 py-1 rounded text-xs flex-shrink-0',
              historyItem.status === 'success'
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
            ]"
          >
            {{ historyItem.status === 'success' ? 'Exitoso' : 'Error' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Custom slider styling */
.slider::-webkit-slider-thumb {
  appearance: none;
  height: 20px;
  width: 20px;
  border-radius: 50%;
  background: linear-gradient(45deg, #3b82f6, #8b5cf6);
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.slider::-moz-range-thumb {
  height: 20px;
  width: 20px;
  border-radius: 50%;
  background: linear-gradient(45deg, #3b82f6, #8b5cf6);
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.slider::-webkit-slider-track {
  height: 8px;
  border-radius: 4px;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6, #ef4444);
}

.slider::-moz-range-track {
  height: 8px;
  border-radius: 4px;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6, #ef4444);
  border: none;
}
</style>
