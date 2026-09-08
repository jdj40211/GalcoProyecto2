import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'node:path';

export default defineConfig({
  plugins: [vue()],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
  server: {
    port: 5173,
    proxy: apiProxy()
  },
  preview: {
    port: 4173,
    proxy: apiProxy()
  }
});

function apiProxy() {
  return {
    '/api': {
      target: process.env.GALCO_API_PROXY || process.env.VIATICOS_API_PROXY || 'http://localhost:3000',
      changeOrigin: true
    }
  };
}
