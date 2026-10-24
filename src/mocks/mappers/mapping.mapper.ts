import type { StatusMapping, UnmappedStatus } from '@/domain'
import type { Tables } from '@/mocks/db/schema'
import type { RawEventRow } from '@/mocks/db/tables/raw-events'
import type { ShipmentRow } from '@/mocks/db/tables/shipments'
import type { StatusMappingRow } from '@/mocks/db/tables/status-mappings'
import { parseRawEvent } from '@/mocks/operators/parse-event'
import { toIsoUtc } from '@/mocks/operators/parsed-event'

interface Occurrence {
  row: RawEventRow
  receivedAt: string
  shipment: ShipmentRow | undefined
}

interface UnmappedPair {
  operatorId: string
  rawCode: string
  // Newest first.
  occurrences: Occurrence[]
}

// BR-NM-03, BR-PM-05: mappings are operator configuration, so every ops user sees every
// unmapped pair and all its occurrences; the affected shipments are limited to the perimeter.
export function toUnmappedStatuses(
  db: Tables,
  inPerimeter: (shipment: ShipmentRow) => boolean,
): UnmappedStatus[] {
  return unmappedPairs(db).flatMap(({ operatorId, rawCode, occurrences }) => {
    const [latest] = occurrences
    if (!latest) return []
    const visible = occurrences.filter(({ shipment }) => shipment && inPerimeter(shipment))
    const affected = new Map<string, { id: string; reference: string }>()
    for (const { shipment } of visible) {
      if (shipment) affected.set(shipment.id, { id: shipment.id, reference: shipment.reference })
    }
    return {
      operatorId,
      operatorName: db.operators.findById(operatorId)?.name ?? operatorId,
      rawCode,
      occurrences: occurrences.length,
      lastSeenAt: latest.receivedAt,
      // The AI suggestion inherits the raw event's perimeter (BR-PM-01), so point at one the
      // user can open whenever there is one.
      latestRawEventId: (visible[0] ?? latest).row.id,
      affectedShipments: [...affected.values()],
    }
  })
}

function unmappedPairs(db: Tables): UnmappedPair[] {
  const shipmentOfLeg = new Map(db.legs.all().map((leg) => [leg.id, leg.shipmentId]))
  const pairs = new Map<string, UnmappedPair>()
  for (const row of db.rawEvents.where((event) => event.mappingStatus === 'unmapped')) {
    const format = db.operators.findById(row.operatorId)?.format
    const parsed = format && parseRawEvent(row, format)
    if (!parsed) continue
    const key = JSON.stringify([row.operatorId, parsed.code])
    const pair = pairs.get(key) ?? {
      operatorId: row.operatorId,
      rawCode: parsed.code,
      occurrences: [],
    }
    const shipmentId = shipmentOfLeg.get(row.legId)
    const shipment = shipmentId === undefined ? undefined : db.shipments.findById(shipmentId)
    pair.occurrences.push({ row, receivedAt: toIsoUtc(row.receivedAt), shipment })
    pairs.set(key, pair)
  }
  for (const pair of pairs.values()) {
    pair.occurrences.sort((a, b) => b.receivedAt.localeCompare(a.receivedAt))
  }
  return [...pairs.values()]
}

export function toStatusMappingResponse(row: StatusMappingRow): StatusMapping {
  return { id: row.id, operatorId: row.operatorId, rawCode: row.rawCode, target: row.target }
}
