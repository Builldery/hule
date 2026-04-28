import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import swc from 'vite-plugin-swc-transform'
import { getResolvedAliases } from '../../vite.aliases'

const apiTarget = process.env.VITE_API_PROXY ?? 'http://api:3000'

export default defineConfig({
  plugins: [
    vue(),
    // @buildery/ts-api-kit uses legacy (2022-03) TS decorators on CRUD
    // operation classes. Default esbuild can't transform them, so we route
    // TS through SWC the same way the upstream builderry app does.
    swc({
      swcOptions: {
        jsc: {
          parser: { syntax: 'typescript', decorators: true },
          transform: { decoratorVersion: '2022-03' },
          target: 'es2022',
        },
      },
    }),
  ],
  resolve: {
    alias: getResolvedAliases(__dirname),
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
        quietDeps: true,
        silenceDeprecations: ['import', 'global-builtin', 'legacy-js-api'],
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    watch: process.env.VITE_USE_POLLING === 'true'
      ? { usePolling: true, interval: 300 }
      : undefined,
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: false,
      },
    },
  },
})
