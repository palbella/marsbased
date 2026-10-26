'use client'

import { useMemo } from 'react'
import type { RawEvent, Shipment, Timeline } from '@/domain'
import { ErrorState } from '@/components/ui/error-state'
import { LoadingState } from '@/components/ui/loading-state'
import { useQueryFailure } from '@/components/ui/use-query-failure'
import {
  ShipmentTimeline,
  operatorNames,
  useShipmentRawEvents,
  useShipmentTimeline,
} from '@/features/shipments'
import { eventOnlyRows } from '../timeline-events'
import { RawEventCell } from './raw-event-cell'

// OP-30: the ops timeline, each milestone with the raw operator event it came from, plus the
// events that produced no milestone in place (06 §4).
export function TimelineTab({ shipment }: { shipment: Shipment }) {
  const timeline = useShipmentTimeline(shipment.id)
  const rawEvents = useShipmentRawEvents(shipment.id)
  const timelineFailure = useQueryFailure(timeline)
  const rawEventsFailure = useQueryFailure(rawEvents)
  const failure = timelineFailure ?? rawEventsFailure
  if (failure) {
    const retry = () => Promise.all([timeline.refetch(), rawEvents.refetch()])
    return (
      <ErrorState
        message="The timeline could not be loaded."
        retrying={failure.retrying}
        onRetry={retry}
      />
    )
  }
  if (!timeline.isSuccess || !rawEvents.isSuccess) {
    return <LoadingState label="Loading the timeline" rows={6} />
  }
  return <OpsTimeline shipment={shipment} timeline={timeline.data} rawEvents={rawEvents.data} />
}

interface OpsTimelineProps {
  shipment: Shipment
  timeline: Timeline
  rawEvents: RawEvent[]
}

function OpsTimeline({ shipment, timeline, rawEvents }: OpsTimelineProps) {
  const byId = useMemo(() => new Map(rawEvents.map((event) => [event.id, event])), [rawEvents])
  const operators = useMemo(() => operatorNames(shipment.legs), [shipment.legs])
  const events = useMemo(() => eventOnlyRows(timeline, rawEvents), [timeline, rawEvents])
  const renderRawEvent = (rawEventId: string) => {
    const event = byId.get(rawEventId)
    const operatorName = event ? (operators[event.operatorId] ?? event.operatorId) : ''
    return <RawEventCell event={event} operatorName={operatorName} />
  }
  return (
    <ShipmentTimeline
      shipment={shipment}
      timeline={timeline}
      variant="ops"
      renderRawEvent={renderRawEvent}
      events={events}
    />
  )
}
