import type { Alert } from '@/domain'
import { AlertRow, type AlertTimeFormat } from './alert-row'

interface AlertListProps {
  alerts: Alert[]
  label: string
  timeFormat?: AlertTimeFormat
}

// CP-20: ruled rows on the sheet (03 §1.1).
export function AlertList({ alerts, label, timeFormat }: AlertListProps) {
  return (
    <ul aria-label={label} className="divide-y divide-rule border-y border-rule bg-sheet">
      {alerts.map((alert) => (
        <AlertRow key={alert.id} alert={alert} timeFormat={timeFormat} />
      ))}
    </ul>
  )
}
