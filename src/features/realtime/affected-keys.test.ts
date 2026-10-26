import { describe, expect, it } from 'vitest'
import { affectedKeys } from './affected-keys'

describe('BR-RT-02 invalidation per thin event', () => {
  it('shipment.updated refreshes the lists, the detail subtree and its AI notes', () => {
    expect(affectedKeys({ type: 'shipment.updated', shipmentId: 'shp_015' })).toEqual([
      ['shipments', 'list'],
      ['shipments', 'detail', 'shp_015'],
      ['ai', 'summary', 'shp_015'],
      ['ai', 'eta-prediction', 'shp_015'],
    ])
  })

  it('exception.changed refreshes the queue, the exception, its priority and the counts', () => {
    const keys = affectedKeys({
      type: 'exception.changed',
      shipmentId: 'shp_016',
      exceptionId: 'exc_001',
    })
    expect(keys).toContainEqual(['exceptions', 'list'])
    expect(keys).toContainEqual(['exceptions', 'detail', 'exc_001'])
    expect(keys).toContainEqual(['ai', 'priority', 'exc_001'])
    expect(keys).toContainEqual(['shipments', 'list'])
  })

  it('alert.created refreshes the alerts, where the toast is raised from (CP-31)', () => {
    expect(affectedKeys({ type: 'alert.created', shipmentId: 's', alertId: 'a' })).toEqual([
      ['alerts'],
    ])
  })

  it('document.changed refreshes the documents and the activity of that shipment', () => {
    expect(affectedKeys({ type: 'document.changed', shipmentId: 'shp_017' })).toEqual([
      ['documents', 'list', 'shp_017'],
      ['shipments', 'detail', 'shp_017', 'activity'],
    ])
  })

  it('mapping.changed refreshes the unmapped list and the suggestions', () => {
    expect(affectedKeys({ type: 'mapping.changed' })).toEqual([
      ['mappings'],
      ['ai', 'mapping-suggestion'],
    ])
  })

  it('simulator.changed refreshes the clock, the scenarios and the network mode', () => {
    expect(affectedKeys({ type: 'simulator.changed' })).toEqual([
      ['simulator', 'clock'],
      ['simulator', 'scenarios'],
      ['simulator', 'network'],
    ])
  })

  it('data.reset refreshes everything', () => {
    expect(affectedKeys({ type: 'data.reset' })).toBeNull()
  })
})
