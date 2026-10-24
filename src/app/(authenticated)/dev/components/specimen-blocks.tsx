'use client'

import type { ReactNode } from 'react'
import type { EtaPredictionInsight, RawEvent, Shipment } from '@/domain'
import {
  LastUpdated,
  OnTimeIndicator,
  ShipmentStatus,
  SourcedDate,
  StaleNotice,
  operatorNames,
} from '@/features/shipments'
import { formatDay } from '@/lib/format-date'

// TEMPORARY (T07, removed in T12): the gallery's building blocks.

interface SpecimenProps {
  shipment: Shipment
  prediction: EtaPredictionInsight | null | undefined
}

export function SpecimenHeader({ shipment, route, prediction }: SpecimenProps & { route: string }) {
  const predictionFact = prediction
    ? { value: prediction.content.predictedEta.value, confidence: prediction.confidence }
    : null
  return (
    <>
      <header className="flex flex-wrap items-center gap-x-5 gap-y-3 border-b border-rule bg-sheet px-4 py-3">
        <span className="font-mono text-sm">{shipment.reference}</span>
        <span className="field-label">{route}</span>
        <ShipmentStatus status={shipment.status} />
        <ShipmentStatus status={shipment.status} stamped />
        <OnTimeIndicator shipment={shipment} prediction={predictionFact} />
        <LastUpdated lastEventAt={shipment.lastEventAt} />
      </header>
      <StaleNotice lastEventAt={shipment.lastEventAt} stale={shipment.stale} />
    </>
  )
}

export function SpecimenFacts({ shipment, prediction }: SpecimenProps) {
  const { eta } = shipment
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-2 px-4 py-3 text-sm sm:grid-cols-3">
      <Fact label="ETA">
        {eta ? (
          <SourcedDate
            date={eta}
            precision="day"
            operators={operatorNames(shipment.legs)}
            outdated={eta.outdated}
            lastUpdatedAt={shipment.lastEventAt}
          />
        ) : (
          'Unknown'
        )}
      </Fact>
      <Fact label="Committed">{formatDay(shipment.plannedEta)}</Fact>
      <Fact label="Predicted">
        {prediction ? (
          <SourcedDate
            date={prediction.content.predictedEta}
            precision="day"
            confidence={prediction.confidence}
          />
        ) : (
          'No prediction'
        )}
      </Fact>
    </dl>
  )
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="field-label">{label}</dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  )
}

export function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-rule px-4 py-4">
      <h2 className="field-label mb-3">{title}</h2>
      {children}
    </section>
  )
}

// 06 §4, OP-30: the operator's original code and label next to the normalised milestone.
export function RawEventCell({ event }: { event: RawEvent | undefined }) {
  if (!event) return <>—</>
  return (
    <>
      {event.operatorId} · &ldquo;{event.code}&rdquo; · {event.label}
      {event.mappingStatus === 'unmapped' && ' · Unmapped'}
    </>
  )
}
