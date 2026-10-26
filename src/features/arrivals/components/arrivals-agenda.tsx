'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { Button, buttonClasses } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { LoadingState } from '@/components/ui/loading-state'
import { useQueryFailure } from '@/components/ui/use-query-failure'
import { isUnread, useAlerts } from '@/features/alerts'
import { useShipments } from '@/features/shipments'
import { hasNarrowingFilters, toShipmentFilters, type ArrivalFilters } from '../arrival-filters'
import { useSimulationNow } from '@/features/simulator'
import { deliveredArrivals, groupArrivals } from '../arrival-groups'
import { ArrivalRow } from './arrival-row'

interface ArrivalsAgendaProps {
  filters: ArrivalFilters
  onClearFilters: () => void
}

// CP-02, CP-06: the agenda with its loading, empty and error states.
export function ArrivalsAgenda({ filters, onClearFilters }: ArrivalsAgendaProps) {
  const shipments = useShipments(toShipmentFilters(filters))
  const unreadShipmentIds = useUnreadShipmentIds()
  // BR-TM-01: Today and Tomorrow by the simulation clock.
  const now = useSimulationNow()
  const failure = useQueryFailure(shipments)
  if (failure) return <ErrorState retrying={failure.retrying} onRetry={() => shipments.refetch()} />
  if (!shipments.isSuccess) return <LoadingState label="Loading arrivals" />
  if (shipments.data.length === 0) {
    return <NoArrivals filters={filters} onClearFilters={onClearFilters} />
  }
  const groups =
    filters.view === 'delivered'
      ? [deliveredArrivals(shipments.data)]
      : groupArrivals(shipments.data, now)
  return (
    <div className="space-y-6 py-6 md:px-8">
      {groups.map((group) => (
        <section key={group.id} aria-labelledby={`arrivals-${group.id}`}>
          <h2 id={`arrivals-${group.id}`} className="field-label mb-2 px-4 md:px-0">
            {group.title}
          </h2>
          <ul
            aria-label={group.title}
            className="divide-y divide-rule border-y border-rule bg-sheet"
          >
            {group.shipments.map((shipment) => (
              <ArrivalRow
                key={shipment.id}
                shipment={shipment}
                hasUnreadAlert={unreadShipmentIds.has(shipment.id)}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

// CP-03: shared with the bell; while alerts load or fail, rows simply show no marker.
function useUnreadShipmentIds(): ReadonlySet<string> {
  const { data } = useAlerts()
  return useMemo(
    () => new Set((data ?? []).filter(isUnread).map((alert) => alert.shipmentId)),
    [data],
  )
}

// CP-06: `NOTHING IN TRANSIT` with a link to *Delivered*.
function NoArrivals({ filters, onClearFilters }: ArrivalsAgendaProps) {
  if (hasNarrowingFilters(filters)) {
    return (
      <EmptyState
        stamp="NO MATCHES"
        message="No shipment matches these filters."
        action={
          <Button variant="secondary" onClick={onClearFilters}>
            Clear filters
          </Button>
        }
      />
    )
  }
  if (filters.view === 'delivered') {
    return (
      <EmptyState
        stamp="NOTHING DELIVERED"
        message="No deliveries in the last 7 days."
        action={<EmptyLink href="/portal">Active shipments</EmptyLink>}
      />
    )
  }
  return (
    <EmptyState
      stamp="NOTHING IN TRANSIT"
      message="You have no active shipments right now."
      action={<EmptyLink href="/portal?view=delivered">Delivered (last 7 days)</EmptyLink>}
    />
  )
}

function EmptyLink({ href, children }: { href: string; children: string }) {
  return (
    <Link href={href} className={buttonClasses('secondary')}>
      {children}
    </Link>
  )
}
