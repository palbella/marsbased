'use client'

import { useEffect } from 'react'
import { ErrorState } from '@/components/ui/error-state'
import { monitoring } from '@/lib/monitoring'
import { fontVariables } from './fonts'
import './globals.css'

interface GlobalErrorProps {
  error: Error & { digest?: string }
}

// 02 §5.6: a render error in the root layout replaces the whole page, so this renders its
// own document. Reload starts the app (and the mock worker) again.
export default function GlobalError({ error }: GlobalErrorProps) {
  useEffect(() => {
    monitoring.captureException(error, { tags: { area: 'render', boundary: 'global' } })
  }, [error])

  return (
    <html lang="en" className={fontVariables}>
      <body>
        <ErrorState
          stamp="ERROR"
          message="Something went wrong."
          onRetry={() => location.reload()}
          retryLabel="Reload"
        />
      </body>
    </html>
  )
}
