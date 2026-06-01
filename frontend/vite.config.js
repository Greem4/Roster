import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/** Продовый API (Pi недоступна в LAN — dev.sh сам переключится). */
const remoteApi = process.env.ROSTER_DEV_REMOTE === '1'
const remoteApiTarget =
  process.env.ROSTER_REMOTE_API_URL || 'https://medicine.greemlab.ru'

export default defineConfig({
  plugins: [react()],
  server: {
    // Доступ с телефона в той же Wi‑Fi: http://<IP-Mac>:5173
    host: true,
    allowedHosts: true,
    proxy: {
      '/api': remoteApi
        ? {
            // Caddy на Pi: /api/* → FastAPI; rewrite не нужен
            target: remoteApiTarget,
            changeOrigin: true,
            secure: true,
          }
        : {
            // Локально или через SSH-туннель: /api → uvicorn без префикса
            target: 'http://127.0.0.1:8000',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api/, ''),
          },
    },
  },
})
