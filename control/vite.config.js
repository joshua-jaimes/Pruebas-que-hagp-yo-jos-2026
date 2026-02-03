import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      fs: './src/utils/fs-mock.js'
    }
  },
  optimizeDeps: {
    exclude: ['face-api.js']
  },
  build: {
    commonjsOptions: {
      include: [/face-api.js/, /node_modules/]
    }
  }
})
