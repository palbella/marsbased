'use client'

import type { PropsWithChildren } from 'react'
import { SessionGuard } from '@/features/session'
import { AppShell, ShellSkeleton } from '@/features/shell'

// UI-01..05, UI-09: session guard + shell for every authenticated route.
export default function AuthenticatedLayout({ children }: PropsWithChildren) {
  return (
    <SessionGuard fallback={<ShellSkeleton />}>
      <AppShell>{children}</AppShell>
    </SessionGuard>
  )
}
