import {
  exceptionStatusLabels,
  exceptionTypeLabels,
  severityLabels,
  type Exception,
} from '@/domain'
import { SheetTitle } from '@/components/ui/sheet'
import { Stamp } from '@/components/ui/stamp'
import { useSimulationNow } from '@/features/simulator'
import { formatDuration, formatStamp } from '@/lib/format-date'
import { cn } from '@/lib/utils'
import { isWaitingOnOperator, severityBarClasses, StateChip } from '../exception-meta'

// OP-10: lifecycle state, severity, time open, then the reference and the reason.
export function PanelHeader({ exception }: { exception: Exception }) {
  // A resolved exception was open until it was resolved; an open one until the simulation's
  // now (BR-TM-01).
  const now = useSimulationNow()
  const openUntil = exception.resolvedAt ? new Date(exception.resolvedAt) : now
  const openFor = formatDuration(exception.detectedAt, openUntil)
  return (
    <header className="space-y-3 border-b border-rule px-4 pt-5 pr-14 pb-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <LifecycleState exception={exception} />
        <span className="inline-flex items-center gap-2 font-mono text-xs tracking-wide uppercase">
          <span aria-hidden className={cn('h-3 w-1', severityBarClasses[exception.severity])} />
          {severityLabels[exception.severity]} · open {openFor}
        </span>
        {isWaitingOnOperator(exception) && <StateChip>Waiting on operator</StateChip>}
      </div>
      <SheetTitle className="flex flex-wrap items-baseline gap-x-3">
        <span className="font-mono text-2xl font-semibold">{exception.shipmentReference}</span>
        <span className="font-condensed text-base font-semibold tracking-wider uppercase">
          {exceptionTypeLabels[exception.type]}
        </span>
      </SheetTitle>
      <p className="text-sm">{exception.reason}</p>
      {exception.resolutionNote && exception.resolvedAt && (
        <p className="text-sm text-ink-muted">
          Resolved {formatStamp(exception.resolvedAt)}: {exception.resolutionNote}
        </p>
      )}
    </header>
  )
}

// OP-10, DS-10: only the terminal state earns a stamp; open and acknowledged are chips. The
// word carries the state, never the colour alone (NFR-04).
function LifecycleState({ exception }: { exception: Exception }) {
  const label = exceptionStatusLabels[exception.status]
  if (exception.status === 'resolved') {
    return (
      <Stamp tone="ok" className="text-base">
        {label}
      </Stamp>
    )
  }
  return (
    <span className="border border-ink px-2 py-1 font-condensed text-sm leading-none font-semibold tracking-wider uppercase">
      {label}
    </span>
  )
}
