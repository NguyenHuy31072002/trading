import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/trading/',
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': 'http://localhost:8000',
      '/ws': { target: 'ws://localhost:8000', ws: true },
      '/trading/api': { target: 'http://localhost:8000', rewrite: p => p.replace(/^\/trading/, '') },
      '/trading/ws': { target: 'ws://localhost:8000', ws: true, rewrite: p => p.replace(/^\/trading/, '') },
    },
  },
})
