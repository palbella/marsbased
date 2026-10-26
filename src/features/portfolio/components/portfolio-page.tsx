'use client'

import { useState } from 'react'
import { perimeterLabel } from '@/domain'
import { FilterSelect, type FilterOption } from '@/components/ui/filter-select'
import { PageHeader } from '@/components/ui/page-header'
import { useCurrentUser } from '@/features/session'
import { ProvenanceLegend } from '@/features/shipments'
import { usePortfolioParams } from '../hooks/use-portfolio-params'
import { sortKeySchema, type PortfolioSort } from '../portfolio-params'
import { PortfolioBoard } from './portfolio-board'
import { PortfolioFilterBar } from './portfolio-filter-bar'

const SORT_OPTIONS: FilterOption[] = [
  { value: 'eta', label: 'ETA' },
  { value: 'status', label: 'Status' },
  { value: 'onTime', label: 'On-time' },
]

// US-O-02, OP-20..23: every shipment in the perimeter as a dense board.
export function PortfolioPage() {
  const user = useCurrentUser()
  const portfolio = usePortfolioParams()
  // Bumped to remount the uncontrolled search field when the filters are cleared.
  const [searchKey, setSearchKey] = useState(0)
  const clearFilters = () => {
    portfolio.clearFilters()
    setSearchKey((key) => key + 1)
  }
  return (
    <>
      <PageHeader
        title="Shipments"
        subtitle={user ? `Ops · ${perimeterLabel(user.perimeter)}` : undefined}
        actions={<ProvenanceLegend />}
      />
      <PortfolioFilterBar
        key={searchKey}
        filters={portfolio.filters}
        onChange={portfolio.setFilters}
      />
      <div className="border-b border-rule px-4 py-3 md:hidden">
        <MobileSort sort={portfolio.sort} onChange={portfolio.setSort} />
      </div>
      <PortfolioBoard
        filters={portfolio.filters}
        sort={portfolio.sort}
        onSort={portfolio.sortBy}
        onClearFilters={clearFilters}
      />
    </>
  )
}

// OP-23: the column headers are hidden below 768 px, so the sort is a select there.
function MobileSort({
  sort,
  onChange,
}: {
  sort: PortfolioSort | null
  onChange: (sort: PortfolioSort | null) => void
}) {
  const choose = (value: string) => {
    const key = sortKeySchema.safeParse(value).data
    onChange(key ? { key, direction: 'asc' } : null)
  }
  return (
    <FilterSelect
      label="Sort"
      emptyLabel="Attention first"
      value={sort?.key}
      options={SORT_OPTIONS}
      onChange={choose}
    />
  )
}
