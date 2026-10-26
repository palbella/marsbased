import { describe, expect, it } from 'vitest'
import type { SourcedDate } from '@/domain'
import { formatStamp } from '@/lib/format-date'
import { sourceLabel } from './source-label'

const OBSERVED = '2026-11-12T14:05:00.000Z'
const operators = { op_bws: 'BlueWave' }

function date(provenance: SourcedDate['provenance'], source: string): SourcedDate {
  return { value: '2026-11-14T10:00:00.000Z', provenance, source, observedAt: OBSERVED }
}

describe('SC-03 source tooltip copy', () => {
  it('operator, confirmed and estimated', () => {
    const stamp = formatStamp(OBSERVED)
    expect(sourceLabel(date('confirmed', 'op_bws'), { operators })).toBe(
      `Confirmed by BlueWave · ${stamp}`,
    )
    expect(sourceLabel(date('estimated', 'op_bws'), { operators })).toBe(
      `Estimated by BlueWave · ${stamp}`,
    )
  })

  it('booking', () => {
    expect(sourceLabel(date('estimated', 'booking'))).toBe('Planned at booking')
  })

  it('system, with and without evidence', () => {
    expect(sourceLabel(date('estimated', 'system'))).toBe('Our estimate')
    const eta = { ...date('estimated', 'system'), basis: 'the vessel departing Valencia 18 h late' }
    expect(sourceLabel(eta)).toBe('Our estimate, based on the vessel departing Valencia 18 h late')
    expect(sourceLabel({ ...eta, basis: null })).toBe('Our estimate')
  })

  it('AI prediction with its confidence', () => {
    expect(sourceLabel(date('predicted', 'ai'), { confidence: 0.68 })).toBe(
      'AI prediction · 68% confidence',
    )
  })
})
