'use client'

import { useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query'
import { useEffect, useState, type PropsWithChildren } from 'react'
import type { SignInRequest, User } from '@/domain'
import { monitoring } from '@/lib/monitoring'
import { authService, onSessionExpired, queryKeys } from '@/services'
import { SessionContext, type Session } from '../session-context'
import type { SignedOutReason } from '../session-routes'

// Whether this tab holds a token (ADR-009: per tab, in sessionStorage).
type TokenGate =
  { kind: 'checking' } | { kind: 'present' } | { kind: 'absent'; reason: SignedOutReason }

const PRESENT: TokenGate = { kind: 'present' }
const RESOLVING: Session = { status: 'resolving' }

// US-00, UI-09: resolves the tab's user from `GET /api/auth/me`, signs in and out, and signs
// the tab out when any request reports an expired session.
export function SessionProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient()
  const [gate, setGate] = useState<TokenGate>({ kind: 'checking' })
  const me = useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: ({ signal }) => authService.me({ signal }),
    enabled: gate.kind === 'present',
    staleTime: Infinity,
  })

  // sessionStorage only exists in the browser, so the token is read after mount.
  useEffect(() => {
    setGate(authService.hasSession() ? PRESENT : signedOut('no-session'))
  }, [])

  useEffect(
    () =>
      onSessionExpired(() => {
        // The auth service sets the monitoring user on sign-in and /me, and clears it on
        // sign-out; an expiry happens outside it.
        monitoring.setUser(null)
        queryClient.clear()
        setGate(signedOut('expired'))
      }),
    [queryClient],
  )

  const session = toSession(gate, me)

  const signIn = async (credentials: SignInRequest) => {
    const signedIn = await authService.signIn(credentials)
    queryClient.setQueryData(queryKeys.auth.me(), signedIn)
    setGate(PRESENT)
    return signedIn
  }

  // UI-04: the tab's token and its query cache go even if the request fails.
  const signOut = async () => {
    await authService
      .signOut()
      .catch(() =>
        monitoring.addBreadcrumb({ category: 'session', message: 'Sign-out request failed' }),
      )
    queryClient.clear()
    setGate(signedOut('signed-out'))
  }

  return <SessionContext value={{ session, signIn, signOut }}>{children}</SessionContext>
}

function signedOut(reason: SignedOutReason): TokenGate {
  return { kind: 'absent', reason }
}

function toSession(gate: TokenGate, me: UseQueryResult<User>): Session {
  if (gate.kind === 'checking') return RESOLVING
  if (gate.kind === 'absent') return { status: 'signed-out', reason: gate.reason }
  if (me.data) return { status: 'signed-in', user: me.data }
  if (me.isError) return { status: 'unavailable', retry: () => void me.refetch() }
  return RESOLVING
}
