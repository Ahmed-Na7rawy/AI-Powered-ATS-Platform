import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/auth': 'http://127.0.0.1:8000',
      '/hr': 'http://127.0.0.1:8000',
      '/ai': 'http://127.0.0.1:8000',
      '/api/apply': 'http://127.0.0.1:8000'
    }
  }
})
