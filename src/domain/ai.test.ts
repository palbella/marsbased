import { describe, expect, it } from 'vitest'
import {
  draftMessageInsightSchema,
  etaPredictionInsightSchema,
  mappingSuggestionInsightSchema,
  priorityInsightSchema,
  shipmentSummaryInsightSchema,
} from './ai'

const envelope = {
  confidence: 0.9,
  evidence: [
    {
      text: 'Vessel departed Valencia 18 h late',
      ref: { kind: 'milestone', id: 'ms_leg_016_2_vessel_departed' },
    },
    { text: 'BlueWave ETA update, 2 h ago', ref: { kind: 'raw_event', id: 'evt_016_14' } },
    { text: 'Key account' },
  ],
  generatedAt: '2026-11-05T10:00:00Z',
  model: 'mock-v1',
}

const predictedEta = {
  value: '2026-11-15T12:00:00Z',
  provenance: 'predicted',
  source: 'ai',
  observedAt: '2026-11-05T10:00:00Z',
}

const insights = [
  {
    name: 'summary (BR-AI-01)',
    schema: shipmentSummaryInsightSchema,
    value: { ...envelope, kind: 'summary', content: { text: 'Your order is on board…' } },
  },
  {
    name: 'eta_prediction (BR-AI-05)',
    schema: etaPredictionInsightSchema,
    value: { ...envelope, kind: 'eta_prediction', content: { predictedEta } },
  },
  {
    name: 'priority (BR-AI-02)',
    schema: priorityInsightSchema,
    value: {
      ...envelope,
      kind: 'priority',
      content: {
        score: 92,
        rationale: 'Ranked first: high-severity hold on a key account.',
        factors: { severity: 3, impact: 2, urgency: 1.5, age: 1 },
      },
    },
  },
  {
    name: 'draft (BR-AI-03)',
    schema: draftMessageInsightSchema,
    value: {
      ...envelope,
      kind: 'draft',
      content: { subject: 'Delay on SH-10436', message: 'Dear customer…', requiresAction: false },
    },
  },
  {
    name: 'mapping (BR-AI-04)',
    schema: mappingSuggestionInsightSchema,
    value: {
      ...envelope,
      kind: 'mapping',
      content: { candidates: [{ target: 'delivered', score: 0.75 }] },
    },
  },
]

describe('AiInsight schemas', () => {
  it.each(insights)('parses a $name insight', ({ schema, value }) => {
    expect(schema.parse(value)).toEqual(value)
  })

  it('rejects an insight whose kind does not match its schema', () => {
    const value = { ...envelope, kind: 'draft', content: { text: 'Summary' } }
    expect(shipmentSummaryInsightSchema.safeParse(value).success).toBe(false)
  })

  it('rejects a confidence outside 0..1 (P3)', () => {
    const value = { ...envelope, confidence: 1.2, kind: 'summary', content: { text: 'Hi' } }
    expect(shipmentSummaryInsightSchema.safeParse(value).success).toBe(false)
  })

  it('rejects evidence as plain text or with an unknown reference kind (02 §6.3)', () => {
    const value = (evidence: unknown) => ({
      ...envelope,
      evidence,
      kind: 'summary',
      content: { text: 'Hi' },
    })
    expect(shipmentSummaryInsightSchema.safeParse(value(['Key account'])).success).toBe(false)
    const unknownRef = [{ text: 'Key account', ref: { kind: 'account', id: 'acc_001' } }]
    expect(shipmentSummaryInsightSchema.safeParse(value(unknownRef)).success).toBe(false)
  })

  it('rejects a predicted ETA not labelled as predicted (BR-ETA-06)', () => {
    const content = { predictedEta: { ...predictedEta, provenance: 'estimated' } }
    const value = { ...envelope, kind: 'eta_prediction', content }
    expect(etaPredictionInsightSchema.safeParse(value).success).toBe(false)
  })

  it('rejects a mapping target outside BR-NM-01', () => {
    const content = { candidates: [{ target: 'lost_in_transit', score: 0.5 }] }
    const value = { ...envelope, kind: 'mapping', content }
    expect(mappingSuggestionInsightSchema.safeParse(value).success).toBe(false)
  })

  it('rejects more than 3 mapping candidates (BR-AI-04)', () => {
    const candidate = { target: 'delivered', score: 0.5 }
    const content = { candidates: [candidate, candidate, candidate, candidate] }
    const value = { ...envelope, kind: 'mapping', content }
    expect(mappingSuggestionInsightSchema.safeParse(value).success).toBe(false)
  })
})
