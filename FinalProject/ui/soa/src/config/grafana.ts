// Función para obtener el token de manera segura
const getServiceAccountToken = () => {
  // En el contexto del cliente (browser)
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env.VITE_GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
  }
  // En el contexto de Node.js (configuración de Vite)
  return process.env.VITE_GRAFANA_SERVICE_ACCOUNT_TOKEN || '';
};

export const GRAFANA_CONFIG = {
  baseUrl: 'https://lpn3.crabdance.com',
  dashboardUid: 'tank-monitoring-001',
  dashboardSlug: 'f09f8fad-tank-monitoring-dashboard',
  serviceAccountToken: getServiceAccountToken(),
  containerId: 'container_001',
  height: 20,
  refreshInterval: '1m',
  timeRange: {
    from: 'now-5m',
    to: 'now',
  },
  headers: {
    'X-Grafana-Org-Id': '1',
    'X-Grafana-User': 'admin',
    'Accept': 'application/json, text/plain, */*',
    'Content-Type': 'application/json',
  },
}; 