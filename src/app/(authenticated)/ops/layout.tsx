'use client'

import type { PropsWithChildren } from 'react'
import { RoleGuard } from '@/features/session'

// 02 §8: operations area.
export default function OpsLayout({ children }: PropsWithChildren) {
  return <RoleGuard area="ops">{children}</RoleGuard>
}
