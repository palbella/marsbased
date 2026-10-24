import { describe, expect, it } from 'vitest'
import type { EtaView } from './eta'
import { compareAttention, deriveOnTime, type AttentionItem } from './on-time'
import { NOW, at } from './test-fixtures'

const PLANNED = at(10)

function eta(hours: number, outdated = false): EtaView {
  const value = at(hours)
  return {
    value,
    provenance: 'estimated',
    source: 'system',
    observedAt: at(-1),
    outdated,
    rawEventId: null,
  }
}

const onTime = (etaHours: number, overrides: Partial<Parameters<typeof deriveOnTime>[0]> = {}) =>
  deriveOnTime({
    eta: eta(etaHours),
    plannedEta: PLANNED,
    deliveredAt: null,
    prediction: null,
    now: NOW,
    ...overrides,
  })

describe('BR-OT-01 On-time indicator', () => {
  it('is late once the committed date has passed, even when the ETA is outdated', () => {
    expect(onTime(10, { plannedEta: at(-1), eta: eta(-1, true) })).toBe('late')
  })

  it('is unknown when the ETA is outdated and the committed date is ahead', () => {
    expect(onTime(10, { eta: eta(10, true) })).toBe('unknown')
  })

  it('is late past 12 h, at risk past 2 h, on time otherwise', () => {
    expect(onTime(23)).toBe('late')
    expect(onTime(22)).toBe('at_risk')
    expect(onTime(13)).toBe('at_risk')
    expect(onTime(12)).toBe('on_time')
  })

  it('is at risk when the AI predicts more than 12 h late with confidence ≥ 0.6', () => {
    const prediction = (hours: number, confidence: number) => ({
      predictedEta: at(hours),
      confidence,
    })

    expect(onTime(10, { prediction: prediction(23, 0.6) })).toBe('at_risk')
    expect(onTime(10, { prediction: prediction(23, 0.5) })).toBe('on_time')
    expect(onTime(10, { prediction: prediction(22, 0.9) })).toBe('on_time')
  })
})

describe('BR-OT-02 Delivered shipments', () => {
  it('are on time up to 2 h after the committed date, late after', () => {
    expect(onTime(12, { deliveredAt: at(12), now: new Date(at(20)) })).toBe('on_time')
    expect(onTime(13, { deliveredAt: at(13), now: new Date(at(20)) })).toBe('late')
  })
})

describe('BR-OT-03 Attention-first sort', () => {
  it('orders late, at risk, on hold, unknown, on time, then by ETA', () => {
    const item = (name: string, onTimeValue: AttentionItem['onTime'], etaHours: number, status: AttentionItem['status'] = 'in_transit') => ({
      name,
      onTime: onTimeValue,
      status,
      eta: eta(etaHours),
    }) // prettier-ignore
    const items = [
      item('on time, later', 'on_time', 50),
      item('unknown', 'unknown', 5),
      item('on time, sooner', 'on_time', 20),
      item('on hold', 'on_time', 40, 'on_hold'),
      item('at risk', 'at_risk', 30),
      item('late', 'late', 60),
    ]

    expect(items.sort(compareAttention).map((entry) => entry.name)).toEqual([
      'late',
      'at risk',
      'on hold',
      'unknown',
      'on time, sooner',
      'on time, later',
    ])
  })
})
