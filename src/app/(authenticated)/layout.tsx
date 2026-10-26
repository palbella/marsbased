'use client'

import type { PropsWithChildren } from 'react'
import { SessionGuard } from '@/features/session'
import { AppShell, ShellSkeleton } from '@/features/shell'
import { NetworkSelector } from '@/features/simulator'
import { IS_NON_PRODUCTION } from '@/lib/environment'

// UI-01..05, UI-09: session guard + shell for every authenticated route. If the session
// cannot load because this tab's simulated network is down (02 §5.6), the network selector is
// offered next to Retry, so the tab can always get back to Normal.
export default function AuthenticatedLayout({ children }: PropsWithChildren) {
  return (
    <SessionGuard
      fallback={<ShellSkeleton />}
      unavailableActions={IS_NON_PRODUCTION && <NetworkSelector />}
    >
      <AppShell>{children}</AppShell>
    </SessionGuard>
  )
}
