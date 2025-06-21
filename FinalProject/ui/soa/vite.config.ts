import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    allowedHosts: ['16ef-190-31-195-66.ngrok-free.app'], // reemplazá con tu subdominio actual de ngrok
    host: true, // permite que Vite escuche conexiones externas
    port: 5173,
  },
})
