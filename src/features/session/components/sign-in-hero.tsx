import { Wordmark } from '@/components/ui/wordmark'
import { cn } from '@/lib/utils'

// UI-06: the ink panel. The transit line (DS-04) is a fixed illustration of the product's
// signature, drawn once on load; `animate-draw-line` skips it with prefers-reduced-motion.
export function SignInHero({ className }: { className?: string }) {
  return (
    <section
      aria-label="Corvane Control Tower"
      className={cn('flex-col justify-center gap-14 bg-ink px-12 py-16 text-paper', className)}
    >
      <Wordmark layout="stacked" />
      <HeroTransitLine />
      <p className="font-condensed text-2xl font-medium">Every shipment, one view.</p>
    </section>
  )
}

const LINE_Y = 20
const LABEL_Y = 52
const STOP_RADIUS = 5
const STOPS = [
  { x: 12, label: 'Zaragoza', anchor: 'start' },
  { x: 120, label: 'Valencia', anchor: 'middle' },
  { x: 348, label: 'Veracruz', anchor: 'end' },
] as const
const CURRENT_X = 200
const CUSTOMS_X = 272

// Confirmed legs solid, planned dashed, current position a `--signal` square, customs a
// stamp-shaped stop (DS-04).
function HeroTransitLine() {
  return (
    <svg viewBox="0 0 360 64" className="w-full max-w-md" aria-hidden>
      <g className="animate-draw-line">
        <line
          x1={12}
          y1={LINE_Y}
          x2={CURRENT_X}
          y2={LINE_Y}
          className="stroke-paper"
          strokeWidth={3}
        />
        <line
          x1={CURRENT_X}
          y1={LINE_Y}
          x2={348}
          y2={LINE_Y}
          className="stroke-paper/60"
          strokeWidth={3}
          strokeDasharray="6 6"
        />
        <HeroStops />
        {STOPS.map((stop) => (
          <text
            key={stop.label}
            x={stop.x}
            y={LABEL_Y}
            textAnchor={stop.anchor}
            className="fill-paper/70 font-mono text-[11px]"
          >
            {stop.label}
          </text>
        ))}
      </g>
    </svg>
  )
}

// Two confirmed stops, the current position, the customs stamp and the destination.
function HeroStops() {
  return (
    <>
      <circle cx={12} cy={LINE_Y} r={STOP_RADIUS} className="fill-paper" />
      <circle cx={120} cy={LINE_Y} r={STOP_RADIUS} className="fill-paper" />
      <rect x={CURRENT_X - 7} y={LINE_Y - 7} width={14} height={14} className="fill-signal" />
      <rect
        x={CUSTOMS_X - 6}
        y={LINE_Y - 6}
        width={12}
        height={12}
        transform={`rotate(45 ${CUSTOMS_X} ${LINE_Y})`}
        className="fill-ink stroke-paper/60"
        strokeWidth={2}
      />
      <circle
        cx={348}
        cy={LINE_Y}
        r={STOP_RADIUS}
        className="fill-ink stroke-paper/60"
        strokeWidth={2}
      />
    </>
  )
}
