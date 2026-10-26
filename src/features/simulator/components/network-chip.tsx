'use client'

import { TriangleAlert } from 'lucide-react'
import { failureModeLabels } from '@/domain'
import { useNetworkConditions } from '../hooks/use-simulator'

// OP-55, UI-03: while the network mode is not Normal the strip says so, so nobody forgets it
// is on. Icon and words, never colour alone (NFR-04).
export function NetworkChip() {
  const network = useNetworkConditions()
  const mode = network.data?.mode
  if (!mode || mode === 'normal') return null
  return (
    <span
      role="status"
      className="inline-flex items-center gap-1 rounded-xs bg-signal px-1.5 py-0.5 font-mono text-[11px] tracking-wider text-ink uppercase"
    >
      <TriangleAlert aria-hidden className="size-3" strokeWidth={2} />
      <span className="sr-only">Network mode: </span>
      {failureModeLabels[mode]}
    </span>
  )
}
