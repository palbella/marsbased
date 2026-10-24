import { describe, expect, it } from 'vitest'
import { ROUTES } from '@/test/shipment-fixtures'
import { compactRoute, sectionFill } from './compact-route'

const fills = (route: ReturnType<typeof compactRoute>) =>
  route.sections.map((_, index) => sectionFill(route, index))

describe('SC-04 compact transit line route', () => {
  it('road only: one section, the marker mid-way while in transit', () => {
    const route = compactRoute(ROUTES.roadInTransit.shipment)
    expect(route.origin).toBe('Zaragoza Plant')
    expect(route.sections.map((section) => section.endPlace)).toEqual(['Madrid'])
    expect(route.marker).toEqual({ sectionIndex: 0, atEnd: false })
    expect(fills(route)).toEqual(['partial'])
  })

  it('booked: no marker and every section dashed', () => {
    const route = compactRoute(ROUTES.roadBooked.shipment)
    expect(route.marker).toBeNull()
    expect(fills(route)).toEqual(['dashed'])
  })

  it('BR-MS-02 multimodal: customs sits after the sea leg, before the last mile', () => {
    const route = compactRoute(ROUTES.multimodalAtSea.shipment)
    expect(route.sections.map((section) => section.endPlace)).toEqual([
      'Valencia port',
      'Veracruz',
      'Customs',
      'Querétaro',
    ])
    expect(route.marker).toEqual({ sectionIndex: 1, atEnd: false })
    expect(fills(route)).toEqual(['solid', 'partial', 'dashed', 'dashed'])
  })

  it('on hold: the marker is in the customs block', () => {
    const route = compactRoute(ROUTES.multimodalOnHold.shipment)
    expect(route.marker).toEqual({ sectionIndex: 2, atEnd: false })
  })

  it('a milestone that closes its section puts the marker on the place', () => {
    const route = compactRoute({
      ...ROUTES.multimodalAtSea.shipment,
      lastDoneMilestone: { legId: 'leg_m2', type: 'discharged' },
    })
    expect(route.marker).toEqual({ sectionIndex: 1, atEnd: true })
    expect(fills(route)).toEqual(['solid', 'solid', 'dashed', 'dashed'])
  })

  it('delivered: the marker on the final stop and everything solid', () => {
    const route = compactRoute(ROUTES.multimodalDelivered.shipment)
    expect(route.marker).toEqual({ sectionIndex: 3, atEnd: true })
    expect(fills(route)).toEqual(['solid', 'solid', 'solid', 'solid'])
  })

  it('no customs stop for a sea route without customs', () => {
    const route = compactRoute({ ...ROUTES.multimodalAtSea.shipment, hasCustoms: false })
    expect(route.sections.map((section) => section.endPlace)).not.toContain('Customs')
  })
})
