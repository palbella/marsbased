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
  // Extra actions next to Retry, e.g. "Go home" in the route error page.
  children?: ReactNode
}

export function ErrorState({
  stamp = 'NO SIGNAL',
  message = 'The service is unavailable.',
  onRetry,
  retryLabel = 'Retry',
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
    </>
  )
  return <StampedState stamp={stamp} message={message} tone="late" role="alert" actions={actions} />
}
