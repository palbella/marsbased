'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { ErrorState } from '@/components/ui/error-state'
import { LoadingState } from '@/components/ui/loading-state'
import { useSession } from '../hooks/use-session'
import type { Session } from '../session-context'
import { homeFor, SIGN_IN_PATH } from '../session-routes'

// 03 §2: `/` redirects: no session → sign-in · customer → portal · ops → console.
export function RootRedirect() {
  const { session } = useSession()
  const router = useRouter()
  const target = targetFor(session)

  useEffect(() => {
    if (target !== null) router.replace(target)
  }, [target, router])

  if (session.status === 'unavailable') return <ErrorState onRetry={session.retry} />
  return <LoadingState label="Opening" />
}

function targetFor(session: Session): string | null {
  if (session.status === 'signed-in') return homeFor(session.user.role)
  if (session.status === 'signed-out') return SIGN_IN_PATH
  return null
}
