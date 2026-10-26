'use client'

import { Search } from 'lucide-react'
import {
  destinationScopeSchema,
  modeLabels,
  modeSchema,
  onTimeIndicatorSchema,
  onTimeLabels,
  shipmentStatusLabels,
  shipmentStatusSchema,
  type DestinationScope,
} from '@/domain'
import { FilterSelect, type FilterOption } from '@/components/ui/filter-select'
import { Input } from '@/components/ui/input'
import { useReferenceData } from '@/features/exceptions'
import type { PortfolioFilters } from '../portfolio-params'

type SelectKey = 'site' | 'operator' | 'mode' | 'scope' | 'status' | 'onTime'

const SCOPE_LABELS: Record<DestinationScope, string> = {
  domestic: 'Domestic',
  international: 'International',
}

const options = <T extends string>(values: readonly T[], labels: Record<T, string>) =>
  values.map((value): FilterOption => ({ value, label: labels[value] }))

const MODE_OPTIONS = options(modeSchema.options, modeLabels)
const SCOPE_OPTIONS = options(destinationScopeSchema.options, SCOPE_LABELS)
const STATUS_OPTIONS = options(shipmentStatusSchema.options, shipmentStatusLabels)
const ON_TIME_OPTIONS = options(onTimeIndicatorSchema.options, onTimeLabels)

interface PortfolioFilterBarProps {
  filters: PortfolioFilters
  onChange: (changes: Partial<PortfolioFilters>) => void
}

interface SelectSpec {
  key: SelectKey
  label: string
  emptyLabel: string
  options: FilterOption[]
}

// OP-21: site, operator, mode, destination type, status, on-time and reference search. Site
// and operator options come from `GET /api/reference`, so they only list the perimeter.
export function PortfolioFilterBar({ filters, onChange }: PortfolioFilterBarProps) {
  const reference = useReferenceData()
  const selects: SelectSpec[] = [
    { key: 'site', label: 'Site', emptyLabel: 'All sites', options: toOptions(reference.data?.sites) },
    { key: 'operator', label: 'Operator', emptyLabel: 'All operators', options: toOptions(reference.data?.operators) },
    { key: 'mode', label: 'Mode', emptyLabel: 'All modes', options: MODE_OPTIONS },
    { key: 'scope', label: 'Destination', emptyLabel: 'All destinations', options: SCOPE_OPTIONS },
    { key: 'status', label: 'Status', emptyLabel: 'All statuses', options: STATUS_OPTIONS },
    { key: 'onTime', label: 'On-time', emptyLabel: 'All', options: ON_TIME_OPTIONS },
  ] // prettier-ignore
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-rule px-4 py-3 md:px-8">
      <SearchField value={filters.q} onChange={(q) => onChange({ q })} />
      {selects.map(({ key, ...select }) => (
        <FilterSelect
          key={key}
          {...select}
          value={filters[key]}
          onChange={(value) => onChange(parseChange(key, value))}
        />
      ))}
    </div>
  )
}

function SearchField({
  value,
  onChange,
}: {
  value: string | undefined
  onChange: (q: string | undefined) => void
}) {
  return (
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
        defaultValue={value}
        placeholder="Search reference…"
        className="pl-9 font-mono"
        onChange={(event) => onChange(event.target.value.trim() || undefined)}
      />
    </label>
  )
}

function toOptions(items: { id: string; name: string }[] = []): FilterOption[] {
  return items.map(({ id, name }) => ({ value: id, label: name }))
}

function parseChange(key: SelectKey, value: string): Partial<PortfolioFilters> {
  if (key === 'mode') return { mode: modeSchema.safeParse(value).data }
  if (key === 'scope') return { scope: destinationScopeSchema.safeParse(value).data }
  if (key === 'status') return { status: shipmentStatusSchema.safeParse(value).data }
  if (key === 'onTime') return { onTime: onTimeIndicatorSchema.safeParse(value).data }
  return { [key]: value || undefined }
}
