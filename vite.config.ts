import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        ws: false, // Disable WebSocket proxying if not needed
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, res) => {
            // Suppress ECONNRESET errors - these are usually harmless
            if (err.code !== 'ECONNRESET') {
              console.error('Proxy error:', err);
            }
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // Log proxy requests for debugging (optional)
            // console.log('Proxying:', req.method, req.url);
          });
        },
      },
    },
  },
})
