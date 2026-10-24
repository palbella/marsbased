'use client'

import { useEffect, useState } from 'react'

type HealthState =
  { kind: 'loading' } | { kind: 'loaded'; body: unknown } | { kind: 'failed'; message: string }

// Temporary T01 page to verify the mock API in the browser; T06 replaces it (03-app-shell §2).
export default function HomePage() {
  const [health, setHealth] = useState<HealthState>({ kind: 'loading' })

  useEffect(() => {
    fetch('/api/health')
      .then((response) => response.json())
      .then((body: unknown) => setHealth({ kind: 'loaded', body }))
      .catch((error: unknown) => setHealth({ kind: 'failed', message: String(error) }))
  }, [])

  return (
    <main className="p-4">
      <h1 className="text-lg font-semibold">GET /api/health</h1>
      <HealthResult health={health} />
    </main>
  )
}

function HealthResult({ health }: { health: HealthState }) {
  if (health.kind === 'loading') return <p>Loading…</p>
  if (health.kind === 'failed') return <p role="alert">Request failed: {health.message}</p>
  return <pre>{JSON.stringify(health.body, null, 2)}</pre>
}
