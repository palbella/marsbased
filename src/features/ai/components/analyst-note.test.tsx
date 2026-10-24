// @vitest-environment jsdom
import '@/test/dom'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ShipmentSummaryInsight } from '@/domain'
import { DocumentList } from '@/features/documents'
import { HighlightProvider, ShipmentTimeline, TransitLine } from '@/features/shipments'
import { ROUTES } from '@/test/shipment-fixtures'
import { AnalystNote } from './analyst-note'

const SUMMARY: ShipmentSummaryInsight = {
  kind: 'summary',
  content: { text: 'Your order is on board the vessel to Veracruz.' },
  confidence: 0.9,
  evidence: [
    { text: 'Vessel departed Valencia', ref: { kind: 'milestone', id: 'ms_4' } },
    { text: 'BlueWave position report', ref: { kind: 'raw_event', id: 'raw_1' } },
    { text: 'Commercial invoice available', ref: { kind: 'document', id: 'doc_1' } },
    { text: 'Account tier: key' },
  ],
  generatedAt: '2026-11-12T10:00:00.000Z',
  model: 'mock-v1',
}

function renderPage() {
  const { shipment, timeline } = ROUTES.multimodalAtSea
  const document = {
    id: 'doc_1',
    shipmentId: shipment.id,
    type: 'commercial_invoice' as const,
    status: 'available' as const,
    fileName: 'invoice.pdf',
    size: 1000,
    uploadedAt: '2026-11-10T10:00:00.000Z',
  }
  return render(
    <HighlightProvider>
      <TransitLine variant="full" shipment={shipment} timeline={timeline} />
      <AnalystNote insight={SUMMARY}>{SUMMARY.content.text}</AnalystNote>
      <ShipmentTimeline shipment={shipment} timeline={timeline} />
      <DocumentList documents={[document]} onDownload={() => {}} />
    </HighlightProvider>,
  )
}

const highlighted = (container: HTMLElement) =>
  [...container.querySelectorAll<HTMLElement>('[data-highlighted]')].map(
    (element) => element.getAttribute('aria-label') ?? element.dataset.milestone ?? element.tagName,
  )

describe('SC-06 / DS-06 analyst note', () => {
  it('header with kind and confidence word, content and numbered footnotes', () => {
    renderPage()
    expect(screen.getByText('AI note · Summary · Confidence high')).toBeTruthy()
    expect(screen.getByText('Your order is on board the vessel to Veracruz.')).toBeTruthy()
    const footnotes = screen.getByRole('list', { name: 'Evidence' })
    expect(footnotes.textContent).toMatch(/\[1\].*\[2\].*\[3\].*\[4\] Account tier: key/)
  })

  it('a milestone footnote highlights its stop on the transit line and its timeline row', () => {
    const { container } = renderPage()
    fireEvent.focus(screen.getByRole('button', { name: /\[1\] Vessel departed/ }))
    expect(highlighted(container)).toEqual([
      'Vessel departed: Done, current position',
      'BUTTON',
      'vessel_departed',
    ])
  })

  it('a raw event footnote highlights the milestone it filled', () => {
    const { container } = renderPage()
    fireEvent.mouseEnter(screen.getByRole('button', { name: /\[2\] BlueWave/ }))
    expect(highlighted(container)).toContain('departed_site')
  })

  it('a document footnote highlights the document row', () => {
    const { container } = renderPage()
    fireEvent.focus(screen.getByRole('button', { name: /\[3\] Commercial invoice/ }))
    expect(highlighted(container)).toContain('LI')
  })

  it('renders nothing without an insight (failed or null), a skeleton while loading', () => {
    const { container } = render(<AnalystNote insight={null}>text</AnalystNote>)
    expect(container.innerHTML).toBe('')
    render(
      <AnalystNote insight={undefined} loading>
        text
      </AnalystNote>,
    )
    expect(screen.getByRole('status').textContent).toContain('Loading AI note')
  })

  it('actionable variant: Use, Edit and Dismiss call back', () => {
    const onUse = vi.fn()
    const onDismiss = vi.fn()
    render(
      <AnalystNote insight={SUMMARY} heading="Priority 92" onUse={onUse} onDismiss={onDismiss}>
        text
      </AnalystNote>,
    )
    expect(screen.getByText('AI note · Priority 92 · Confidence high')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Use' }))
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(screen.queryByRole('button', { name: 'Edit' })).toBeNull()
    expect(onUse).toHaveBeenCalledOnce()
    expect(onDismiss).toHaveBeenCalledOnce()
  })
})
