'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { buttonClasses } from '@/components/ui/button'
import { ErrorState } from '@/components/ui/error-state'
import { monitoring } from '@/lib/monitoring'

interface RouteErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

// 02 §5.6: a render error in a page keeps the shell visible; only the content area falls
// back. Reported as a render error (02 §5.8).
export default function AuthenticatedError({ error, reset }: RouteErrorProps) {
  useEffect(() => {
    monitoring.captureException(error, { tags: { area: 'render', boundary: 'route' } })
  }, [error])

  return (
    <ErrorState
      stamp="ERROR"
      message="Something went wrong."
      onRetry={reset}
      retryLabel="Try again"
    >
      <Link href="/" className={buttonClasses('secondary')}>
        Go home
      </Link>
    </ErrorState>
  )
}
