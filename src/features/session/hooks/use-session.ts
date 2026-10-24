'use client'

import { useContext } from 'react'
import type { User } from '@/domain'
import { SessionContext, type SessionContextValue } from '../session-context'

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext)
  if (!value) throw new Error('useSession must be used inside SessionProvider')
  return value
}

// For components inside the session guard, where the user is always there.
export function useCurrentUser(): User | null {
  const { session } = useSession()
  return session.status === 'signed-in' ? session.user : null
}
