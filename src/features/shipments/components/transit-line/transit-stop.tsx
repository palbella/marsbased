'use client'

import { hasOpenHold, stopMilestones, stopState, type TransitStop as Stop } from '@/domain'
import { Tooltip } from '@/components/ui/tooltip'
import { formatDayTime } from '@/lib/format-date'
import { cn } from '@/lib/utils'
import { useHighlightTarget } from '../../highlight/highlight-context'
import { stopAnchor, stopDate, stopLabel, stopStatusText } from './stop-facts'

interface TransitStopProps {
  stop: Stop
  current: boolean
}

// SC-04 full: a focusable stop. Its tooltip and accessible name say what the glyph shows.
export function TransitStop({ stop, current }: TransitStopProps) {
  const first = stopMilestones(stop)[0]
  const { highlighted, handlers } = useHighlightTarget(
    stopAnchor(stop),
    first ? { kind: 'milestone', id: first.id } : null,
  )
  const date = stopDate(stop)
  const description = `${stopLabel(stop)}: ${stopStatusText(stop)}${current ? ', current position' : ''}`
  return (
    <Tooltip
      content={
        <>
          <span className="block font-semibold">{description}</span>
          {date && <span className="block font-mono">{formatDayTime(date.value)}</span>}
        </>
      }
    >
      <button
        type="button"
        aria-label={description}
        data-highlighted={highlighted || undefined}
        className={cn(
          'relative z-10 flex size-7 items-center justify-center rounded-xs',
          highlighted && 'bg-signal/25',
        )}
        {...handlers}
      >
        <StopGlyph stop={stop} current={current} />
      </button>
    </Tooltip>
  )
}

const circleClasses = {
  done: 'fill-ink stroke-ink',
  not_reported: 'fill-paper stroke-ink',
  overdue: 'fill-paper stroke-late',
  pending: 'fill-paper stroke-ink-muted',
}

function StopGlyph({ stop, current }: TransitStopProps) {
  const state = stopState(stop)
  if (stop.kind === 'customs' && hasOpenHold(stop.holds))
    return <HeldCustomsGlyph current={current} />
  if (current) {
    return (
      <svg aria-hidden viewBox="-8 -8 16 16" className="size-4" data-glyph="current">
        <rect x={-6} y={-6} width={12} height={12} className="fill-signal" />
      </svg>
    )
  }
  if (stop.kind === 'customs') {
    return (
      <svg aria-hidden viewBox="-8 -8 16 16" className="size-4" data-glyph="customs">
        <rect
          x={-4.5}
          y={-4.5}
          width={9}
          height={9}
          transform="rotate(45)"
          strokeWidth={1.5}
          className={circleClasses[state]}
        />
      </svg>
    )
  }
  return (
    <svg aria-hidden viewBox="-8 -8 16 16" className="size-4" data-glyph={state}>
      <circle
        r={4.5}
        strokeWidth={state === 'overdue' ? 2.5 : 1.5}
        className={circleClasses[state]}
      />
    </svg>
  )
}

// SC-04: an open hold outlines the customs stop in `--late`, with the position marker inside
// it when the shipment is there; the label says "on hold" in words.
function HeldCustomsGlyph({ current }: { current: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="-9 -9 18 18"
      className="size-[18px]"
      data-glyph="hold"
      data-current={current || undefined}
    >
      <rect
        x={-5.5}
        y={-5.5}
        width={11}
        height={11}
        transform="rotate(45)"
        strokeWidth={2.5}
        className="fill-paper stroke-late"
      />
      {current && <rect x={-3} y={-3} width={6} height={6} className="fill-signal" />}
    </svg>
  )
}
