'use client'

import Link from 'next/link'
import { isPredictedRisk, statusSentence, type Shipment } from '@/domain'
import { usePredictionFact } from '@/features/ai'
import { OnTimeIndicator, SourcedDate, TransitLine, operatorNames } from '@/features/shipments'
import { formatDay } from '@/lib/format-date'

interface ArrivalRowProps {
  shipment: Shipment
  hasUnreadAlert: boolean
}

// CP-03, DS-09: one answer per row, led by the ETA. The reference link is stretched over the
// row (CP-05), so the dates and the on-time indicator keep their own tooltips.
export function ArrivalRow({ shipment, hasUnreadAlert }: ArrivalRowProps) {
  const { destination } = shipment
  // CP-03, BR-OT-01: only a row at risk because of the AI loads its prediction; while it
  // loads or if it fails, the row reads the status label.
  const prediction = usePredictionFact(shipment.id, { enabled: isPredictedRisk(shipment) })
  return (
    <li className="relative grid min-h-16 grid-cols-1 gap-x-6 gap-y-2 px-4 py-3 hover:bg-paper sm:grid-cols-[9rem_minmax(0,1fr)] md:px-6">
      <ArrivalEta shipment={shipment} />
      <div className="min-w-0 space-y-2">
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <Link
            href={`/portal/shipments/${shipment.id}`}
            className="font-mono text-sm font-medium after:absolute after:inset-0"
          >
            {shipment.reference}
          </Link>
          <span className="text-sm text-ink-muted">
            {shipment.originSiteName} → {destination.city}, {destination.country}
          </span>
          <OnTimeIndicator shipment={shipment} prediction={prediction} className="relative z-10" />
          {hasUnreadAlert && <UnreadAlertMarker />}
        </p>
        <div className="flex flex-col gap-1 md:flex-row md:items-center md:gap-4">
          <TransitLine variant="compact" shipment={shipment} className="w-full max-w-xs shrink-0" />
          <p className="text-sm text-ink">{statusSentence(shipment, prediction, formatDay)}</p>
        </div>
      </div>
    </li>
  )
}

function ArrivalEta({ shipment }: { shipment: Shipment }) {
  const { eta } = shipment
  const classes = 'font-condensed text-xl leading-tight font-semibold uppercase'
  if (eta === null) return <span className={`${classes} text-unknown`}>Unknown</span>
  return (
    <SourcedDate
      date={eta}
      precision="day"
      operators={operatorNames(shipment.legs)}
      outdated={eta.outdated}
      lastUpdatedAt={shipment.lastEventAt}
      className={`relative z-10 self-start ${classes}`}
    />
  )
}

// CP-03: a marker and a word, never colour alone (NFR-04).
function UnreadAlertMarker() {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-ink">
      <span aria-hidden className="size-2 rounded-full bg-signal" />
      Unread alert
    </span>
  )
}
