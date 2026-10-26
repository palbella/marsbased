'use client'

import { OctagonAlert } from 'lucide-react'
import type { Shipment } from '@/domain'
import { useAlerts } from '@/features/alerts'
import { incidentAlert } from '../incident-notice'

// CP-12: a ruled notice under the header for an open hold or customs incident, in the
// alert's own words (BR-AL-03), saying whether the customer needs to do anything. While the
// alerts load or fail, the notice is simply absent; the ON HOLD stamp still shows the state.
export function IncidentNotice({ shipment }: { shipment: Shipment }) {
  const { data: alerts } = useAlerts({ shipmentId: shipment.id })
  const alert = alerts ? incidentAlert(shipment, alerts) : null
  if (!alert) return null
  return (
    <div
      role="status"
      className="flex items-start gap-2 border-y border-late bg-sheet px-4 py-2.5 text-sm text-ink md:px-8"
    >
      <OctagonAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-late" strokeWidth={1.5} />
      <p>
        <span className="font-semibold">{alert.title}.</span> {alert.message}{' '}
        <span className="font-semibold">
          {alert.requiresAction ? 'Action needed from you.' : 'No action needed from you.'}
        </span>
      </p>
    </div>
  )
}
