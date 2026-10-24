'use client'

import { WifiOffIcon } from 'lucide-react'
import { useOnlineStatus } from '../hooks/use-online-status'

// 02 §5.6: shown while the browser is offline; queries pause and resume when back online.
export function OfflineBanner() {
  const online = useOnlineStatus()
  if (online) return null
  return (
    <p
      role="status"
      className="sticky top-0 z-10 flex items-center gap-2 border-b border-rule bg-sheet px-4 py-2 text-sm md:px-8"
    >
      <WifiOffIcon className="size-4 text-unknown" strokeWidth={1.5} aria-hidden />
      <span className="font-condensed font-semibold tracking-wider uppercase">Offline</span>
      <span className="text-ink-muted">You are offline. Data may be outdated.</span>
    </p>
  )
}
