import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // Node's fetch needs an absolute URL; any origin reaches the handlers.
    env: { NEXT_PUBLIC_API_URL: 'http://localhost/api' },
  },
})
