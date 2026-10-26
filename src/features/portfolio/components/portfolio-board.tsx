'use client'

import { ArrowDown, ArrowUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { LoadingState } from '@/components/ui/loading-state'
import { useQueryFailure } from '@/components/ui/use-query-failure'
import { useShipments } from '@/features/shipments'
import { hasPortfolioFilters, type PortfolioParams, type SortKey } from '../portfolio-params'
import { sortPortfolio } from '../portfolio-sort'
import { PortfolioRow } from './portfolio-row'

interface PortfolioBoardProps extends PortfolioParams {
  onSort: (key: SortKey) => void
  onClearFilters: () => void
}

// OP-20..23: every shipment in the perimeter (`GET /api/shipments`, both views), in the API
// order unless a column sort is chosen.
export function PortfolioBoard({ filters, sort, onSort, onClearFilters }: PortfolioBoardProps) {
  const shipments = useShipments(filters)
  const failure = useQueryFailure(shipments)
  if (failure) return <ErrorState retrying={failure.retrying} onRetry={() => shipments.refetch()} />
  if (!shipments.isSuccess) return <LoadingState label="Loading shipments" rows={8} />
  if (shipments.data.length === 0) {
    return <EmptyBoard filtered={hasPortfolioFilters(filters)} onClearFilters={onClearFilters} />
  }
  const header = (label: string, key?: SortKey) => (
    <ColumnHeader label={label} sortKey={key} sort={sort} onSort={onSort} />
  )
  return (
    <table className="block w-full border-collapse bg-sheet text-ink md:table">
      <caption className="sr-only">Shipments</caption>
      <thead className="hidden border-b border-rule md:table-header-group">
        <tr>
          {header('Ref')}
          {header('Account')}
          {header('Origin')}
          {header('Destination')}
          {header('Route')}
          {header('Status', 'status')}
          {header('On-time', 'onTime')}
          {header('ETA', 'eta')}
          {header('Exc')}
        </tr>
      </thead>
      <tbody className="block md:table-row-group">
        {sortPortfolio(shipments.data, sort).map((shipment) => (
          <PortfolioRow key={shipment.id} shipment={shipment} />
        ))}
      </tbody>
    </table>
  )
}

interface ColumnHeaderProps {
  label: string
  sortKey?: SortKey
  sort: PortfolioParams['sort']
  onSort: (key: SortKey) => void
}

// OP-22: sortable headers say their order to assistive technology through `aria-sort`.
function ColumnHeader({ label, sortKey, sort, onSort }: ColumnHeaderProps) {
  const classes = 'field-label px-3 py-2 text-left font-normal'
  if (!sortKey) {
    return (
      <th scope="col" className={classes}>
        {label}
      </th>
    )
  }
  const direction = sort?.key === sortKey ? sort.direction : null
  const Arrow = direction === 'desc' ? ArrowDown : ArrowUp
  return (
    <th scope="col" aria-sort={ariaSort(direction)} className={classes}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="inline-flex items-center gap-1 rounded-xs uppercase hover:text-ink"
      >
        {label}
        {direction && <Arrow aria-hidden className="size-3" strokeWidth={1.5} />}
      </button>
    </th>
  )
}

function ariaSort(direction: 'asc' | 'desc' | null): 'ascending' | 'descending' | 'none' {
  if (direction === 'asc') return 'ascending'
  if (direction === 'desc') return 'descending'
  return 'none'
}

function EmptyBoard({
  filtered,
  onClearFilters,
}: {
  filtered: boolean
  onClearFilters: () => void
}) {
  if (!filtered) {
    return (
      <EmptyState stamp="NOTHING IN TRANSIT" message="There are no shipments in your perimeter." />
    )
  }
  return (
    <EmptyState
      stamp="NO MATCHES"
      message="No shipments match these filters."
      action={
        <Button variant="secondary" onClick={onClearFilters}>
          Clear filters
        </Button>
      }
    />
  )
}
