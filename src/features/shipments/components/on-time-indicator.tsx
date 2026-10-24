'use client'

import {
  onTimeLabels,
  onTimeReason,
  type OnTimeIndicator as OnTimeIndicatorValue,
  type PredictionFact,
  type Shipment,
} from '@/domain'
import { Tooltip } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

const markerClasses: Record<OnTimeIndicatorValue, string> = {
  on_time: 'bg-ok',
  at_risk: 'bg-risk',
  late: 'bg-late',
  unknown: 'bg-unknown',
}

interface OnTimeIndicatorProps {
  shipment: Pick<Shipment, 'onTime' | 'status' | 'eta' | 'plannedEta'>
  prediction?: PredictionFact | null
  // T11 replaces the browser clock with the simulation clock.
  now?: Date
  className?: string
}

// SC-02: a square marker and a word, never colour alone (NFR-04); the reason on hover/focus.
export function OnTimeIndicator({
  shipment,
  prediction = null,
  now = new Date(),
  className,
}: OnTimeIndicatorProps) {
  const reason = onTimeReason(shipment, prediction, now)
  return (
    <Tooltip content={reason}>
      <span
        tabIndex={0}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-xs text-sm whitespace-nowrap text-ink',
          className,
        )}
      >
        <span aria-hidden className={cn('size-2.5 shrink-0', markerClasses[shipment.onTime])} />
        {onTimeLabels[shipment.onTime]}
      </span>
    </Tooltip>
  )
}
