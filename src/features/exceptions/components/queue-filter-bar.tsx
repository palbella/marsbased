'use client'

import {
  exceptionStatusFilterSchema,
  modeLabels,
  modeSchema,
  type ExceptionStatusFilter,
} from '@/domain'
import { FilterSelect, type FilterOption as Option } from '@/components/ui/filter-select'
import { useReferenceData } from '../hooks/use-exceptions'
import type { QueueFilters } from '../queue-filters'

type FilterKey = 'site' | 'operator' | 'mode' | 'status'

const MODE_OPTIONS: Option[] = modeSchema.options.map((mode) => ({
  value: mode,
  label: modeLabels[mode],
}))

// OP-01: `active` (open + acknowledged) is the default, so it is the empty value.
const STATUS_LABELS: Record<ExceptionStatusFilter, string> = {
  active: 'Open + acknowledged',
  resolved: 'Resolved',
  all: 'All',
}
const STATUS_OPTIONS: Option[] = exceptionStatusFilterSchema.options
  .filter((status) => status !== 'active')
  .map((status) => ({ value: status, label: STATUS_LABELS[status] }))

interface QueueFilterBarProps {
  filters: QueueFilters
  onChange: (changes: Partial<QueueFilters>) => void
}

// OP-04: site, operator, mode and status; the options come from `GET /api/reference`, so
// they only list what is in the perimeter. The type filter is the header counters.
export function QueueFilterBar({ filters, onChange }: QueueFilterBarProps) {
  const reference = useReferenceData()
  const sites = toOptions(reference.data?.sites)
  const operators = toOptions(reference.data?.operators)
  const set = (key: FilterKey) => (value: string) => onChange(parseChange(key, value))
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-rule px-4 py-3 md:px-8">
      <FilterSelect
        label="Site"
        emptyLabel="All sites"
        value={filters.site}
        options={sites}
        onChange={set('site')}
      />
      <FilterSelect
        label="Operator"
        emptyLabel="All operators"
        value={filters.operator}
        options={operators}
        onChange={set('operator')}
      />
      <FilterSelect
        label="Mode"
        emptyLabel="All modes"
        value={filters.mode}
        options={MODE_OPTIONS}
        onChange={set('mode')}
      />
      <FilterSelect
        label="Status"
        emptyLabel={STATUS_LABELS.active}
        value={filters.status === 'active' ? undefined : filters.status}
        options={STATUS_OPTIONS}
        onChange={set('status')}
      />
    </div>
  )
}

function toOptions(items: { id: string; name: string }[] = []): Option[] {
  return items.map(({ id, name }) => ({ value: id, label: name }))
}

function parseChange(key: FilterKey, value: string): Partial<QueueFilters> {
  if (key === 'mode') return { mode: modeSchema.safeParse(value).data }
  if (key === 'status') return { status: exceptionStatusFilterSchema.safeParse(value).data }
  return { [key]: value || undefined }
}
