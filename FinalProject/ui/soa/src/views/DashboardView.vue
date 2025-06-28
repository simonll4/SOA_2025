<template>
  <div class="dashboard-wrapper">
    <GrafanaDashboard />
  </div>
</template>

<script setup lang="ts">
import GrafanaDashboard from '@/components/GrafanaDashboard.vue';
</script>

<style scoped>
.dashboard-wrapper {
  width: 100%;
  height: calc(100vh - 160px); /* Altura específica considerando el layout */
  min-height: 600px; /* Altura mínima para asegurar visibilidad */
}
</style> 