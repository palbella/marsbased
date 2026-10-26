import type { DomainEvent } from '@/domain'
import type { Tables } from '@/mocks/db/schema'
import { shipmentEvents, type EventDraft } from '@/mocks/db/tables/raw-events/builders'
import { recompute } from '@/mocks/engine/recompute'
import { nextId } from '@/mocks/engine/records'
import { findMappingTarget } from '@/mocks/operators/mapping'
import { parseRawEvent } from '@/mocks/operators/parse-event'

// 07 §6, BR-NM-*: the normal ingestion path. The operator message is stored as received,
// flagged unmapped when no mapping knows its code (BR-NM-03), then the engine runs for its
// shipment (BR-EX-10). Returns the thin events to publish (BR-RT-01).
export function ingestEvent(
  db: Tables,
  shipmentId: string,
  draft: EventDraft,
  now: Date,
): DomainEvent[] {
  const [built] = shipmentEvents(shipmentId, [draft])
  const format = db.operators.findById(draft.operatorId)?.format
  if (!built || !format) throw new Error(`Cannot ingest an event from ${draft.operatorId}`)
  const prefix = `evt_${shipmentId.replace('shp_', '')}`
  const row = { ...built, id: nextId(db.rawEvents, prefix) }
  const code = parseRawEvent(row, format)?.code
  const mapped = code !== undefined && findMappingTarget(db.statusMappings.all(), row.operatorId, code)
  db.rawEvents.insert({ ...row, mappingStatus: mapped ? 'mapped' : 'unmapped' })
  return recompute(db, shipmentId, now)
}
