import { describe, expect, it } from 'vitest'
import { hasQueueFilters, parseQueueFilters, toQueueSearchParams } from './queue-filters'

describe('OP-04 queue filters in the URL', () => {
  it('reads every filter and ignores the shipment id', () => {
    const params = new URLSearchParams(
      'site=site_vlc&operator=op_bws&mode=sea&type=delay&status=all&shipmentId=shp_001',
    )
    expect(parseQueueFilters(params)).toEqual({
      site: 'site_vlc',
      operator: 'op_bws',
      mode: 'sea',
      type: 'delay',
      status: 'all',
    })
  })

  it('drops invalid values one by one', () => {
    const params = new URLSearchParams('type=flood&mode=air&site=site_zgz')
    expect(parseQueueFilters(params)).toEqual({ site: 'site_zgz' })
  })

  it('OP-10: writes the filters and keeps the open exception', () => {
    const params = toQueueSearchParams({ type: 'hold', mode: undefined }, 'exc_001')
    expect(params.toString()).toBe('type=hold&exception=exc_001')
  })

  it('knows when nothing is filtered', () => {
    expect(hasQueueFilters({})).toBe(false)
    expect(hasQueueFilters({ status: 'resolved' })).toBe(true)
  })
})
