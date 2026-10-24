'use client'

import { useEffect, useState, type PropsWithChildren } from 'react'

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
      .catch(() => setFailed(true))
  }, [])

  if (failed) return <MockUnavailable />
  if (!ready) return <p className="p-4">Starting…</p>
  return children
}

function MockUnavailable() {
  return (
    <div role="alert" className="flex flex-col items-start gap-2 p-4">
      <p>The service is unavailable.</p>
      <button type="button" className="underline" onClick={() => location.reload()}>
        Retry
      </button>
    </div>
  )
}
