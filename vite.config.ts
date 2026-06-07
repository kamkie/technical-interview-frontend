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
    proxy: {
      '^/api(?:$|/(?!.*\\.(?:ts|tsx|js|jsx|css|map)(?:\\?|$)).*)': {
        target: 'http://localhost:8080',
        changeOrigin: false,
      },
    },
  },
  preview: {
    host: '127.0.0.1',
    port: 4173,
  },
  test: {
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      reportsDirectory: '../coverage',
      include: ['**/*.{ts,tsx}'],
      exclude: [
        '**/*.test.{ts,tsx}',
        '**/generated/**',
        '**/test/**',
        'main.tsx',
        'vite-env.d.ts',
      ],
    },
    environment: 'jsdom',
    setupFiles: './test/setup.ts',
  },
})
