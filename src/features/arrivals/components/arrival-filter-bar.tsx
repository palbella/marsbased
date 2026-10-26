'use client'

import { Search } from 'lucide-react'
import { shipmentStatusLabels, type ShipmentView } from '@/domain'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { activeStatusSchema, statusOptions, type ArrivalFilters } from '../arrival-filters'

const VIEWS: { value: ShipmentView; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'delivered', label: 'Delivered (last 7 days)' },
]

interface ArrivalFilterBarProps {
  filters: ArrivalFilters
  onChange: (changes: Partial<ArrivalFilters>) => void
}

// CP-04: search by reference, status filter and the Active / Delivered switch.
export function ArrivalFilterBar({ filters, onChange }: ArrivalFilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-rule px-4 py-3 md:px-8">
      <label className="relative w-full sm:w-64">
        <span className="sr-only">Search reference</span>
        <Search
          aria-hidden
          strokeWidth={1.5}
          className="absolute top-3 left-3 size-4 text-ink-muted"
        />
        <Input
          type="search"
          // Uncontrolled, so typing never waits for the URL; the page remounts it to clear it.
          defaultValue={filters.q}
          placeholder="Search reference…"
          className="pl-9 font-mono"
          onChange={(event) => onChange({ q: event.target.value.trim() || undefined })}
        />
      </label>
      {filters.view === 'active' && <StatusSelect filters={filters} onChange={onChange} />}
      <ViewSwitch view={filters.view} onChange={onChange} />
    </div>
  )
}

function StatusSelect({ filters, onChange }: ArrivalFilterBarProps) {
  return (
    <label className="flex items-center gap-2">
      <span className="field-label">Status</span>
      <select
        value={filters.status ?? ''}
        onChange={(event) =>
          onChange({ status: activeStatusSchema.safeParse(event.target.value).data })
        }
        className="h-10 rounded-xs border border-rule bg-sheet px-2 text-sm text-ink"
      >
        <option value="">All</option>
        {statusOptions.map((status) => (
          <option key={status} value={status}>
            {shipmentStatusLabels[status]}
          </option>
        ))}
      </select>
    </label>
  )
}

function ViewSwitch({
  view,
  onChange,
}: {
  view: ShipmentView
  onChange: ArrivalFilterBarProps['onChange']
}) {
  return (
    <div role="group" aria-label="View" className="flex rounded-xs border border-ink">
      {VIEWS.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={view === option.value}
          // The status and on-time filters belong to the active view.
          onClick={() => onChange({ view: option.value, status: undefined, onTime: undefined })}
          className={cn(
            'h-9 px-3 font-condensed text-xs font-semibold tracking-wider uppercase',
            view === option.value ? 'bg-ink text-paper' : 'text-ink hover:bg-sheet',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
