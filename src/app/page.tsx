'use client'

import { useEffect, useState, type FormEvent } from 'react'
import type { Shipment, User } from '@/domain'
import { authService, exceptionsService, shipmentsService } from '@/services'

// TEMPORARY (T05 walking skeleton): proves sign-in → services → mock API → perimeter in the
// browser, unstyled on purpose. T06 replaces it with the redirect of 03-app-shell §2.

interface Overview {
  user: User
  shipments: Shipment[]
  // null for customers: exceptions are ops only (BR-PM-03).
  openExceptions: number | null
}

export default function HomePage() {
  const [overview, setOverview] = useState<Overview | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = (user: User) =>
    loadOverview(user)
      .then(setOverview)
      .catch((reason: unknown) => setError(String(reason)))

  useEffect(() => {
    if (!authService.hasSession()) return
    authService
      .me()
      .then(load)
      .catch((reason: unknown) => setError(String(reason)))
  }, [])

  const signOut = () => {
    authService.signOut().finally(() => setOverview(null))
  }

  return (
    <main className="flex flex-col gap-4 p-4">
      <h1 className="text-lg font-semibold">Walking skeleton (temporary)</h1>
      {error && <p role="alert">{error}</p>}
      {overview ? (
        <OverviewView overview={overview} onSignOut={signOut} />
      ) : (
        <SignInForm onSignedIn={load} onError={setError} />
      )}
    </main>
  )
}

async function loadOverview(user: User): Promise<Overview> {
  const shipments = await shipmentsService.list()
  if (user.role === 'customer') return { user, shipments, openExceptions: null }
  const exceptions = await exceptionsService.list()
  return { user, shipments, openExceptions: exceptions.length }
}

function SignInForm({
  onSignedIn,
  onError,
}: {
  onSignedIn: (user: User) => void
  onError: (message: string | null) => void
}) {
  const [email, setEmail] = useState('marc.puig@corvane.test')
  const [password, setPassword] = useState('')

  const submit = (event: FormEvent) => {
    event.preventDefault()
    onError(null)
    authService
      .signIn({ email, password })
      .then(onSignedIn)
      .catch((reason: unknown) => onError(String(reason)))
  }

  return (
    <form onSubmit={submit} className="flex max-w-sm flex-col gap-2">
      <label className="flex flex-col">
        E-mail
        <input
          className="border"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>
      <label className="flex flex-col">
        Password
        <input
          className="border"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>
      <button type="submit" className="border">
        Sign in
      </button>
    </form>
  )
}

function OverviewView({ overview, onSignOut }: { overview: Overview; onSignOut: () => void }) {
  const { user, shipments, openExceptions } = overview
  return (
    <section className="flex flex-col gap-2">
      <p>
        Signed in as {user.name} ({user.role})
      </p>
      <p>Open exceptions: {openExceptions ?? 'not available for customers'}</p>
      <p>Shipments ({shipments.length}):</p>
      <ul className="list-disc pl-6">
        {shipments.map((shipment) => (
          <li key={shipment.id}>
            {shipment.reference} · {shipment.accountName}
          </li>
        ))}
      </ul>
      <button type="button" className="w-fit border" onClick={onSignOut}>
        Sign out
      </button>
    </section>
  )
}
