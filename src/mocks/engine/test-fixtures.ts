import type { MappingTarget } from '@/domain'
import { accountsSeed } from '@/mocks/db/tables/accounts'
import type { DocumentRow } from '@/mocks/db/tables/documents'
import type { LegRow } from '@/mocks/db/tables/legs'
import { operatorsSeed } from '@/mocks/db/tables/operators'
import { sitesSeed } from '@/mocks/db/tables/sites'
import type { NormalisedEvent } from '@/mocks/operators/normalise'
import type { Legs, ShipmentFacts } from './facts'
import { addHours } from './time'

// Shared by the engine and AI unit tests: hand-built facts, dates in hours from NOW.
export const NOW = new Date('2026-11-10T12:00:00.000Z')
export const at = (hours: number) => addHours(NOW.toISOString(), hours)

export function leg(sequence: number, mode: LegRow['mode'], operatorId: string, from: number, to: number, vessel: string | null = null): LegRow {
  return {
    id: `leg_t_${sequence}`,
    shipmentId: 'shp_t',
    sequence,
    mode,
    operatorId,
    from: `From ${sequence}`,
    to: `To ${sequence}`,
    plannedDeparture: at(from),
    plannedArrival: at(to),
    trackingNumber: `TRK-${sequence}`,
    vessel,
  }
} // prettier-ignore

// A single road leg leaving 3 h ago and due in 10 h (like SH-10401).
export const roadLegs = (): Legs => [leg(1, 'road', 'op_tir', -3, 10)]

// Road to port → sea → last mile, with the vessel due `vesselArrival` hours from now and the
// committed date 48 h later (07 §4 booking template).
export function multimodalLegs(vesselArrival: number, vessel = 'BW Aurora'): Legs {
  const sailing = vesselArrival - 14 * 24
  return [
    leg(1, 'road', 'op_tir', sailing - 32, sailing - 24),
    leg(2, 'sea', 'op_bws', sailing, vesselArrival, vessel),
    leg(3, 'road', 'op_lmx', vesselArrival + 36, vesselArrival + 48),
  ]
}

let eventCount = 0

export function event(
  target: MappingTarget | null,
  legSequence: number,
  hours: number,
  extra: Partial<NormalisedEvent> = {},
): NormalisedEvent {
  eventCount += 1
  return {
    code: target ?? 'UNKNOWN',
    label: target ?? 'UNKNOWN',
    occurredAt: at(hours),
    isEstimate: false,
    location: 'Somewhere',
    eta: null,
    rawEventId: `evt_t_${eventCount}`,
    legId: `leg_t_${legSequence}`,
    operatorId: ['op_tir', 'op_bws', 'op_lmx'][legSequence - 1] ?? 'op_tir',
    receivedAt: at(hours),
    target,
    ...extra,
  }
}

export function etaUpdate(legSequence: number, sentHours: number, etaHours: number) {
  return event('eta_update', legSequence, sentHours, { eta: at(etaHours) })
}

export function document(type: DocumentRow['type'], status: DocumentRow['status']): DocumentRow {
  const available = status === 'available'
  return {
    id: `doc_t_${type}`,
    shipmentId: 'shp_t',
    type,
    status,
    fileName: available ? `${type}.pdf` : null,
    size: available ? 1000 : null,
    uploadedBy: null,
    uploadedAt: available ? at(-100) : null,
  }
}

interface FactsOptions {
  legs?: Legs
  events?: NormalisedEvent[]
  documents?: DocumentRow[]
  plannedEta?: string
  destinationCountry?: string
  accountId?: string
}

export function facts(options: FactsOptions = {}): ShipmentFacts {
  const legs = options.legs ?? roadLegs()
  const [account, site] = [accountsSeed[1], sitesSeed[0]]
  if (!account || !site) throw new Error('Seed accounts and sites are required')
  return {
    shipment: {
      id: 'shp_t',
      reference: 'SH-TEST',
      accountId: options.accountId ?? account.id,
      originSiteId: site.id,
      destinationCity: 'Destination',
      destinationCountry: options.destinationCountry ?? 'ES',
      plannedEta: options.plannedEta ?? legs[legs.length - 1]?.plannedArrival ?? at(10),
    },
    account: accountsSeed.find((row) => row.id === options.accountId) ?? account,
    originSite: site,
    legs,
    operators: operatorsSeed,
    events: [...(options.events ?? [])].sort((a, b) => a.occurredAt.localeCompare(b.occurredAt)),
    documents: options.documents ?? [],
  }
}
