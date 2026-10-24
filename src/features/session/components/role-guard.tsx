'use client'

import { useRouter } from 'next/navigation'
import { useEffect, type PropsWithChildren } from 'react'
import { LoadingState } from '@/components/ui/loading-state'
import { useCurrentUser } from '../hooks/use-session'
import { areaOf, homeFor, type Area } from '../session-routes'

// 02 §8, US-00: a signed-in user opening the other role's area goes to their own. A UX guard
// only; the perimeter is enforced behind the API (P5).
interface RoleGuardProps {
  area: Area
}

export function RoleGuard({ area, children }: PropsWithChildren<RoleGuardProps>) {
  const user = useCurrentUser()
  const router = useRouter()
  const allowed = user !== null && areaOf(user.role) === area
  const ownHome = user === null ? null : homeFor(user.role)

  useEffect(() => {
    if (!allowed && ownHome !== null) router.replace(ownHome)
  }, [allowed, ownHome, router])

  if (allowed) return children
  return <LoadingState label="Redirecting" />
}
