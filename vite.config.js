import { defineConfig } from 'vite'

export default defineConfig({
  css: {
    devSourcemap: true,
  },
  server: {
    proxy: {
      '/gamelog': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  }
})