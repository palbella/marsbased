'use client'

import { useRealtimeStatus } from '@/features/realtime'
import { useOnlineStatus } from '../hooks/use-online-status'
import { cn } from '@/lib/utils'

// DS-01, UI-03: LIVE only while the browser is online and the realtime client is connected
// (02 §5.6, §7). Glyph and word, never colour alone (NFR-04).
export function LiveIndicator() {
  const online = useOnlineStatus()
  const realtime = useRealtimeStatus()
  const live = online && realtime === 'connected'
  return (
    <span
      role="status"
      className={cn(
        'flex items-center gap-1.5 font-mono text-xs tracking-wider',
        live ? 'text-paper' : 'text-paper/60',
      )}
    >
      <span aria-hidden className={live ? 'text-ok' : undefined}>
        {live ? '●' : '○'}
      </span>
      {live ? 'LIVE' : 'OFFLINE'}
    </span>
  )
}
