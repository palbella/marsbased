import { describe, expect, it } from 'vitest'
import { parseArrivalFilters, statusOptions, toSearchParams } from './arrival-filters'

describe('CP-01, CP-04 arrival filters in the URL', () => {
  it('reads q, status, onTime and view', () => {
    const params = new URLSearchParams('q= sh-104 &status=in_customs&onTime=late&view=delivered')
    expect(parseArrivalFilters(params)).toEqual({
      view: 'delivered',
      q: 'sh-104',
      status: 'in_customs',
      onTime: 'late',
    })
  })

  it('defaults to the active view and ignores unknown or empty values', () => {
    const params = new URLSearchParams('q=&status=delivered&onTime=soon&view=all')
    expect(parseArrivalFilters(params)).toEqual({
      view: 'active',
      q: undefined,
      status: undefined,
      onTime: undefined,
    })
  })

  it('writes only what is set, leaving the default view out', () => {
    expect(toSearchParams({ view: 'active', onTime: 'at_risk' }).toString()).toBe('onTime=at_risk')
    expect(toSearchParams({ view: 'delivered', q: 'SH' }).toString()).toBe('view=delivered&q=SH')
  })

  it('offers every status except delivered', () => {
    expect(statusOptions).not.toContain('delivered')
    expect(statusOptions).toHaveLength(6)
  })
})
