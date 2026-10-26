'use client'

import { MenuIcon } from 'lucide-react'
import Link from 'next/link'
import type { User } from '@/domain'
import { Wordmark } from '@/components/ui/wordmark'
import { homeFor } from '@/features/session'
import { NetworkChip } from '@/features/simulator'
import { IS_NON_PRODUCTION } from '@/lib/environment'
import { AlertsBell } from './alerts-bell'
import { LiveIndicator } from './live-indicator'
import { StripClock } from './strip-clock'
import { UserMenu } from './user-menu'

interface StatusStripProps {
  user: User
  onOpenMenu: () => void
}

// DS-01, UI-03, left to right: menu button (mobile), wordmark, live indicator, clock,
// non-production chip with the network-mode warning (OP-55), bell (customer), user menu.
// Below 768 px the clock is hidden (UI-02).
export function StatusStrip({ user, onOpenMenu }: StatusStripProps) {
  return (
    <header className="col-span-full flex h-14 items-center gap-2 border-b border-paper/15 bg-ink px-2 text-paper sm:gap-4 md:px-5">
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Open navigation"
        className="inline-flex size-9 items-center justify-center rounded-xs hover:bg-paper/10 md:hidden"
      >
        <MenuIcon className="size-4" strokeWidth={1.5} aria-hidden />
      </button>
      <Link href={homeFor(user.role)} aria-label="Corvane Control Tower, home">
        <Wordmark />
      </Link>
      <div className="ml-auto flex items-center gap-2 sm:gap-4">
        <LiveIndicator />
        <StripClock className="hidden font-mono text-xs tracking-wider text-paper/80 md:inline" />
        {IS_NON_PRODUCTION && <NonProductionChip />}
        {IS_NON_PRODUCTION && <NetworkChip />}
        {user.role === 'customer' && <AlertsBell />}
        <UserMenu user={user} />
      </div>
    </header>
  )
}

function NonProductionChip() {
  return (
    <span className="rounded-xs border border-signal px-1.5 py-0.5 font-mono text-[11px] tracking-wider">
      <span className="lg:hidden">NON-PROD</span>
      <span className="hidden lg:inline">NON-PRODUCTION</span>
    </span>
  )
}
