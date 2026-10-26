// @vitest-environment jsdom
import '@/test/dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render as renderBare, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import type { OnTimeIndicator as OnTimeValue } from '@/domain'
import { FIXTURE_NOW, ROUTES } from '@/test/shipment-fixtures'
import { OnTimeIndicator } from './on-time-indicator'
import { ShipmentStatus } from './shipment-status'

// The indicator reads the simulation clock through a query (BR-TM-01); `now` is passed, so no
// request is needed.
function render(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, enabled: false } } })
  return renderBare(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

const WORDS: [OnTimeValue, string][] = [
  ['on_time', 'On time'],
  ['at_risk', 'At risk'],
  ['late', 'Late'],
  ['unknown', 'Unknown'],
]

describe('SC-02 on-time indicator', () => {
  it.each(WORDS)('%s shows the word "%s", not colour alone (NFR-04)', (onTime, word) => {
    const shipment = { ...ROUTES.roadInTransit.shipment, onTime }
    render(<OnTimeIndicator shipment={shipment} now={FIXTURE_NOW} />)
    expect(screen.getByText(word)).toBeTruthy()
  })

  it('explains the reason on keyboard focus', async () => {
    const shipment = { ...ROUTES.roadInTransit.shipment, onTime: 'on_time' as const }
    render(<OnTimeIndicator shipment={shipment} now={FIXTURE_NOW} />)
    await userEvent.tab()
    const tooltip = await screen.findByRole('tooltip')
    expect(tooltip.textContent).toBe('ETA on or before the committed date')
  })
})

describe('SC-01 shipment status', () => {
  it('condensed text with its word', () => {
    render(<ShipmentStatus status="in_transit" />)
    expect(screen.getByText('In transit').className).toContain('uppercase')
  })

  it('DELIVERED and ON HOLD become stamps when asked', () => {
    render(
      <>
        <ShipmentStatus status="delivered" stamped />
        <ShipmentStatus status="on_hold" stamped />
        <ShipmentStatus status="at_port" stamped />
      </>,
    )
    expect(screen.getByText('Delivered').className).toContain('-rotate-2')
    expect(screen.getByText('On hold').className).toContain('-rotate-2')
    expect(screen.getByText('At port').className).not.toContain('-rotate-2')
  })
})
