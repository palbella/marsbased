'use client'

import type { PropsWithChildren } from 'react'
import { RoleGuard } from '@/features/session'

// 02 §8: customer area.
export default function PortalLayout({ children }: PropsWithChildren) {
  return <RoleGuard area="portal">{children}</RoleGuard>
}
