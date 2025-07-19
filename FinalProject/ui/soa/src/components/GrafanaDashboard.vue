<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { GRAFANA_CONFIG } from '@/config/grafana'
import { useKeycloakAuth } from '@/composables/keycloak/useKeycloakAuth'

const { token } = useKeycloakAuth()

const loading = ref(true)
const error = ref<string | null>(null)

const props = defineProps<{ deviceId?: string }>()

const dashboardUrl = computed(() => {
  const { baseUrl, dashboardUid, dashboardSlug, containerId, refreshInterval, timeRange } =
    GRAFANA_CONFIG
  if (!token.value) return ''
  const params = new URLSearchParams({
    orgId: '1',
    from: timeRange.from,
    to: timeRange.to,
    timezone: 'browser',
    theme: 'dark',
    kiosk: '1',
    refresh: refreshInterval,
    'var-raspberry_id': props.deviceId || '',
    'var-container_id': containerId,
    auth_token: token.value,
  })

  return `${baseUrl}/d/${dashboardUid}/${dashboardSlug}?${params.toString()}`
})

// Flag para mostrar iframe sólo cuando exista token
const authReady = computed(() => !!token.value)

// Cuando esté montado y el token listo, simplemente bajamos el "loading"
onMounted(() => {
  if (token.value) {
    loading.value = false
  } else {
    const stop = watch(
      () => token.value,
      (val) => {
        if (val) {
          stop()
          loading.value = false
        }
      },
    )
  }
})
</script>

<template>
  <div class="grafana-dashboard">
    <div v-if="loading" class="loading">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <p>Cargando dashboard...</p>
      </div>
    </div>
    <div v-else-if="error" class="error">
      <div class="error-content">
        <svg class="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
        <p>{{ error }}</p>
      </div>
    </div>
    <div v-else class="dashboard-container">
      <iframe
        v-if="authReady"
        :src="dashboardUrl"
        class="grafana-iframe"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation allow-modals"
        allowfullscreen
        scrolling="auto"
        frameborder="0"
        marginheight="0"
        marginwidth="0"
      ></iframe>
    </div>
  </div>
</template>

<style scoped>
.grafana-dashboard {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: calc(100vh - 160px);
  background-color: #0b1426;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.dashboard-container {
  width: 100%;
  height: 100%;
  min-height: inherit;
  background: transparent;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.loading,
.error {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  min-height: 500px;
  font-size: 1.2em;
  flex: 1;
}

.loading-content,
.error-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  text-align: center;
  color: #e5e7eb;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #374151;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error {
  color: #ef4444;
}

.error-icon {
  width: 48px;
  height: 48px;
  color: #ef4444;
}

.grafana-iframe {
  width: 100%;
  height: 100%;
  min-height: calc(100vh - 160px);
  border: none;
  outline: none;
  background: #0b1426;
  display: block;
  margin: 0;
  padding: 0;
  overflow: hidden;
  flex: 1;
}

/* Responsive design para móviles */
@media (max-width: 768px) {
  .grafana-dashboard {
    min-height: calc(100vh - 200px);
  }
  
  .grafana-iframe {
    min-height: calc(100vh - 200px);
    /* Permitir scroll en móviles para mejor experiencia */
    overflow: auto;
    -webkit-overflow-scrolling: touch;
  }
  
  .loading,
  .error {
    min-height: 300px;
    font-size: 1em;
  }
  
  .loading-content,
  .error-content {
    padding: 1rem;
  }
  
  .loading-spinner {
    width: 32px;
    height: 32px;
  }
  
  .error-icon {
    width: 40px;
    height: 40px;
  }
}

/* Responsive design para tablets y pantallas medianas */
@media (min-width: 769px) and (max-width: 1024px) {
  .grafana-dashboard {
    min-height: calc(100vh - 180px);
  }
  
  .grafana-iframe {
    min-height: calc(100vh - 180px);
  }
  
  .loading,
  .error {
    min-height: 400px;
    font-size: 1.1em;
  }
  
  .loading-spinner {
    width: 36px;
    height: 36px;
  }
  
  .error-icon {
    width: 44px;
    height: 44px;
  }
}

/* Responsive design para pantallas medianas específicas */
@media (min-width: 640px) and (max-width: 768px) {
  .grafana-dashboard {
    min-height: calc(100vh - 190px);
  }
  
  .grafana-iframe {
    min-height: calc(100vh - 190px);
  }
}

/* Asegurar que el iframe se adapte correctamente en pantallas pequeñas */
@media (max-width: 480px) {
  .grafana-iframe {
    /* Forzar el ancho completo y permitir zoom para mejor legibilidad */
    width: 100vw;
    height: calc(100vh - 200px);
    min-height: 400px;
    transform: scale(1);
    transform-origin: top left;
  }
}
</style>