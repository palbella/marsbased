// @vitest-environment jsdom
import '@/test/dom'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ROUTES } from '@/test/shipment-fixtures'
import { ShipmentTimeline } from './shipment-timeline'

const rowOf = (container: HTMLElement, index: number) =>
  container.querySelectorAll<HTMLElement>('li[data-state]')[index]

describe('SC-05 shipment timeline', () => {
  it('groups milestones by leg with mode, operator and tracking number', () => {
    const { shipment, timeline } = ROUTES.multimodalAtSea
    render(<ShipmentTimeline shipment={shipment} timeline={timeline} />)
    const headings = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)
    expect(headings).toEqual([
      'Road: PortLinkOP_PLD-leg_m1',
      'Sea: BlueWaveOP_BWS-leg_m2',
      'Customs',
      'Road: LastMile MXOP_LMX-leg_m3',
    ])
  })

  it('BR-MS-04: done, not reported, overdue and pending each have a shape and a word', () => {
    const atSea = ROUTES.multimodalAtSea
    const { container } = render(
      <ShipmentTimeline shipment={atSea.shipment} timeline={atSea.timeline} />,
    )
    expect(rowOf(container, 0)?.dataset.state).toBe('done')
    expect(rowOf(container, 3)?.textContent).toContain('Not reported by operator')
    expect(rowOf(container, 5)?.textContent).toContain('Pending')

    const road = ROUTES.roadInTransit
    const { container: roadRows } = render(
      <ShipmentTimeline shipment={road.shipment} timeline={road.timeline} />,
    )
    expect(rowOf(roadRows, 2)?.textContent).toContain('Overdue')
  })

  it('BR-MS-05: an open customs hold is stamped on the customs block', () => {
    const { shipment, timeline } = ROUTES.multimodalOnHold
    render(<ShipmentTimeline shipment={shipment} timeline={timeline} />)
    const customs = screen.getByRole('region', { name: 'Customs' })
    expect(customs.textContent).toContain('Customs hold')
    expect(screen.getByText('On hold').className).toContain('-rotate-2')
  })

  it('06 §4: the ops variant fills the raw event column from the slot', () => {
    const { shipment, timeline } = ROUTES.roadInTransit
    render(
      <ShipmentTimeline
        shipment={shipment}
        timeline={timeline}
        variant="ops"
        renderRawEvent={(id) => `event ${id}`}
      />,
    )
    expect(screen.getByText('event raw_0')).toBeTruthy()
    expect(screen.getByText('Operator event')).toBeTruthy()
  })
})
