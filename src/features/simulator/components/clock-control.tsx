'use client'

import { Button } from '@/components/ui/button'
import { useAdvanceClock } from '../hooks/use-simulator'
import { useSimulationClock } from '../hooks/use-simulation-clock'
import { PanelSection } from './panel-section'

// OP-52: the steps the panel offers.
const CLOCK_STEPS_HOURS = [2, 6]

// OP-52, BR-TM-01: the offset and the buttons that move the clock forward; the engine runs
// for every shipment at the new time (BR-EX-10).
export function ClockControl() {
  const clock = useSimulationClock()
  const advance = useAdvanceClock()
  const offset = clockLabel(clock.data?.offsetHours, clock.isError)
  return (
    <PanelSection
      title="Clock"
      aside={
        <span className="font-mono text-sm" aria-live="polite">
          {offset}
        </span>
      }
    >
      <div className="flex flex-wrap gap-2">
        {CLOCK_STEPS_HOURS.map((hours) => (
          <Button
            key={hours}
            size="small"
            variant="secondary"
            disabled={advance.isPending}
            onClick={() => advance.mutate(hours)}
            aria-label={`Advance the clock ${hours} hours`}
          >
            +{hours} h
          </Button>
        ))}
      </div>
      {advance.isError && (
        <p role="alert" className="text-xs text-late">
          The clock could not be moved. Try again.
        </p>
      )}
    </PanelSection>
  )
}

function clockLabel(offsetHours: number | undefined, failed: boolean): string {
  if (offsetHours !== undefined) return `now + ${offsetHours} h`
  return failed ? 'Clock unavailable' : 'now + … h'
}
