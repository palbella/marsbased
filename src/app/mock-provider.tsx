'use client'

import { useEffect, useState, type PropsWithChildren } from 'react'
import { ErrorState } from '@/components/ui/error-state'
import { LoadingState } from '@/components/ui/loading-state'
import { Wordmark } from '@/components/ui/wordmark'
import { monitoring } from '@/lib/monitoring'

// Gated on the flag only, never on NODE_ENV: the Phase 1 production build mocks too (02 §5.7).
const MOCKING_ENABLED = process.env.NEXT_PUBLIC_API_MOCKING === 'enabled'

export function MockProvider({ children }: PropsWithChildren) {
  const [ready, setReady] = useState(!MOCKING_ENABLED)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!MOCKING_ENABLED) return
    // Dynamic import keeps the mock backend out of the bundle when mocking is off.
    import('@/mocks/browser')
      .then(({ worker }) => worker.start({ onUnhandledRequest: 'bypass' }))
      .then(() => setReady(true))
      .catch((error: unknown) => {
        // 02 §5.8: the worker failing to start is an incident.
        monitoring.captureException(error, { tags: { area: 'mock-bootstrap' } })
        setFailed(true)
      })
  }, [])

  if (failed) return <ServiceUnavailable />
  if (!ready) return <Splash />
  return children
}

// 02 §5.6: a splash with Retry instead of a blank page.
function ServiceUnavailable() {
  return (
    <Splash>
      <ErrorState onRetry={() => location.reload()} />
    </Splash>
  )
}

function Splash({ children }: PropsWithChildren) {
  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <header className="flex h-14 items-center bg-ink px-4 text-paper md:px-5">
        <Wordmark />
      </header>
      {children ?? <LoadingState label="Starting" />}
    </div>
  )
}
