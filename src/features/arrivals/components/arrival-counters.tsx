'use client'

import type { OnTimeIndicator, Shipment } from '@/domain'
import { useShipments } from '@/features/shipments'
import { cn } from '@/lib/utils'
import type { ArrivalFilters } from '../arrival-filters'

type CounterValue = OnTimeIndicator | 'active'

const COUNTERS: { value: CounterValue; label: string }[] = [
  { value: 'active', label: 'active' },
  { value: 'on_time', label: 'on time' },
  { value: 'at_risk', label: 'at risk' },
  { value: 'late', label: 'late' },
]

const ACTIVE_ONLY = { view: 'active' } as const

interface ArrivalCountersProps {
  filters: ArrivalFilters
  onChange: (changes: Partial<ArrivalFilters>) => void
}

// CP-01: compact counters in the page header, from the unfiltered active list, so they
// don't move while filtering. Each one filters the list; *active* clears the filter. Like any
// counter, they are hidden while loading or on failure (02 §5.6).
export function ArrivalCounters({ filters, onChange }: ArrivalCountersProps) {
  const { data: shipments } = useShipments(ACTIVE_ONLY)
  if (!shipments) return null
  const selected: CounterValue | null =
    filters.view === 'delivered' ? null : (filters.onTime ?? 'active')
  return (
    <ul
      aria-label="Filter by on-time status"
      className="flex flex-wrap items-center font-mono text-sm"
    >
      {COUNTERS.map(({ value, label }, index) => (
        <li key={value} className="flex items-center whitespace-nowrap">
          {index > 0 && (
            <span aria-hidden className="px-1.5 text-ink-muted">
              ·
            </span>
          )}
          <button
            type="button"
            aria-pressed={selected === value}
            onClick={() =>
              onChange({ view: 'active', onTime: value === 'active' ? undefined : value })
            }
            className={cn(
              'rounded-xs px-1 tabular-nums hover:bg-sheet',
              selected === value && 'underline decoration-signal decoration-2 underline-offset-4',
            )}
          >
            {countOf(shipments, value)} {label}
          </button>
        </li>
      ))}
    </ul>
  )
}

function countOf(shipments: Shipment[], value: CounterValue): number {
  if (value === 'active') return shipments.length
  return shipments.filter((shipment) => shipment.onTime === value).length
}
