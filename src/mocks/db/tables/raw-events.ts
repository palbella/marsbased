import type {
  BwsPayload,
  EurPayload,
  LmxPayload,
  MappingStatus,
  PldPayload,
  TirPayload,
} from '@/domain'
import type { Clock } from '@/mocks/clock'
import { domesticRawEvents } from './raw-events/domestic'
import { euRawEvents } from './raw-events/eu'
import { multimodalAtSeaRawEvents } from './raw-events/multimodal-at-sea'
import { multimodalCustomsRawEvents } from './raw-events/multimodal-customs'
import { multimodalLastMileRawEvents } from './raw-events/multimodal-last-mile'

// In the operator's own format (07 §3); the operator's `format` tells which one.
export type OperatorPayload = TirPayload | EurPayload | PldPayload | BwsPayload | LmxPayload

export interface RawEventRow {
  id: string
  legId: string
  operatorId: string
  payload: OperatorPayload
  receivedAt: string
  mappingStatus: MappingStatus
}

// 07 §4: the facts shipments are built from (ADR-003). Exactly what each shipment needs to
// reach its seeded state once the engine runs, including deliberate gaps.
export function rawEventsSeed(clock: Clock): RawEventRow[] {
  return [
    ...domesticRawEvents(clock),
    ...euRawEvents(clock),
    ...multimodalAtSeaRawEvents(clock),
    ...multimodalCustomsRawEvents(clock),
    ...multimodalLastMileRawEvents(clock),
  ]
}
