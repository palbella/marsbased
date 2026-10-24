import type { ConfirmMappingRequest, DomainEvent } from '@/domain'
import type { Tables } from '@/mocks/db/schema'
import { parseRawEvent } from '@/mocks/operators/parse-event'
import { recompute } from './recompute'
import { nextId } from './records'

// BR-NM-03: confirming a mapping reprocesses every unmapped event with that code, past ones
// included, then runs the engine for each affected shipment (BR-EX-10).
export function confirmMapping(
  db: Tables,
  request: ConfirmMappingRequest,
  now: Date,
): DomainEvent[] {
  const existing = db.statusMappings
    .where((row) => row.operatorId === request.operatorId)
    .find((row) => row.rawCode === request.rawCode)
  if (existing) {
    db.statusMappings.update(existing.id, { target: request.target })
  } else {
    db.statusMappings.insert({ id: nextId(db.statusMappings, 'map'), ...request })
  }

  const legIds = new Set<string>()
  for (const event of unmappedWithCode(db, request)) {
    db.rawEvents.update(event.id, { mappingStatus: 'mapped' })
    legIds.add(event.legId)
  }
  const shipmentIds = new Set(
    db.legs.where((leg) => legIds.has(leg.id)).map((leg) => leg.shipmentId),
  )
  return [
    { type: 'mapping.changed' },
    ...[...shipmentIds].flatMap((shipmentId) => recompute(db, shipmentId, now)),
  ]
}

function unmappedWithCode(db: Tables, { operatorId, rawCode }: ConfirmMappingRequest) {
  const format = db.operators.findById(operatorId)?.format
  if (!format) return []
  return db.rawEvents
    .where((row) => row.operatorId === operatorId && row.mappingStatus === 'unmapped')
    .filter((row) => parseRawEvent(row, format)?.code === rawCode)
}
