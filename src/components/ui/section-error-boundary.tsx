'use client'

import type { PropsWithChildren } from 'react'
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary'
import { monitoring } from '@/lib/monitoring'
import { ErrorState } from './error-state'

// 02 §5.6: wraps an independent block of a page, so one broken block never takes the page
// down. Render errors are reported (02 §5.8).
interface SectionErrorBoundaryProps {
  // Names the block in the monitoring event, e.g. "timeline".
  section: string
}

export function SectionErrorBoundary({
  section,
  children,
}: PropsWithChildren<SectionErrorBoundaryProps>) {
  return (
    <ErrorBoundary
      FallbackComponent={SectionFallback}
      onError={(error) => monitoring.captureException(error, { tags: { area: 'render', section } })}
    >
      {children}
    </ErrorBoundary>
  )
}

function SectionFallback({ resetErrorBoundary }: FallbackProps) {
  return (
    <ErrorState
      stamp="ERROR"
      message="This section could not be displayed."
      onRetry={resetErrorBoundary}
      retryLabel="Try again"
    />
  )
}
