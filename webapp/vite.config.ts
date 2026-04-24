import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // В режиме разработки /api/* проксируется на NestJS, чтобы не настраивать CORS вручную.
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
