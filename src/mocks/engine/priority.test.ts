import { describe, expect, it } from 'vitest'
import type { ExceptionRow } from '@/mocks/db/tables/exceptions'
import { loadShipmentFacts } from './facts'
import { comparePriority, scorePriority } from './priority'
import { deriveShipment } from './shipment-view'
import { NOW, at } from './test-fixtures'
import { seededTables } from './test-db'

const db = seededTables()

function exception(shipmentId: string, overrides: Partial<ExceptionRow> = {}): ExceptionRow {
  return {
    id: 'exc_t',
    shipmentId,
    type: 'delay',
    severity: 'high',
    status: 'open',
    waitingOn: null,
    assigneeId: null,
    detectedAt: at(-1),
    resolvedAt: null,
    resolutionNote: null,
    ...overrides,
  }
}

function score(row: ExceptionRow, activity = db.activity.all()) {
  const facts = loadShipmentFacts(db, row.shipmentId)
  if (!facts) throw new Error(`No facts for ${row.shipmentId}`)
  return scorePriority(row, facts, deriveShipment(facts, NOW), activity, NOW)
}

describe('BR-PR-01 Score', () => {
  it('multiplies severity, impact, urgency and age (SH-10441 hold: 3 × 2 × 1.5 × 1 → 90)', () => {
    expect(score(exception('shp_018', { type: 'hold' }))).toMatchObject({
      score: 90,
      factors: { severity: 3, impact: 2, urgency: 1.5, age: 1 },
    })
  })

  it('domestic standard account, medium, ETA within 72 h (SH-10409: 2 × 1 × 1.2 → 24)', () => {
    expect(score(exception('shp_009', { severity: 'medium' }))).toMatchObject({
      score: 24,
      factors: { severity: 2, impact: 1, urgency: 1.2, age: 1 },
    })
  })

  it('ages after 24 h open without any action, and caps the score at 100', () => {
    const unattended = exception('shp_018', { detectedAt: at(-30) })

    expect(score(unattended)).toMatchObject({ score: 100, factors: { age: 1.2 } })
    const acted = [{ id: 'act_t', shipmentId: 'shp_018', exceptionId: 'exc_t', userId: 'usr_010', type: 'acknowledge' as const, payload: {}, at: at(-2) }] // prettier-ignore
    expect(score(unattended, acted).factors.age).toBe(1)
  })

  it('urgency is 1.0 with the ETA 72 h or more away (SH-10433)', () => {
    expect(score(exception('shp_015')).factors.urgency).toBe(1)
  })
})

describe('BR-PR-02 Order', () => {
  it('sorts by score descending, then the older exception first', () => {
    const rows = [
      { id: 'b', score: 60, detectedAt: at(-2) },
      { id: 'c', score: 48, detectedAt: at(-30) },
      { id: 'a', score: 60, detectedAt: at(-24) },
      { id: 'd', score: 90, detectedAt: at(-5) },
    ]

    expect(rows.sort(comparePriority).map((row) => row.id)).toEqual(['d', 'a', 'b', 'c'])
  })
})

describe('BR-PR-03 Explanation', () => {
  it('lists each factor that raised the score in words', () => {
    expect(score(exception('shp_018', { detectedAt: at(-30) })).labels).toEqual([
      'High severity',
      'Key account',
      'International',
      'ETA in 19 h',
      'Open 30 h without action',
    ])
  })
})
