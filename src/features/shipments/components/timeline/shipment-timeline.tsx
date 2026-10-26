'use client'

import { Ship, Stamp as StampIcon, Truck } from 'lucide-react'
import { useMemo, type ReactNode } from 'react'
import {
  modeLabels,
  transitSections,
  type Shipment,
  type Timeline,
  type TransitSection,
} from '@/domain'
import { cn } from '@/lib/utils'
import { operatorNames, type OperatorNames } from '../../source-label'
import { EventRow } from './event-row'
import { HoldRow } from './hold-row'
import { interleave, type TimelineEvent } from './interleave'
import { MilestoneRow, rowColumns, type TimelineVariant } from './milestone-row'

interface ShipmentTimelineProps {
  shipment: Shipment
  timeline: Timeline
  variant?: TimelineVariant
  // 06 §4: the raw operator event column, filled by the ops detail page.
  renderRawEvent?: (rawEventId: string) => ReactNode
  // 06 §4, ops only: operator events with no milestone, placed in their leg.
  events?: TimelineEvent[]
  className?: string
}

// SC-05: the vertical detail of the transit line, milestones grouped by leg in plan order.
export function ShipmentTimeline({
  shipment,
  timeline,
  variant = 'customer',
  renderRawEvent,
  events = [],
  className,
}: ShipmentTimelineProps) {
  const sections = useMemo(() => transitSections(shipment.legs, timeline), [shipment, timeline])
  const operators = useMemo(() => operatorNames(shipment.legs), [shipment.legs])
  const rowProps = { variant, operators, renderRawEvent }
  return (
    <div className={cn('border-y border-rule bg-sheet', className)}>
      <ColumnHeadings variant={variant} />
      {sections.map((section, index) => (
        <TimelineSection
          key={index}
          section={section}
          events={events.filter((event) => sectionLegId(section) === event.legId)}
          rowProps={rowProps}
        />
      ))}
    </div>
  )
}

interface TimelineSectionProps {
  section: TransitSection
  events: TimelineEvent[]
  rowProps: {
    variant: TimelineVariant
    operators: OperatorNames
    renderRawEvent?: (rawEventId: string) => ReactNode
  }
}

function TimelineSection({ section, events, rowProps }: TimelineSectionProps) {
  return (
    <section aria-label={sectionTitle(section)} className="border-t border-rule">
      <SectionHeader section={section} />
      <ol className="divide-y divide-rule">
        {interleave(section.milestones, events).map((entry) =>
          entry.kind === 'milestone' ? (
            <MilestoneRow key={entry.milestone.id} milestone={entry.milestone} {...rowProps} />
          ) : (
            <EventRow
              key={entry.event.rawEventId}
              event={entry.event}
              renderRawEvent={rowProps.renderRawEvent}
            />
          ),
        )}
        {section.kind === 'customs' &&
          section.holds.map((hold) => <HoldRow key={hold.id} hold={hold} {...rowProps} />)}
      </ol>
    </section>
  )
}

function ColumnHeadings({ variant }: { variant: TimelineVariant }) {
  return (
    <div aria-hidden className={cn('hidden gap-x-4 px-4 py-2 md:grid', rowColumns[variant])}>
      <span className="field-label">Milestone</span>
      <span className="field-label">Planned</span>
      <span className="field-label">Actual</span>
      {variant === 'ops' && <span className="field-label">Operator event</span>}
    </div>
  )
}

// Header: mode glyph, operator and tracking number in mono (SC-05).
function SectionHeader({ section }: { section: TransitSection }) {
  if (section.kind === 'customs') {
    return (
      <HeaderLine icon={<StampIcon aria-hidden className="size-4" strokeWidth={1.5} />}>
        <span className="font-condensed font-semibold tracking-wider uppercase">Customs</span>
      </HeaderLine>
    )
  }
  const { mode, operatorName, trackingNumber } = section.leg
  const Icon = mode === 'sea' ? Ship : Truck
  return (
    <HeaderLine icon={<Icon aria-hidden className="size-4" strokeWidth={1.5} />}>
      <span className="sr-only">{modeLabels[mode]}: </span>
      <span className="font-condensed font-semibold tracking-wider uppercase">{operatorName}</span>
      <span className="font-mono text-xs text-ink-muted">{trackingNumber}</span>
    </HeaderLine>
  )
}

function HeaderLine({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <h3 className="flex flex-wrap items-center gap-x-2.5 gap-y-1 bg-paper px-4 py-2 text-sm text-ink">
      {icon}
      {children}
    </h3>
  )
}

function sectionLegId(section: TransitSection): string | null {
  return section.kind === 'customs' ? null : section.leg.id
}

function sectionTitle(section: TransitSection): string {
  if (section.kind === 'customs') return 'Customs'
  return `${modeLabels[section.leg.mode]} · ${section.leg.operatorName}`
}
