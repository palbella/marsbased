import type { DomainEvent, Scenario, ScenarioId } from '@/domain'
import type { Clock } from '@/mocks/clock'
import type { Tables } from '@/mocks/db/schema'
import { legId } from '@/mocks/db/tables/legs/leg-ids'
import { eventBuilders } from '@/mocks/db/tables/raw-events/builders'
import { VERACRUZ } from '@/mocks/db/tables/raw-events/places'
import { storeDocument } from '@/mocks/engine/documents'
import { hoursBetween } from '@/mocks/engine/time'
import { sampleDocument } from '@/mocks/sample-document'
import { ingestEvent } from './ingest'
import { advanceClock, hasRun } from './simulator-state'

// 07 §6: SIM-01 moves the vessel arrival this much later.
const SIM_01_DELAY_HOURS = 36
// 07 §6: SIM-03 lets EuroRoad's silence cross the staleness threshold (BR-SL-01).
const SIM_03_CLOCK_HOURS = 2
// Operators transmit a few minutes after the fact (seed builders add 5 min), so a scenario
// event happened 6 min ago and arrived 1 min ago, never in the future.
const SENT_HOURS_AGO = 0.1
// The multimodal route's sea leg (07 §4).
const SEA_LEG_SEQUENCE = 2

interface ScenarioDefinition {
  id: ScenarioId
  name: string
  shipmentReference: string
  description: string
  run: (db: Tables, clock: Clock) => DomainEvent[]
}

// OP-50: what the panel lists; each run goes through the normal ingestion path.
const SCENARIOS: ScenarioDefinition[] = [
  {
    id: 'SIM-01',
    name: 'Vessel delay',
    shipmentReference: 'SH-10433',
    description: `BlueWave moves the vessel arrival ${SIM_01_DELAY_HOURS} h later.`,
    run: (db, clock) => vesselDelay(db, clock, 'shp_015'),
  },
  {
    id: 'SIM-02',
    name: 'Customs hold',
    shipmentReference: 'SH-10447',
    description: 'BlueWave reports a customs hold at Veracruz.',
    run: (db, clock) => {
      const vessel = seaLeg(db, 'shp_020').vessel ?? ''
      const event = eventBuilders(clock).bws('CHLD', -SENT_HOURS_AGO, vessel, VERACRUZ)
      return ingestEvent(db, 'shp_020', event, clock.now())
    },
  },
  {
    id: 'SIM-03',
    name: 'Operator goes silent',
    shipmentReference: 'SH-10421',
    description: `EuroRoad stays silent while the clock moves ${SIM_03_CLOCK_HOURS} h.`,
    run: (db, clock) => advanceClock(db, clock, SIM_03_CLOCK_HOURS),
  },
  {
    id: 'SIM-04',
    name: 'Unknown status code',
    shipmentReference: 'SH-10450',
    description: 'LastMile Express sends a status nobody has mapped yet.',
    run: (db, clock) => {
      const event = eventBuilders(clock).lmx('Parcel handed to recipient', -SENT_HOURS_AGO, 'Querétaro')
      return ingestEvent(db, 'shp_021', event, clock.now())
    },
  },
  {
    id: 'SIM-05',
    name: 'Delivery',
    shipmentReference: 'SH-10401',
    description: 'TIR delivers in Madrid and sends the proof of delivery.',
    run: (db, clock) => delivery(db, clock, 'shp_001', 'SH-10401'),
  },
] // prettier-ignore

export function listScenarios(db: Tables): Scenario[] {
  return SCENARIOS.map(({ id, name, shipmentReference, description }) => ({
    id,
    name,
    shipmentReference,
    description,
    done: hasRun(db, id),
  }))
}

export function findScenario(id: string): ScenarioDefinition | undefined {
  return SCENARIOS.find((scenario) => scenario.id === id)
}

// SIM-01, BR-ETA-03: an estimate whose date is the new vessel arrival.
function vesselDelay(db: Tables, clock: Clock, shipmentId: string): DomainEvent[] {
  const leg = seaLeg(db, shipmentId)
  const arrivalHours = hoursBetween(clock.now(), leg.plannedArrival) + SIM_01_DELAY_HOURS
  const event = eventBuilders(clock).bwsEta(
    arrivalHours,
    -SENT_HOURS_AGO,
    leg.vessel ?? '',
    VERACRUZ,
  )
  return ingestEvent(db, shipmentId, event, clock.now())
}

// SIM-05, BR-NA-03: TIR transmits the proof of delivery with the delivery, so it is stored
// before the event and the engine finds it available.
function delivery(
  db: Tables,
  clock: Clock,
  shipmentId: string,
  reference: string,
): DomainEvent[] {
  const now = clock.now()
  const proof = {
    type: 'proof_of_delivery' as const,
    fileName: `POD-${reference}.pdf`,
    size: sampleDocument().byteLength,
  }
  storeDocument(db, shipmentId, proof, null, now)
  const event = eventBuilders(clock).tir('500', -SENT_HOURS_AGO, 'Madrid')
  return [{ type: 'document.changed', shipmentId }, ...ingestEvent(db, shipmentId, event, now)]
}

function seaLeg(db: Tables, shipmentId: string) {
  const leg = db.legs.findById(legId(shipmentId, SEA_LEG_SEQUENCE))
  if (!leg) throw new Error(`${shipmentId} has no sea leg`)
  return leg
}
