import type { Alert, AlertType, Shipment } from '@/domain'

// CP-12: the alert types that open or describe a customs situation.
const CUSTOMS_ALERT_TYPES: readonly AlertType[] = ['customs_issue', 'on_hold']

// CP-12: the alert that explains an open hold or customs incident, or null when there is
// none. An alert alone can't tell whether it is still open (a release by `customs_cleared`
// creates no alert), so the shipment's status decides; other alert types (ETA changes, ops
// messages) neither show nor hide it. `alerts` are the shipment's alerts, newest first, as
// the API returns them.
export function incidentAlert(shipment: Pick<Shipment, 'status'>, alerts: Alert[]): Alert | null {
  if (shipment.status === 'on_hold') {
    return alerts.find((alert) => alert.type === 'on_hold') ?? null
  }
  const latest = alerts.find((alert) => CUSTOMS_ALERT_TYPES.includes(alert.type))
  if (latest?.type === 'customs_issue' && shipment.status === 'in_customs') return latest
  return null
}
