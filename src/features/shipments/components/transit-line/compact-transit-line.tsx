import {
  compactRoute,
  sectionFill,
  type CompactRoute,
  type SectionFill,
  type Shipment,
} from '@/domain'
import { cn } from '@/lib/utils'

type RouteFacts = Pick<Shipment, 'legs' | 'status' | 'hasCustoms' | 'lastDoneMilestone'>

const LINE_Y = 8
const DASH = '4 4'
const HALF = 0.5
// How much of a section is drawn solid: behind the marker, up to it, or none.
const solidShare: Record<SectionFill, number> = { solid: 1, partial: HALF, dashed: 0 }

// SC-04 compact, DS-04: one stop per place, no labels, for list rows. The drawing is
// decorative; the route is read out as text for screen readers.
export function CompactTransitLine({
  shipment,
  className,
}: {
  shipment: RouteFacts
  className?: string
}) {
  const route = compactRoute(shipment)
  const count = route.sections.length
  const x = (place: number) => `${(place / count) * 100}%`
  // BR-ST-02: `on_hold` means an open customs hold.
  const held = shipment.status === 'on_hold'
  return (
    <div className={cn('px-1.5', className)}>
      <svg aria-hidden className="block h-4 w-full overflow-visible" data-testid="compact-line">
        {route.sections.map((_, index) => (
          <Segment key={index} from={index} count={count} fill={sectionFill(route, index)} />
        ))}
        <Place x={x(0)} passed={route.marker !== null} customs={false} />
        {route.sections.map((section, index) => (
          <Place
            key={index}
            x={x(index + 1)}
            passed={sectionFill(route, index) === 'solid'}
            customs={section.legId === null}
            held={held}
          />
        ))}
        {route.marker && <Marker x={markerX(route.marker, count)} />}
      </svg>
      <span className="sr-only">
        {describeRoute(route)}
        {held && ' On hold in customs.'}
      </span>
    </div>
  )
}

function Segment({ from, count, fill }: { from: number; count: number; fill: SectionFill }) {
  const start = (from / count) * 100
  const end = ((from + 1) / count) * 100
  const solidEnd = start + (end - start) * solidShare[fill]
  return (
    <>
      {solidEnd > start && <Line x1={start} x2={solidEnd} dashed={false} />}
      {solidEnd < end && <Line x1={solidEnd} x2={end} dashed />}
    </>
  )
}

function Line({ x1, x2, dashed }: { x1: number; x2: number; dashed: boolean }) {
  return (
    <line
      x1={`${x1}%`}
      x2={`${x2}%`}
      y1={LINE_Y}
      y2={LINE_Y}
      strokeWidth={2}
      strokeDasharray={dashed ? DASH : undefined}
      className={dashed ? 'stroke-ink-muted' : 'stroke-ink'}
      data-style={dashed ? 'dashed' : 'solid'}
    />
  )
}

interface PlaceProps {
  x: string
  passed: boolean
  customs: boolean
  held?: boolean
}

// SC-04: an open hold outlines the customs stop in `--late`.
function Place({ x, passed, customs, held = false }: PlaceProps) {
  const fill = passed ? 'fill-ink stroke-ink' : 'fill-paper stroke-ink-muted'
  const heldCustoms = customs && held
  return (
    <svg x={x} y={LINE_Y} overflow="visible">
      {customs ? (
        <rect
          x={-4.5}
          y={-4.5}
          width={9}
          height={9}
          transform="rotate(45)"
          strokeWidth={heldCustoms ? 2.5 : 1.5}
          className={heldCustoms ? 'fill-paper stroke-late' : fill}
          data-testid="customs-stop"
          data-held={heldCustoms || undefined}
        />
      ) : (
        <circle r={4} strokeWidth={1.5} className={fill} />
      )}
    </svg>
  )
}

function Marker({ x }: { x: string }) {
  return (
    <svg x={x} y={LINE_Y} overflow="visible">
      <rect x={-5} y={-5} width={10} height={10} className="fill-signal" data-testid="marker" />
    </svg>
  )
}

function markerX(marker: NonNullable<CompactRoute['marker']>, count: number): string {
  const place = marker.atEnd ? marker.sectionIndex + 1 : marker.sectionIndex + HALF
  return `${(place / count) * 100}%`
}

function describeRoute(route: CompactRoute): string {
  const places = [route.origin, ...route.sections.map((section) => section.endPlace)]
  const path = `Route: ${places.join(' → ')}.`
  const { marker } = route
  if (marker === null) return `${path} Not departed yet.`
  const from = places[marker.sectionIndex] ?? ''
  const to = places[marker.sectionIndex + 1] ?? ''
  return marker.atEnd ? `${path} Now at ${to}.` : `${path} Now between ${from} and ${to}.`
}
