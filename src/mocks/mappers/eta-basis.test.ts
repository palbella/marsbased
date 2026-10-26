import { describe, expect, it } from 'vitest'
import { seededNow, seededShipment } from '@/mocks/db/seeded-state'
import { etaBasis } from './eta-basis'

const basisOf = (reference: string) => {
  const shipment = seededShipment(reference)
  return etaBasis(shipment.view.eta, shipment, seededNow)
}

describe('SC-03 ETA basis, from the BR-ETA rule that applied', () => {
  it('BR-ETA-03: an earlier leg operator moved its arrival', () => {
    expect(basisOf('SH-10436')).toBe('BlueWave moving the vessel arrival 2 h ago')
  })

  it('BR-ETA-04: the delay of the latest done milestone', () => {
    expect(basisOf('SH-10404')).toBe('the truck leaving Zaragoza Plant 5 h late')
    expect(basisOf('SH-10433')).toBe('the vessel departing Port of Valencia on schedule')
  })

  it('null for booking (BR-ETA-04 before events), operator (BR-ETA-02) and confirmed (BR-ETA-01)', () => {
    expect(basisOf('SH-10407')).toBeNull()
    expect(basisOf('SH-10402')).toBeNull()
    expect(basisOf('SH-10452')).toBeNull()
  })
})
