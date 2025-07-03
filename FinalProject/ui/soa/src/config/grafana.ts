const GRAFANA_URL = import.meta.env.VITE_GRAFANA_API_URL

export const GRAFANA_CONFIG = {
  baseUrl: GRAFANA_URL,
  dashboardUid: 'tank-monitoring-001',
  dashboardSlug: 'f09f8fad-tank-monitoring-dashboard',
  containerId: 'container_001',
  //height: 20,
  // TODO agregar raspyId para manejarlo dinamicamente al seleccionar la raspi
  refreshInterval: '5s',
  timeRange: {
    from: 'now-5m',
    to: 'now',
  },
  headers: {
    'X-Grafana-Org-Id': '1',
    'X-Grafana-User': 'admin',
    Accept: 'application/json, text/plain, */*',
    'Content-Type': 'application/json',
  },
}
