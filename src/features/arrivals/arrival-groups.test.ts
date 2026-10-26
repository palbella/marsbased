import { describe, expect, it } from 'vitest'
import type { Shipment } from '@/domain'
import { ROUTES } from '@/test/shipment-fixtures'
import { deliveredArrivals, groupArrivals, needsAttention } from './arrival-groups'

// Thursday 12 Nov 2026, 15:00 local time.
const NOW = new Date(2026, 10, 12, 15, 0)
const base = ROUTES.roadInTransit.shipment

function arriving(id: string, eta: Date | null, extra: Partial<Shipment> = {}): Shipment {
  const sourced = base.eta && eta ? { ...base.eta, value: eta.toISOString() } : null
  return { ...base, id, eta: sourced, ...extra }
}

const groupIds = (shipments: Shipment[]) =>
  groupArrivals(shipments, NOW).map((group) => [group.id, group.shipments.map(({ id }) => id)])

describe('CP-02 arrivals agenda', () => {
  it('pins late, at risk, on hold and unknown on top, keeping the API order (BR-OT-03)', () => {
    const shipments = [
      arriving('late', new Date(2026, 10, 20), { onTime: 'late' }),
      arriving('risk', new Date(2026, 10, 12, 18), { onTime: 'at_risk' }),
      arriving('hold', new Date(2026, 10, 13), { status: 'on_hold' }),
      arriving('unknown', null, { onTime: 'unknown' }),
      arriving('fine', new Date(2026, 10, 12, 18)),
    ]
    expect(groupIds(shipments)).toEqual([
      ['attention', ['late', 'risk', 'hold', 'unknown']],
      ['today', ['fine']],
    ])
  })

  it('groups the rest by local ETA day: Today, Tomorrow, Next 7 days (rolling), Later', () => {
    const shipments = [
      arriving('today', new Date(2026, 10, 12, 23, 59)),
      arriving('tomorrow', new Date(2026, 10, 13, 0, 0)),
      arriving('day-after-tomorrow', new Date(2026, 10, 14, 0, 0)),
      arriving('seventh-day', new Date(2026, 10, 19, 23, 59)),
      arriving('eighth-day', new Date(2026, 10, 20, 0, 0)),
    ]
    expect(groupIds(shipments)).toEqual([
      ['today', ['today']],
      ['tomorrow', ['tomorrow']],
      ['next_7_days', ['day-after-tomorrow', 'seventh-day']],
      ['later', ['eighth-day']],
    ])
  })

  it('puts an on-time shipment with a past ETA in Today', () => {
    expect(groupIds([arriving('past', new Date(2026, 10, 11, 9))])).toEqual([['today', ['past']]])
  })

  it('leaves out empty groups', () => {
    expect(groupArrivals([], NOW)).toEqual([])
  })

  it('needs attention: on-time values and the on-hold status', () => {
    expect(needsAttention({ onTime: 'on_time', status: 'on_hold' })).toBe(true)
    expect(needsAttention({ onTime: 'on_time', status: 'in_customs' })).toBe(false)
  })
})

describe('CP-02 delivered view', () => {
  it('is one flat group, newest delivery first', () => {
    const older = arriving('older', new Date(2026, 10, 8))
    const newer = arriving('newer', new Date(2026, 10, 11))
    const group = deliveredArrivals([older, newer])
    expect(group.id).toBe('delivered')
    expect(group.shipments.map(({ id }) => id)).toEqual(['newer', 'older'])
  })
})
