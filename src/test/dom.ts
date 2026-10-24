import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Imported by component tests (jsdom). Radix measures its popovers with ResizeObserver,
// which jsdom does not implement.
class NoopResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= NoopResizeObserver

afterEach(cleanup)
