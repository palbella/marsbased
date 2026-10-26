import { describe, expect, it } from 'vitest'
import type { MappingTarget, RawEvent, Timeline } from '@/domain'
import { eventOnlyRows } from './timeline-events'

function rawEvent(id: string, target: MappingTarget | null): RawEvent {
  return {
    id,
    legId: 'leg_015_2',
    operatorId: 'op_bws',
    code: 'X',
    label: 'Label',
    occurredAt: '2026-11-10T08:15:00Z',
    receivedAt: '2026-11-10T08:20:00Z',
    mappingStatus: target === null ? 'unmapped' : 'mapped',
    target,
    format: 'tir-json',
    payload: { code: 'X', ts: '2026-11-10T08:15:00Z', location: 'Valencia', eta: null },
  }
}

const timeline: Timeline = {
  shipmentId: 'shp_015',
  milestones: [
    { id: 'ms_1', legId: 'leg_015_2', type: 'vessel_departed', state: 'done', rawEventId: 'vd' },
  ],
  customsHolds: [],
}

describe('06 §4 event-only rows', () => {
  it('keeps unmapped, ETA and position updates that no milestone traces back to', () => {
    const events = [
      rawEvent('vd', 'vessel_departed'),
      rawEvent('eta', 'eta_update'),
      rawEvent('pos', 'position_update'),
      rawEvent('new', null),
      rawEvent('noise', 'ignore'),
    ]
    expect(eventOnlyRows(timeline, events).map(({ rawEventId, label, unmapped }) => [rawEventId, label, unmapped])).toEqual([
      ['eta', 'ETA update', false],
      ['pos', 'Position update', false],
      ['new', 'Unmapped', true],
    ]) // prettier-ignore
  })
})
