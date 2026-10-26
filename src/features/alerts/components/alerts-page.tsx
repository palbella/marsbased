'use client'

import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { LoadingState } from '@/components/ui/loading-state'
import { PageHeader } from '@/components/ui/page-header'
import { useQueryFailure } from '@/components/ui/use-query-failure'
import { groupAlertsByDay } from '../alert-groups'
import { useSimulationNow } from '@/features/simulator'
import { useAlerts } from '../hooks/use-alerts'
import { AlertList } from './alert-list'

// US-C-04, CP-20..21, CP-23. "Mark all as read" (CP-22) comes in T17.
export function AlertsPage() {
  return (
    <>
      <PageHeader title="Alerts" subtitle="Changes to your shipments" />
      <AlertGroups />
    </>
  )
}

function AlertGroups() {
  const alerts = useAlerts()
  // BR-TM-01: Today and Yesterday by the simulation clock.
  const now = useSimulationNow()
  const failure = useQueryFailure(alerts)
  if (failure) return <ErrorState retrying={failure.retrying} onRetry={() => alerts.refetch()} />
  if (!alerts.isSuccess) return <LoadingState label="Loading alerts" />
  if (alerts.data.length === 0) {
    return <EmptyState stamp="ALL CLEAR" message="No alerts about your shipments." />
  }
  const groups = groupAlertsByDay(alerts.data, now)
  return (
    <div className="space-y-6 py-6 md:px-8">
      {groups.map((group) => (
        <section key={group.title} aria-labelledby={`alerts-${group.title}`}>
          <h2 id={`alerts-${group.title}`} className="field-label mb-2 px-4 md:px-0">
            {group.title}
          </h2>
          <AlertList
            alerts={group.alerts}
            label={`${group.title} alerts`}
            timeFormat={group.title === 'Today' ? 'time' : 'day'}
          />
        </section>
      ))}
    </div>
  )
}
