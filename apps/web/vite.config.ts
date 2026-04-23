import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { getResolvedAliases } from '../../vite.aliases'

const apiTarget = process.env.VITE_API_PROXY ?? 'http://api:3000'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: getResolvedAliases(__dirname),
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: false,
      },
    },
  },
})
