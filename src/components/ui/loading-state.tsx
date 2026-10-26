'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

// UI-10: skeleton rows in the shape of a ruled list, never a centred spinner.
const DEFAULT_ROWS = 4
// Varied widths so the skeleton reads as text, not as a grid.
const LINE_WIDTHS = ['w-2/3', 'w-1/2', 'w-3/5', 'w-2/5']
// 02 §5.6 "Where errors are shown": after this long, say the wait is unusual.
export const SLOW_LOADING_HINT_MS = 5_000

interface LoadingStateProps {
  rows?: number
  label?: string
  className?: string
}

export function LoadingState({
  rows = DEFAULT_ROWS,
  label = 'Loading',
  className,
}: LoadingStateProps) {
  const slow = useSlowLoading()
  return (
    <div role="status" aria-busy="true" className={cn('px-4 py-6 md:px-8', className)}>
      <span className="sr-only">{label}…</span>
      <ul aria-hidden className="divide-y divide-rule border-y border-rule bg-sheet">
        {Array.from({ length: rows }, (_, index) => (
          <li key={index} className="flex items-center gap-4 px-4 py-4">
            <span className="h-4 w-16 animate-pulse rounded-xs bg-rule" />
            <span
              className={cn(
                'h-3 animate-pulse rounded-xs bg-rule',
                LINE_WIDTHS[index % LINE_WIDTHS.length],
              )}
            />
          </li>
        ))}
      </ul>
      {slow && <p className="mt-3 text-sm text-ink-muted">This is taking longer than usual…</p>}
    </div>
  )
}

function useSlowLoading(): boolean {
  const [slow, setSlow] = useState(false)
  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), SLOW_LOADING_HINT_MS)
    return () => clearTimeout(timer)
  }, [])
  return slow
}
