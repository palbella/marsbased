import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  // Next keeps JSX as is for its own compiler; component tests need it compiled.
  esbuild: { jsx: 'automatic' },
  test: {
    environment: 'node',
    // Component tests opt into jsdom per file (`// @vitest-environment jsdom`).
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    // Node's fetch needs an absolute URL; any origin reaches the handlers.
    env: { NEXT_PUBLIC_API_URL: 'http://localhost/api' },
  },
})
