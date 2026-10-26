import { describe, expect, it } from 'vitest'
import type { Milestone, SourcedDate } from '@/domain'
import { interleave, type TimelineEvent } from './interleave'

const sourced = (value: string): SourcedDate => ({
  value,
  provenance: 'confirmed',
  source: 'op_bws',
  observedAt: value,
})

function milestone(id: string, actual?: string, planned?: string): Milestone {
  return {
    id,
    legId: 'leg_1',
    type: 'vessel_departed',
    state: actual ? 'done' : 'pending',
    actual: actual ? sourced(actual) : undefined,
    planned: planned ? sourced(planned) : undefined,
  }
}

function event(rawEventId: string, occurredAt: string): TimelineEvent {
  return { rawEventId, legId: 'leg_1', occurredAt, label: 'ETA update', unmapped: false }
}

const order = (entries: ReturnType<typeof interleave>) =>
  entries.map((entry) => (entry.kind === 'milestone' ? entry.milestone.id : entry.event.rawEventId))

describe('06 §4 event-only rows in the ops timeline', () => {
  it('places each event before the first milestone after it, keeping plan order', () => {
    const milestones = [
      milestone('departed', '2026-11-01T10:00:00Z'),
      milestone('arrived', undefined, '2026-11-08T10:00:00Z'),
    ]
    const events = [event('eta', '2026-11-03T10:00:00Z'), event('early', '2026-10-31T10:00:00Z')]
    expect(order(interleave(milestones, events))).toEqual(['early', 'departed', 'eta', 'arrived'])
  })

  it('puts events before undated milestones and after the last dated one', () => {
    const milestones = [milestone('departed', '2026-11-01T10:00:00Z'), milestone('undated')]
    expect(order(interleave(milestones, [event('pos', '2026-11-02T10:00:00Z')]))).toEqual([
      'departed',
      'pos',
      'undated',
    ])
  })

  it('appends events after every milestone when they are the latest', () => {
    const milestones = [milestone('departed', '2026-11-01T10:00:00Z', '2026-11-01T09:00:00Z')]
    expect(order(interleave(milestones, [event('late', '2026-11-05T10:00:00Z')]))).toEqual([
      'departed',
      'late',
    ])
  })
})
