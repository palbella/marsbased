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
    // 02 §3.1: domain depends on no other layer and has no React or IO code.
    files: ['src/domain/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            mocksBoundary,
            {
              group: [
                '@/app',
                '@/app/*',
                '@/features',
                '@/features/*',
                '@/services',
                '@/services/*',
              ],
              message: 'Domain depends on no other layer.',
            },
            {
              group: ['react', 'react-dom', 'next', 'next/*'],
              message: 'Domain has no React code.',
            },
          ],
        },
      ],
    },
  },
  {
    // The mock bootstrap is the only app code allowed to load the mock backend.
    files: ['src/app/mock-provider.tsx'],
    rules: { 'no-restricted-imports': 'off' },
  },
  {
    // 02 §3.2: services and mocks never import each other; they only meet over HTTP.
    files: ['src/mocks/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/services', '@/services/*'],
              message: 'Mocks are a backend: they never import the API client.',
            },
          ],
        },
      ],
    },
  },
  {
    // Integration tests drive services against the real handlers (02 §10), so they see both.
    files: ['src/integration/**'],
    rules: { 'no-restricted-imports': 'off' },
  },
]

export default eslintConfig
