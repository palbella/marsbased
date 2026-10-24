// @vitest-environment jsdom
import '@/test/dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import type { SourcedDate as SourcedDateValue } from '@/domain'
import { SourcedDate } from './sourced-date'

const VALUE = '2026-11-14T10:20:00.000Z'
const operators = { op_bws: 'BlueWave' }

function date(provenance: SourcedDateValue['provenance'], source: string): SourcedDateValue {
  return { value: VALUE, provenance, source, observedAt: '2026-11-12T14:05:00.000Z' }
}

describe('DS-05 / SC-03 provenance typography', () => {
  it('confirmed: regular ink, no prefix', () => {
    render(<SourcedDate date={date('confirmed', 'op_bws')} operators={operators} />)
    const time = screen.getByRole('time')
    expect(time.className).toContain('text-ink')
    expect(time.className).not.toContain('italic')
    expect(time.textContent).not.toMatch(/[≈~]/)
  })

  it('estimated: ≈ prefix in muted ink, announced as estimated', () => {
    render(<SourcedDate date={date('estimated', 'op_bws')} operators={operators} />)
    const time = screen.getByRole('time')
    expect(time.textContent).toMatch(/^≈ Estimated: /)
    expect(time.className).toContain('text-ink-muted')
  })

  it('predicted: ~ prefix, italic cobalt, dotted underline and the AI tag', () => {
    render(<SourcedDate date={date('predicted', 'ai')} confidence={0.68} />)
    const time = screen.getByRole('time')
    expect(time.textContent).toMatch(/^~ Predicted: /)
    expect(time.className).toContain('italic')
    expect(time.className).toContain('text-predicted')
    expect(time.className).toContain('decoration-dotted')
    expect(screen.getByText('AI 68%')).toBeTruthy()
  })

  it('BR-ETA-05: an outdated date says so', () => {
    render(<SourcedDate date={date('estimated', 'system')} outdated lastUpdatedAt={VALUE} />)
    expect(screen.getByText(/may be outdated/)).toBeTruthy()
  })

  it('the source tooltip opens on keyboard focus', async () => {
    render(<SourcedDate date={date('estimated', 'op_bws')} operators={operators} />)
    await userEvent.tab()
    expect(screen.getByRole('time')).toBe(document.activeElement)
    const tooltip = await screen.findByRole('tooltip')
    expect(tooltip.textContent).toMatch(/^Estimated by BlueWave · 12 Nov/)
  })
})
