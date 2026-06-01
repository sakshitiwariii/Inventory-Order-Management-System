import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const apiUrl = process.env.VITE_API_URL
const devPort = Number(process.env.VITE_DEV_PORT)

export default defineConfig({
  plugins: [react()],
  server: {
    port: devPort,
    proxy: {
      '/api': {
        target: apiUrl,
        changeOrigin: true,
      },
    },
  },
})
