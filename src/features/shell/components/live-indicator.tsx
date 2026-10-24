'use client'

import { useOnlineStatus } from '../hooks/use-online-status'
import { cn } from '@/lib/utils'

// DS-01, UI-03: glyph and word, never colour alone (NFR-04). Reflects the browser's online
// state; the realtime connection joins in T11.
export function LiveIndicator() {
  const online = useOnlineStatus()
  return (
    <span
      role="status"
      className={cn(
        'flex items-center gap-1.5 font-mono text-xs tracking-wider',
        online ? 'text-paper' : 'text-paper/60',
      )}
    >
      <span aria-hidden className={online ? 'text-ok' : undefined}>
        {online ? '●' : '○'}
      </span>
      {online ? 'LIVE' : 'OFFLINE'}
    </span>
  )
}
