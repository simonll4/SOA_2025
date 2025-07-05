import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [vue(), vueDevTools()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      host: true,
      port: parseInt(env.VITE_PORT) || 5173,
      allowedHosts: ['.ngrok-free.app', 'app.lpn2.crabdance.com', 'lpn2.crabdance.com'],
      proxy: {
        '/api': {
          target: env.VITE_GRAFANA_API_URL || 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
          configure: (proxy, _options) => {
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              proxyReq.setHeader('X-Grafana-Org-Id', '1')
              proxyReq.setHeader('X-Grafana-User', 'admin')
              proxyReq.setHeader('Accept', 'application/json, text/plain, */*')
              proxyReq.setHeader('Content-Type', 'application/json')
              // Nota: serviceAccountToken se maneja en runtime
            })
            proxy.on('proxyRes', (proxyRes, req, res) => {
              proxyRes.headers['Access-Control-Allow-Origin'] = '*'
              proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
              proxyRes.headers['Access-Control-Allow-Headers'] = '*'
              proxyRes.headers['Access-Control-Allow-Credentials'] = 'true'
              proxyRes.headers['Content-Security-Policy'] =
                "default-src 'self' 'unsafe-inline' 'unsafe-eval' https: data: blob:; frame-ancestors 'self' *"
              proxyRes.headers['Cross-Origin-Resource-Policy'] = 'cross-origin'
              proxyRes.headers['Cross-Origin-Embedder-Policy'] = 'credentialless'
              proxyRes.headers['Cross-Origin-Opener-Policy'] = 'same-origin'
            })
          },
          ws: true,
          followRedirects: true,
          autoRewrite: true,
          protocolRewrite: 'https',
        },
      },
    },
    preview: {
      host: true,
      port: parseInt(env.VITE_PORT) || 3000,
      allowedHosts: ['.ngrok-free.app', 'app.lpn2.crabdance.com', 'lpn2.crabdance.com'],
    },
  }
})

// import { fileURLToPath, URL } from 'node:url'

// import { defineConfig } from 'vite'
// import vue from '@vitejs/plugin-vue'
// import vueDevTools from 'vite-plugin-vue-devtools'
// import { GRAFANA_CONFIG } from './src/config/grafana'

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [vue(), vueDevTools()],
//   resolve: {
//     alias: {
//       '@': fileURLToPath(new URL('./src', import.meta.url)),
//     },
//   },
//   server: {
//     host: true,
//     port: 5173,
//     allowedHosts: ['.ngrok-free.app'],
//     proxy: {
//       '/api': {
//         target: GRAFANA_CONFIG.baseUrl,
//         changeOrigin: true,
//         secure: false,
//         configure: (proxy, _options) => {
//           proxy.on('proxyReq', (proxyReq, req, _res) => {
//             proxyReq.setHeader('X-Grafana-Org-Id', '1');
//             proxyReq.setHeader('X-Grafana-User', 'admin');
//             proxyReq.setHeader('Accept', 'application/json, text/plain, */*');
//             proxyReq.setHeader('Content-Type', 'application/json');
//             proxyReq.setHeader('Authorization', `Bearer ${GRAFANA_CONFIG.serviceAccountToken}`);
//           });
//           proxy.on('proxyRes', (proxyRes, req, res) => {
//             proxyRes.headers['Access-Control-Allow-Origin'] = '*';
//             proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
//             proxyRes.headers['Access-Control-Allow-Headers'] = '*';
//             proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
//             proxyRes.headers['Content-Security-Policy'] = "default-src 'self' 'unsafe-inline' 'unsafe-eval' https: data: blob:; frame-ancestors 'self' *";
//             proxyRes.headers['Cross-Origin-Resource-Policy'] = 'cross-origin';
//             proxyRes.headers['Cross-Origin-Embedder-Policy'] = 'credentialless';
//             proxyRes.headers['Cross-Origin-Opener-Policy'] = 'same-origin';
//           });
//         },
//         ws: true,
//         followRedirects: true,
//         autoRewrite: true,
//         protocolRewrite: 'https',
//       },
//     },
//   },
// })
