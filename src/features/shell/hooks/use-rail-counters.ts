'use client'

import { useQuery } from '@tanstack/react-query'
import type { Alert } from '@/domain'
import { alertsService, exceptionsService, mappingsService, queryKeys } from '@/services'
import { hasCounter, type CounterId, type NavItem } from '../navigation'

export type RailCounters = Partial<Record<CounterId, number>>

// UI-05: counters read the same queries the pages use. Only the role's counters are
// fetched; a loading or failing counter is absent, so it is hidden, never an error (02 §5.6).
export function useRailCounters(items: NavItem[]): RailCounters {
  const unreadAlerts = useQuery({
    queryKey: queryKeys.alerts.list({}),
    queryFn: ({ signal }) => alertsService.list({}, { signal }),
    enabled: hasCounter(items, 'unreadAlerts'),
    select: countUnread,
  })
  const activeExceptions = useQuery({
    queryKey: queryKeys.exceptions.list({}),
    queryFn: ({ signal }) => exceptionsService.list({}, { signal }),
    enabled: hasCounter(items, 'activeExceptions'),
    select: (exceptions) => exceptions.length,
  })
  const unmappedStatuses = useQuery({
    queryKey: queryKeys.mappings.unmapped(),
    queryFn: ({ signal }) => mappingsService.listUnmapped({ signal }),
    enabled: hasCounter(items, 'unmappedStatuses'),
    select: (unmapped) => unmapped.length,
  })
  return {
    unreadAlerts: unreadAlerts.data,
    activeExceptions: activeExceptions.data,
    unmappedStatuses: unmappedStatuses.data,
  }
}

function countUnread(alerts: Alert[]): number {
  return alerts.filter((alert) => alert.readAt === null).length
}
