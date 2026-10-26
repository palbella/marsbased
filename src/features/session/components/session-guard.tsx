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
  // Shown with the error when the session cannot be resolved, e.g. the way back to a working
  // network mode (02 §5.6), since the shell and its simulator panel are not there yet.
  unavailableActions?: ReactNode
}

export function SessionGuard({
  fallback,
  unavailableActions,
  children,
}: PropsWithChildren<SessionGuardProps>) {
  const { session } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const reason = session.status === 'signed-out' ? session.reason : null

  useEffect(() => {
    if (reason === null) return
    router.replace(signInPathFor(reason, `${pathname}${window.location.search}`))
  }, [reason, pathname, router])

  if (session.status === 'signed-in') return children
  if (session.status === 'unavailable') {
    return (
      <>
        <ErrorState onRetry={session.retry} />
        {unavailableActions}
      </>
    )
  }
  return fallback
}
