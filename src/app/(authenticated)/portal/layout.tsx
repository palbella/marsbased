'use client'

import type { PropsWithChildren } from 'react'
import { NewAlertToaster } from '@/features/alerts'
import { RoleGuard } from '@/features/session'

// 02 §8: customer area. CP-31: new-alert toasts on any portal page.
export default function PortalLayout({ children }: PropsWithChildren) {
  return (
    <RoleGuard area="portal">
      {children}
      <NewAlertToaster />
    </RoleGuard>
  )
}
