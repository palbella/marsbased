import { describe, expect, it } from 'vitest'
import type { Shipment } from '../shipment'
import { confidenceLevel, confidencePercent } from './confidence'
import { onTimeReason } from './on-time-reason'

const NOW = new Date('2026-11-12T12:00:00.000Z')
const COMMITTED = '2026-11-13T12:00:00.000Z'

function facts(onTime: Shipment['onTime'], etaHoursAfterCommitted: number, extra = {}) {
  const value = new Date(Date.parse(COMMITTED) + etaHoursAfterCommitted * 3_600_000).toISOString()
  return {
    onTime,
    status: 'in_transit' as const,
    plannedEta: COMMITTED,
    eta: {
      value,
      provenance: 'estimated' as const,
      source: 'system',
      observedAt: NOW.toISOString(),
      outdated: false,
      rawEventId: null,
      basis: null,
    },
    ...extra,
  }
}

describe('SC-02 / BR-OT-01 on-time reason', () => {
  it('late by delay: says how far the ETA is past the committed date', () => {
    expect(onTimeReason(facts('late', 18), null, NOW)).toBe('ETA 18 h after the committed date')
  })

  it('late by fact: the committed date has passed', () => {
    const passed = { ...facts('late', 1), plannedEta: '2026-11-11T12:00:00.000Z' }
    expect(onTimeReason(passed, null, NOW)).toBe('The committed date has passed')
  })

  it('at risk by the ETA', () => {
    expect(onTimeReason(facts('at_risk', 5), null, NOW)).toBe('ETA 5 h after the committed date')
  })

  it('at risk by the AI prediction', () => {
    const prediction = { value: '2026-11-14T04:00:00.000Z', confidence: 0.7 }
    expect(onTimeReason(facts('at_risk', 0), prediction, NOW)).toBe(
      'AI predicts arrival 16 h after the committed date',
    )
  })

  it('unknown: BR-ETA-05 outdated ETA', () => {
    const outdated = facts('unknown', 0)
    outdated.eta.outdated = true
    expect(onTimeReason(outdated, null, NOW)).toMatch(/may be outdated/)
  })

  it('on time', () => {
    expect(onTimeReason(facts('on_time', -3), null, NOW)).toBe(
      'ETA on or before the committed date',
    )
  })

  it('BR-OT-02 delivered late or on time', () => {
    const delivered = { status: 'delivered' as const }
    expect(onTimeReason(facts('late', 4, delivered), null, NOW)).toBe(
      'Delivered 4 h after the committed date',
    )
    expect(onTimeReason(facts('on_time', 1, delivered), null, NOW)).toBe('Delivered on time')
  })
})

describe('SC-06 confidence levels', () => {
  it('low under 0.6, medium under 0.8, high from 0.8', () => {
    expect(confidenceLevel(0.59)).toBe('low')
    expect(confidenceLevel(0.6)).toBe('medium')
    expect(confidenceLevel(0.79)).toBe('medium')
    expect(confidenceLevel(0.8)).toBe('high')
    expect(confidencePercent(0.678)).toBe(68)
  })
})
