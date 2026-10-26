import type { ReactNode } from 'react'
import { Button } from './button'
import { StampedState } from './stamped-state'

// UI-10, 02 §5.6: a failure shown where it happens, with Retry; the rest of the page keeps
// working.
interface ErrorStateProps {
  stamp?: string
  message?: string
  onRetry?: () => void
  retryLabel?: string
  // A refetch is running: the error stays until data arrives (02 §5.6).
  retrying?: boolean
  // Extra actions next to Retry, e.g. "Go home" in the route error page.
  children?: ReactNode
}

export function ErrorState({
  stamp = 'NO SIGNAL',
  message = 'The service is unavailable.',
  onRetry,
  retryLabel = 'Retry',
  retrying = false,
  children,
}: ErrorStateProps) {
  const actions = (
    <>
      {onRetry && (
        <Button type="button" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
      {children}
      {retrying && <span className="self-center text-sm text-ink-muted">Retrying…</span>}
    </>
  )
  return <StampedState stamp={stamp} message={message} tone="late" role="alert" actions={actions} />
}
