'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, type PropsWithChildren, type ReactNode } from 'react'
import { ErrorState } from '@/components/ui/error-state'
import { useSession } from '../hooks/use-session'
import { signInPathFor } from '../session-routes'

// UI-09: the authenticated area renders only with a resolved session; until then the
// fallback (the shell skeleton), never a flash of the wrong role's content.
interface SessionGuardProps {
  fallback: ReactNode
}

export function SessionGuard({ fallback, children }: PropsWithChildren<SessionGuardProps>) {
  const { session } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const reason = session.status === 'signed-out' ? session.reason : null

  useEffect(() => {
    if (reason === null) return
    router.replace(signInPathFor(reason, `${pathname}${window.location.search}`))
  }, [reason, pathname, router])

  if (session.status === 'signed-in') return children
  if (session.status === 'unavailable') return <ErrorState onRetry={session.retry} />
  return fallback
}
