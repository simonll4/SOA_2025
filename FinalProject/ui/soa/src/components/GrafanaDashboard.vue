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
    <div v-if="loading" class="loading">Cargando dashboard...</div>
    <div v-else-if="error" class="error">
      {{ error }}
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
  overflow: auto;
}

.dashboard-container {
  width: 100%;
  height: 100%;
  min-height: inherit;
  background: transparent;
}

.loading,
.error {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  min-height: 500px;
  font-size: 1.2em;
}

.error {
  color: red;
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
}
</style>

<!-- <script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { GRAFANA_CONFIG } from '@/config/grafana'

import { useKeycloakAuth } from '@/composables/keycloak/useKeycloakAuth'

const { token } = useKeycloakAuth()

const loading = ref(true)
const error = ref<string | null>(null)

// Permitir dispositivo opcional para compatibilidad con MonitoringView
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
    theme: 'dark', // Forzamos tema oscuro
    kiosk: '1', // Modo kiosk "tv" muestra la cabecera con controles (variables / rango / refresh)
    refresh: refreshInterval,
    'var-container_id': containerId,
  })

  // Incluir el JWT de Keycloak para autenticar directamente en Grafana
  if (token.value) {
    params.set('auth_token', token.value)
  }

  return `${baseUrl}/d/${dashboardUid}/${dashboardSlug}?${params.toString()}`
})

// Flag para mostrar iframe sólo cuando exista URL válida (token listo)
const authReady = computed(() => !!token.value)

onMounted(async () => {
  // Esperamos a que el token esté disponible antes de hacer la petición de prueba
  if (!token.value) {
    const stop = watch(
      () => token.value,
      async (val) => {
        if (val) {
          stop()
          await checkDashboard()
        }
      },
    )
  } else {
    await checkDashboard()
  }
})

async function checkDashboard() {
  try {
    const response = await fetch(`/api/dashboards/uid/${GRAFANA_CONFIG.dashboardUid}`, {
      headers: {
        Authorization: `Bearer ${token.value}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('No se pudo acceder al dashboard')
    }

    loading.value = false
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Error al cargar el dashboard'
    loading.value = false
  }
}
</script>

<template>
  <div class="grafana-dashboard">
    <div v-if="loading" class="loading">Cargando dashboard...</div>
    <div v-else-if="error" class="error">
      {{ error }}
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
/* Ocupa todo el ancho/alto del contenedor padre sin exceder el layout */
.grafana-dashboard {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: calc(100vh - 160px); /* Altura mínima considerando header y padding */
  background-color: #0b1426; /* Misma tonalidad dark de Grafana */
  overflow: auto;
}

/* Wrapper para mantener el iframe al 100% del contenedor */
.dashboard-container {
  width: 100%;
  height: 100%;
  min-height: inherit; /* Hereda la altura mínima del padre */
  background: transparent;
}

.loading,
.error {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  min-height: 500px;
  font-size: 1.2em;
}

.error {
  color: red;
}

/* Iframe embebido ocupando el 100% */
.grafana-iframe {
  width: 100%;
  height: 100%;
  min-height: calc(100vh - 160px); /* Altura mínima para asegurar visibilidad completa */
  border: none;
  outline: none;
  background: #0b1426;
  display: block;
  margin: 0;
  padding: 0;
  overflow: hidden;
}
</style> -->
