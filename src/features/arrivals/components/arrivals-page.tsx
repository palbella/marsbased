'use client'

import { useState } from 'react'
import { perimeterLabel } from '@/domain'
import { PageHeader } from '@/components/ui/page-header'
import { useCurrentUser } from '@/features/session'
import { ProvenanceLegend } from '@/features/shipments'
import { useArrivalFilters } from '../hooks/use-arrival-filters'
import { ArrivalCounters } from './arrival-counters'
import { ArrivalFilterBar } from './arrival-filter-bar'
import { ArrivalsAgenda } from './arrivals-agenda'

const CLEARED = { q: undefined, status: undefined, onTime: undefined }

// US-C-01, CP-01..06: the customer home, an arrivals agenda.
export function ArrivalsPage() {
  const user = useCurrentUser()
  const { filters, setFilters } = useArrivalFilters()
  // Bumped to remount the uncontrolled search field when the filters are cleared.
  const [searchKey, setSearchKey] = useState(0)
  const clearFilters = () => {
    setFilters(CLEARED)
    setSearchKey((key) => key + 1)
  }
  return (
    <>
      <PageHeader
        title="Arrivals"
        subtitle={user ? perimeterLabel(user.perimeter) : undefined}
        actions={
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <ArrivalCounters filters={filters} onChange={setFilters} />
            <ProvenanceLegend />
          </div>
        }
      />
      <ArrivalFilterBar key={searchKey} filters={filters} onChange={setFilters} />
      <ArrivalsAgenda filters={filters} onClearFilters={clearFilters} />
    </>
  )
}
