// @vitest-environment jsdom
import '@/test/dom'
import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ROUTES } from '@/test/shipment-fixtures'
import { TransitLine } from './transit-line'

type Route = (typeof ROUTES)[keyof typeof ROUTES]

function renderCompact({ shipment }: Route) {
  const { container } = render(<TransitLine variant="compact" shipment={shipment} />)
  const styles = [...container.querySelectorAll('line')].map((line) => line.dataset.style)
  return {
    styles,
    marker: container.querySelector('[data-testid="marker"]'),
    customs: container.querySelectorAll('[data-testid="customs-stop"]').length,
    text: container.textContent,
  }
}

function renderFull({ shipment, timeline }: Route) {
  render(<TransitLine variant="full" shipment={shipment} timeline={timeline} />)
  const stops = within(screen.getByRole('group', { name: 'Route' })).getAllByRole('button')
  const glyphs = stops.map((stop) => stop.querySelector('svg')?.dataset.glyph)
  return { stops, glyphs }
}

describe('SC-04 compact transit line, every route in 07 §4', () => {
  it('road only, in transit: half solid, half dashed, marker, no customs', () => {
    const line = renderCompact(ROUTES.roadInTransit)
    expect(line.styles).toEqual(['solid', 'dashed'])
    expect(line.marker).not.toBeNull()
    expect(line.customs).toBe(0)
    expect(line.text).toContain('Now between Zaragoza Plant and Madrid')
  })

  it('booked: all dashed, no marker', () => {
    const line = renderCompact(ROUTES.roadBooked)
    expect(line.styles).toEqual(['dashed'])
    expect(line.marker).toBeNull()
    expect(line.text).toContain('Not departed yet')
  })

  it('multimodal with customs: a customs stop, solid behind the vessel', () => {
    const line = renderCompact(ROUTES.multimodalAtSea)
    expect(line.customs).toBe(1)
    expect(line.styles).toEqual(['solid', 'solid', 'dashed', 'dashed', 'dashed'])
  })

  it('on hold: the marker sits in the customs block, outlined in --late and said in words', () => {
    const { container } = render(
      <TransitLine variant="compact" shipment={ROUTES.multimodalOnHold.shipment} />,
    )
    const customs = container.querySelector('[data-testid="customs-stop"]')
    expect(customs?.getAttribute('data-held')).toBe('true')
    expect(customs?.getAttribute('class')).toContain('stroke-late')
    expect(container.textContent).toContain('Now between Veracruz and Customs. On hold in customs.')
  })

  it('delivered: all solid, marker on the destination', () => {
    const line = renderCompact(ROUTES.multimodalDelivered)
    expect(line.styles.every((style) => style === 'solid')).toBe(true)
    expect(line.text).toContain('Now at Querétaro')
  })
})

describe('SC-04 full transit line, every route in 07 §4', () => {
  it('road only: one stop per milestone, current marker on the latest done, overdue shown', () => {
    const { glyphs } = renderFull(ROUTES.roadInTransit)
    expect(glyphs).toEqual(['done', 'current', 'overdue', 'pending'])
    expect(screen.getByRole('button', { name: /Out for delivery: Overdue/ })).toBeTruthy()
  })

  it('booked: no current marker, every segment dashed', () => {
    const { glyphs } = renderFull(ROUTES.roadBooked)
    expect(glyphs).not.toContain('current')
    const lines = [...document.querySelectorAll('[data-testid="full-line"] line')]
    expect(lines.every((line) => line.getAttribute('data-style') === 'dashed')).toBe(true)
  })

  it('multimodal with customs: customs is one stamp-shaped stop, not reported shown hollow', () => {
    const { stops, glyphs } = renderFull(ROUTES.multimodalAtSea)
    expect(stops).toHaveLength(11)
    expect(glyphs.filter((glyph) => glyph === 'customs')).toHaveLength(1)
    expect(glyphs[3]).toBe('not_reported')
    expect(screen.getByText('Valencia Warehouse')).toBeTruthy()
    expect(screen.getByText('BlueWave')).toBeTruthy()
  })

  it('on hold: the customs stop keeps its --late outline and label besides the marker', () => {
    renderFull(ROUTES.multimodalOnHold)
    const stop = screen.getByRole('button', { name: 'Customs: On hold, current position' })
    const glyph = stop.querySelector('svg')
    expect(glyph?.dataset.glyph).toBe('hold')
    expect(glyph?.dataset.current).toBe('true')
    expect(glyph?.querySelector('rect')?.getAttribute('class')).toContain('stroke-late')
    expect(glyph?.querySelector('.fill-signal')).not.toBeNull()
    expect(screen.getByText('Customs · on hold')).toBeTruthy()
  })

  it('delivered: the marker on the final stop', () => {
    const { glyphs } = renderFull(ROUTES.multimodalDelivered)
    expect(glyphs.at(-1)).toBe('current')
  })
})
