import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  "base": "/user-management-UI",
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        ws: false, // Disable WebSocket proxying if not needed
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            // Suppress ECONNRESET errors - these are usually harmless
            // Check if error has code property (Node.js network errors have this)
            const errorWithCode = err as Error & { code?: string };
            if (errorWithCode.code !== 'ECONNRESET') {
              console.error('Proxy error:', err);
            }
          });
          proxy.on('proxyReq', (_proxyReq, _req, _res) => {
            // Log proxy requests for debugging (optional)
            // console.log('Proxying:', req.method, req.url);
          });
        },
      },
      // Note: /api/oauth2/* endpoints are already handled by the /api proxy above
      // /oauth2/callback is a frontend route handled by React Router, not proxied
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', '.idea', '.vscode', '.git'],
  },
})
