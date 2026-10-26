import { describe, expect, it } from 'vitest'
import type { Shipment } from '@/domain'
import { ROUTES } from '@/test/shipment-fixtures'
import {
  nextSort,
  parsePortfolioParams,
  toPortfolioSearchParams,
  type PortfolioSort,
} from './portfolio-params'
import { sortPortfolio } from './portfolio-sort'

const base = ROUTES.roadInTransit.shipment

function shipment(id: string, etaDay: number | null, extra: Partial<Shipment> = {}): Shipment {
  const eta =
    base.eta && etaDay !== null
      ? { ...base.eta, value: new Date(Date.UTC(2026, 10, etaDay)).toISOString() }
      : null
  return { ...base, id, eta, ...extra }
}

const ids = (shipments: Shipment[], sort: PortfolioSort | null) =>
  sortPortfolio(shipments, sort).map(({ id }) => id)

describe('OP-22 portfolio sort', () => {
  const shipments = [
    shipment('late-20', 20, { onTime: 'late', status: 'in_customs' }),
    shipment('unknown-eta', null, { onTime: 'unknown', status: 'booked' }),
    shipment('ok-14', 14, { onTime: 'on_time', status: 'delivered' }),
    shipment('risk-16', 16, { onTime: 'at_risk', status: 'in_transit' }),
  ]

  it('keeps the API order without a sort', () => {
    expect(ids(shipments, null)).toEqual(['late-20', 'unknown-eta', 'ok-14', 'risk-16'])
  })

  it('sorts by ETA ascending with an unknown ETA last, in both directions', () => {
    expect(ids(shipments, { key: 'eta', direction: 'asc' })).toEqual([
      'ok-14',
      'risk-16',
      'late-20',
      'unknown-eta',
    ])
    expect(ids(shipments, { key: 'eta', direction: 'desc' })).toEqual([
      'late-20',
      'risk-16',
      'ok-14',
      'unknown-eta',
    ])
  })

  it('sorts by status in journey order', () => {
    expect(ids(shipments, { key: 'status', direction: 'asc' })).toEqual([
      'unknown-eta',
      'risk-16',
      'late-20',
      'ok-14',
    ])
  })

  it('sorts by on-time: late, at risk, unknown, on time', () => {
    expect(ids(shipments, { key: 'onTime', direction: 'asc' })).toEqual([
      'late-20',
      'risk-16',
      'unknown-eta',
      'ok-14',
    ])
  })

  it('reverses on a second click on the same column', () => {
    const first = nextSort(null, 'eta')
    expect(first).toEqual({ key: 'eta', direction: 'asc' })
    expect(nextSort(first, 'eta')).toEqual({ key: 'eta', direction: 'desc' })
    expect(nextSort({ key: 'eta', direction: 'desc' }, 'status')).toEqual({
      key: 'status',
      direction: 'asc',
    })
  })
})

describe('OP-21 portfolio URL', () => {
  it('round-trips filters and sort, dropping invalid values', () => {
    const params = new URLSearchParams(
      'q=SH-104&site=site_zgz&mode=sea&scope=international&status=nope&sort=onTime&order=desc',
    )
    const parsed = parsePortfolioParams(params)
    expect(parsed).toEqual({
      filters: { q: 'SH-104', site: 'site_zgz', mode: 'sea', scope: 'international' },
      sort: { key: 'onTime', direction: 'desc' },
    })
    expect(toPortfolioSearchParams(parsed).toString()).toBe(
      'q=SH-104&site=site_zgz&mode=sea&scope=international&sort=onTime&order=desc',
    )
  })

  it('writes nothing for the default view', () => {
    expect(toPortfolioSearchParams({ filters: {}, sort: null }).toString()).toBe('')
  })
})
