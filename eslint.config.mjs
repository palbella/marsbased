import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { FlatCompat } from '@eslint/eslintrc'

const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) })

// 02 §3.3: mocks are only reachable over HTTP.
const mocksBoundary = {
  group: ['@/mocks', '@/mocks/*'],
  message: 'Mocks are only reachable over HTTP. Use "@/services".',
}

const eslintConfig = [
  { ignores: ['.next/**', 'node_modules/**', 'public/mockServiceWorker.js', 'next-env.d.ts'] },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      'no-restricted-imports': ['error', { patterns: [mocksBoundary] }],
    },
  },
  {
    // The mock bootstrap is the only app code allowed to load the mock backend.
    files: ['src/mocks/**', 'src/app/mock-provider.tsx'],
    rules: { 'no-restricted-imports': 'off' },
  },
]

export default eslintConfig
