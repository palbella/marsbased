// @vitest-environment jsdom
import '@/test/dom'
import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LoadingState, SLOW_LOADING_HINT_MS } from './loading-state'

const SLOW_HINT = 'This is taking longer than usual…'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('02 §5.6 slow loading hint', () => {
  it('appears under the skeleton after 5 s of loading, not before', () => {
    render(<LoadingState label="Loading shipment" />)
    act(() => vi.advanceTimersByTime(SLOW_LOADING_HINT_MS - 1))
    expect(screen.queryByText(SLOW_HINT)).toBeNull()
    act(() => vi.advanceTimersByTime(1))
    expect(screen.getByRole('status').textContent).toContain(SLOW_HINT)
  })
})
