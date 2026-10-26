import type { Alert } from '@/domain'
import { startOfDay } from '@/lib/calendar'
import { isUnread } from './hooks/use-alerts'

export interface AlertGroup {
  title: 'Today' | 'Earlier'
  alerts: Alert[]
}

// CP-20: *Today* / *Earlier* in the viewer's time zone, keeping the API order (newest
// first). Empty groups are left out.
export function groupAlertsByDay(alerts: Alert[], now: Date): AlertGroup[] {
  const todayStart = startOfDay(now).getTime()
  const groups: AlertGroup[] = [
    { title: 'Today', alerts: alerts.filter((alert) => Date.parse(alert.createdAt) >= todayStart) },
    {
      title: 'Earlier',
      alerts: alerts.filter((alert) => Date.parse(alert.createdAt) < todayStart),
    },
  ]
  return groups.filter((group) => group.alerts.length > 0)
}

// CP-31: unread alerts that were not in the previous data. A toast follows from the data,
// never from an event, so it fires after any refetch.
export function newUnreadAlerts(previousIds: ReadonlySet<string>, alerts: Alert[]): Alert[] {
  return alerts.filter((alert) => isUnread(alert) && !previousIds.has(alert.id))
}
