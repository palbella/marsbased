'use client'

import { createContext } from 'react'
import type { SignInRequest, User } from '@/domain'
import type { SignedOutReason } from './session-routes'

// UI-09: while resolving, nothing role-specific renders; `unavailable` is `GET /auth/me`
// failing for a reason other than 401, shown with Retry instead of a wrong redirect.
export type Session =
  | { status: 'resolving' }
  | { status: 'signed-out'; reason: SignedOutReason }
  | { status: 'unavailable'; retry: () => void }
  | { status: 'signed-in'; user: User }

export interface SessionContextValue {
  session: Session
  signIn(credentials: SignInRequest): Promise<User>
  // Never rejects: signing out must always work (UI-04).
  signOut(): Promise<void>
}

export const SessionContext = createContext<SessionContextValue | null>(null)
