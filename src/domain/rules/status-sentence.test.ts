import { describe, expect, it } from 'vitest'
import type { Shipment } from '../shipment'
import { statusSentence } from './status-sentence'

const COMMITTED = '2026-11-13T12:00:00.000Z'
const day = (iso: string) => `day(${iso.slice(0, 10)})`

function facts(
  onTime: Shipment['onTime'],
  etaHoursAfterCommitted: number | null,
  status: Shipment['status'] = 'in_transit',
) {
  const eta =
    etaHoursAfterCommitted === null
      ? null
      : {
          value: new Date(Date.parse(COMMITTED) + etaHoursAfterCommitted * 3_600_000).toISOString(),
          provenance: 'estimated' as const,
          source: 'system',
          observedAt: COMMITTED,
          outdated: false,
          rawEventId: null,
          basis: null,
        }
  return { onTime, status, eta, plannedEta: COMMITTED }
}

describe('CP-03 status sentence', () => {
  it('on hold: held at customs, whatever the delay', () => {
    expect(statusSentence(facts('late', 40, 'on_hold'), null, day)).toBe('Held at customs')
  })

  it('late or at risk: the delay against the committed day, in days from 12 h', () => {
    expect(statusSentence(facts('late', 18), null, day)).toBe(
      'About 1 day behind the committed day(2026-11-13)',
    )
    expect(statusSentence(facts('late', 60), null, day)).toBe(
      'About 3 days behind the committed day(2026-11-13)',
    )
  })

  it('late or at risk: under 12 h the delay reads in hours', () => {
    expect(statusSentence(facts('at_risk', 5), null, day)).toBe(
      'About 5 h behind the committed day(2026-11-13)',
    )
  })

  it('at risk because of the AI prediction: names the AI and its delay (as onTimeReason)', () => {
    const prediction = { value: '2026-11-15T17:00:00.000Z', confidence: 0.65 }
    expect(statusSentence(facts('at_risk', -2), prediction, day)).toBe(
      'AI predicts about 2 days behind the committed day(2026-11-13)',
    )
    const closePrediction = { value: '2026-11-13T17:00:00.000Z', confidence: 0.65 }
    expect(statusSentence(facts('at_risk', 1), closePrediction, day)).toBe(
      'AI predicts about 5 h behind the committed day(2026-11-13)',
    )
  })

  it('at risk explained by the ETA: the ETA delay wins over the prediction', () => {
    const prediction = { value: '2026-11-16T12:00:00.000Z', confidence: 0.65 }
    expect(statusSentence(facts('at_risk', 5), prediction, day)).toBe(
      'About 5 h behind the committed day(2026-11-13)',
    )
  })

  it('at risk by AI while the prediction is not loaded: the status label', () => {
    expect(statusSentence(facts('at_risk', -2), null, day)).toBe('In transit')
  })

  it('unknown: no recent update', () => {
    expect(statusSentence(facts('unknown', null), null, day)).toBe(
      'No recent update from the operator',
    )
  })

  it('booked: waiting for pickup', () => {
    expect(statusSentence(facts('on_time', 0, 'booked'), null, day)).toBe(
      'Booked, waiting for pickup',
    )
  })

  it('otherwise: the status label', () => {
    expect(statusSentence(facts('on_time', 0, 'out_for_delivery'), null, day)).toBe(
      'Out for delivery',
    )
    expect(statusSentence(facts('on_time', -3, 'delivered'), null, day)).toBe('Delivered')
  })
})
