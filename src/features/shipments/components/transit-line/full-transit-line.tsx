'use client'

import { Ship, Stamp as StampIcon, Truck } from 'lucide-react'
import { useMemo } from 'react'
import {
  currentMilestoneId,
  hasOpenHold,
  isPassed,
  modeLabels,
  sectionEndPlace,
  stopMilestones,
  stopState,
  transitSections,
  transitStops,
  type Shipment,
  type Timeline,
  type TransitSection,
  type TransitStop as Stop,
} from '@/domain'
import { cn } from '@/lib/utils'
import { operatorNames, type OperatorNames } from '../../source-label'
import { SourcedDate } from '../sourced-date'
import { stopDate } from './stop-facts'
import { TransitStop } from './transit-stop'

// Narrow screens scroll sideways rather than squeezing the stops (SC-04).
const MIN_STOP_WIDTH_PX = 88
const LINE_Y = 14

interface FullTransitLineProps {
  shipment: Shipment
  timeline: Timeline
  className?: string
}

// SC-04 full, DS-04: one stop per milestone grouped by leg, place labels at leg boundaries,
// operator and mode above each segment, and the dates below.
export function FullTransitLine({ shipment, timeline, className }: FullTransitLineProps) {
  const sections = useMemo(() => transitSections(shipment.legs, timeline), [shipment, timeline])
  const stops = useMemo(() => transitStops(sections), [sections])
  const operators = useMemo(() => operatorNames(shipment.legs), [shipment.legs])
  const currentId = currentMilestoneId(shipment.status, timeline)
  const columns = stops.length
  return (
    // `relative` keeps the screen-reader-only labels inside the scroll box, so they cannot
    // widen the page on narrow screens.
    <div className={cn('relative overflow-x-auto', className)} data-testid="full-line">
      <div
        role="group"
        aria-label="Route"
        className="grid grid-rows-[auto_28px_auto] gap-y-1"
        style={gridStyle(columns)}
      >
        {sections.map((section, index) => (
          <SectionHeader key={index} section={section} span={columnSpan(stops, index)} />
        ))}
        <Track stops={stops} />
        {stops.map((stop, index) => (
          <div
            key={index}
            className="row-start-2 flex items-center justify-center"
            style={{ gridColumn: index + 1 }}
          >
            <TransitStop stop={stop} current={isCurrent(stop, currentId)} />
          </div>
        ))}
        {stops.map((stop, index) => (
          <StopCaption
            key={index}
            column={index + 1}
            place={placeAt(stops, sections, index, shipment)}
            stop={stop}
            operators={operators}
          />
        ))}
      </div>
    </div>
  )
}

function SectionHeader({ section, span }: { section: TransitSection; span: string }) {
  const { Icon, mode, title } = sectionHeading(section)
  return (
    <div
      className="row-start-1 flex min-w-0 items-center justify-center gap-1.5 border-b border-rule px-2 pb-1 text-xs text-ink-muted"
      style={{ gridColumn: span }}
    >
      <Icon aria-hidden className="size-4 shrink-0" strokeWidth={1.5} />
      <span className="sr-only">{mode}: </span>
      <span className="truncate">{title}</span>
    </div>
  )
}

// Mode glyphs: truck, ship, customs stamp (03 §1.2).
function sectionHeading(section: TransitSection) {
  if (section.kind === 'customs') return { Icon: StampIcon, mode: 'Customs', title: 'Customs' }
  const { mode, operatorName } = section.leg
  return { Icon: mode === 'sea' ? Ship : Truck, mode: modeLabels[mode], title: operatorName }
}

// Solid into a stop that has passed, dashed into one still planned (DS-04).
function Track({ stops }: { stops: Stop[] }) {
  const x = (index: number) => `${((index + 0.5) / stops.length) * 100}%`
  return (
    <div aria-hidden className="row-start-2" style={{ gridColumn: '1 / -1' }}>
      <svg className="block h-7 w-full overflow-visible">
        {stops.slice(1).map((stop, index) => {
          const solid = isPassed(stopState(stop))
          return (
            <line
              key={index}
              x1={x(index)}
              x2={x(index + 1)}
              y1={LINE_Y}
              y2={LINE_Y}
              strokeWidth={2}
              strokeDasharray={solid ? undefined : '4 4'}
              className={solid ? 'stroke-ink' : 'stroke-ink-muted'}
              data-style={solid ? 'solid' : 'dashed'}
            />
          )
        })}
      </svg>
    </div>
  )
}

interface StopCaptionProps {
  column: number
  place: string | null
  stop: Stop
  operators: OperatorNames
}

function StopCaption({ column, place, stop, operators }: StopCaptionProps) {
  const date = stopDate(stop)
  return (
    <div
      className="row-start-3 flex flex-col items-center gap-0.5 px-1 text-center"
      style={{ gridColumn: column }}
    >
      {place && <span className="field-label leading-tight text-ink">{place}</span>}
      {date && (
        <SourcedDate date={date} precision="short" operators={operators} className="text-xs" />
      )}
    </div>
  )
}

function gridStyle(columns: number) {
  return {
    gridTemplateColumns: `repeat(${columns}, minmax(${MIN_STOP_WIDTH_PX}px, 1fr))`,
    minWidth: columns * MIN_STOP_WIDTH_PX,
  }
}

function columnSpan(stops: Stop[], sectionIndex: number): string {
  const first = stops.findIndex((stop) => stop.sectionIndex === sectionIndex)
  const last = stops.findLastIndex((stop) => stop.sectionIndex === sectionIndex)
  return `${first + 1} / ${last + 2}`
}

// Place labels at leg boundaries: the origin, then where each section ends.
function placeAt(stops: Stop[], sections: TransitSection[], index: number, shipment: Shipment) {
  const stop = stops[index]
  if (!stop) return null
  if (index === 0) return shipment.legs[0]?.from ?? null
  const section = sections[stop.sectionIndex]
  const endsSection = stops[index + 1]?.sectionIndex !== stop.sectionIndex
  if (!section || !endsSection) return null
  const place = sectionEndPlace(section)
  return section.kind === 'customs' && hasOpenHold(section.holds) ? `${place} · on hold` : place
}

function isCurrent(stop: Stop, currentId: string | null): boolean {
  return currentId !== null && stopMilestones(stop).some((milestone) => milestone.id === currentId)
}
