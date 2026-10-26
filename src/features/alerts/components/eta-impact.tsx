import type { EtaImpact as EtaImpactValue, EtaImpactDate } from '@/domain'
import { SourcedDate, type OperatorNames } from '@/features/shipments'

// BR-AL-03: old → new ETA, each with its provenance; a null side is an honest "Unknown".
export function EtaImpact({ impact }: { impact: EtaImpactValue }) {
  return (
    <p className="flex flex-wrap items-baseline gap-x-2 text-sm text-ink">
      <span className="field-label">ETA</span>
      <ImpactDate date={impact.previousEta} />
      <span aria-label="changed to">→</span>
      <ImpactDate date={impact.newEta} />
    </p>
  )
}

function ImpactDate({ date }: { date: EtaImpactDate | null }) {
  if (date === null) return <span className="text-unknown">Unknown</span>
  // P1: the alert names its operator, so the tooltip reads "Estimated by BlueWave".
  const operators: OperatorNames = date.operatorName ? { [date.source]: date.operatorName } : {}
  return <SourcedDate date={date} precision="day" operators={operators} className="relative z-10" />
}
