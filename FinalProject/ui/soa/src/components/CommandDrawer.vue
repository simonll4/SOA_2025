<template>
  <div class="w-full">
    <h3 class="text-lg font-bold mb-2">Panel de Comandos</h3>

    <!-- Comandos NO críticos -->
    <div>
      <h4 class="text-md font-semibold mb-1 flex items-center gap-1">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        No Críticos
      </h4>
      <div class="flex flex-wrap gap-2 mb-4">
        <button class="btn btn-primary btn-sm" @click="emitCommand('led/on')">LED ON</button>
        <button class="btn btn-primary btn-sm" @click="emitCommand('led/off')">LED OFF</button>
        <button class="btn btn-primary btn-sm" @click="emitCommand('servo/90')">Servo 90º</button>
        <button class="btn btn-primary btn-sm" @click="emitCommand('rgb/red')">RGB Rojo</button>
      </div>
    </div>

    <!-- Comandos críticos -->
    <div>
      <h4 class="text-md font-semibold mb-1 flex items-center gap-1 text-warning">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m0-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
        </svg>
        Críticos
      </h4>
      <div class="flex flex-wrap gap-2">
        <button class="btn btn-error btn-sm" @click="emitCritical('pump/startf')">Iniciar Bomba F</button>
        <button class="btn btn-error btn-sm" @click="emitCritical('pump/stopf')">Detener Bomba F</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineEmits } from 'vue'

const emit = defineEmits(['command', 'critical'])

function emitCommand(cmd: string) {
  emit('command', cmd)
}

function emitCritical(cmd: string) {
  emit('critical', cmd)
}
</script> 