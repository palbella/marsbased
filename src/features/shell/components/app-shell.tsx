'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState, type PropsWithChildren } from 'react'
import { useLiveUpdates } from '@/features/realtime'
import { useCurrentUser } from '@/features/session'
import { SimulatorPanel } from '@/features/simulator'
import { IS_NON_PRODUCTION } from '@/lib/environment'
import { InkRail } from './ink-rail'
import { MobileDrawer } from './mobile-drawer'
import { OfflineBanner } from './offline-banner'
import { StatusStrip } from './status-strip'

// 03 §3, UI-01: one shell for both roles. Strip and rail are fixed; only `main` scrolls,
// and its scroll goes back to the top on every navigation.
export function AppShell({ children }: PropsWithChildren) {
  const user = useCurrentUser()
  const pathname = usePathname()
  const mainRef = useRef<HTMLElement>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [simulatorOpen, setSimulatorOpen] = useState(false)
  // US-R-01: one subscription per tab, while signed in.
  useLiveUpdates()

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 })
  }, [pathname])

  if (!user) return null
  const openSimulator = () => setSimulatorOpen(true)

  return (
    <div className="grid h-dvh grid-rows-[3.5rem_minmax(0,1fr)] md:grid-cols-[14rem_minmax(0,1fr)]">
      <StatusStrip user={user} onOpenMenu={() => setDrawerOpen(true)} />
      <aside className="hidden md:block">
        <InkRail role={user.role} onOpenSimulator={openSimulator} />
      </aside>
      <main ref={mainRef} className="overflow-y-auto bg-paper">
        <OfflineBanner />
        {/* On client navigation Next passes `children` as a lazy element that resolves to an
            unkeyed list; as a sibling of the banner React would flag it, so it gets its own
            wrapper. */}
        <div>{children}</div>
      </main>
      <MobileDrawer
        role={user.role}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onOpenSimulator={openSimulator}
      />
      {/* OP-54: the simulator does not exist outside non-production. */}
      {IS_NON_PRODUCTION && <SimulatorPanel open={simulatorOpen} onOpenChange={setSimulatorOpen} />}
    </div>
  )
}
