'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Alert, AlertFilters } from '@/domain'
import { monitoring } from '@/lib/monitoring'
import { alertsService, queryKeys } from '@/services'

// CP-23, UI-05: the bell, the rail counter and the pages share this query.
export function alertsQuery(filters: AlertFilters) {
  return {
    queryKey: queryKeys.alerts.list(filters),
    queryFn: ({ signal }: { signal: AbortSignal }) => alertsService.list(filters, { signal }),
  }
}

// CP-20: newest first, as the API returns them.
export function useAlerts(filters: AlertFilters = {}) {
  return useQuery(alertsQuery(filters))
}

// CP-21: the read alert replaces its copy in every cached list at once, so the bell and the
// rail counter drop without waiting for the refetch.
export function useMarkAlertRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (alertId: string) => alertsService.markRead(alertId),
    onSuccess: (updated) => {
      queryClient.setQueriesData<Alert[]>({ queryKey: queryKeys.alerts.all() }, (alerts) =>
        alerts?.map((alert) => (alert.id === updated.id ? updated : alert)),
      )
      return queryClient.invalidateQueries({ queryKey: queryKeys.alerts.all() })
    },
    onError: (error) => monitoring.captureException(error, { tags: { area: 'alerts' } }),
  })
}

export function isUnread(alert: Alert): boolean {
  return alert.readAt === null
}
