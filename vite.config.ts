import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  root: 'src',
  cacheDir: '../node_modules/.vite',
  plugins: [react()],
  build: {
    emptyOutDir: true,
    outDir: '../dist',
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
  },
  preview: {
    host: '127.0.0.1',
    port: 4173,
  },
  test: {
    css: true,
    environment: 'jsdom',
    setupFiles: './test/setup.ts',
  },
})
