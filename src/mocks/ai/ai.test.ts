import { describe, expect, it } from 'vitest'
import {
  draftMessageInsightSchema,
  etaPredictionInsightSchema,
  mappingSuggestionInsightSchema,
  priorityInsightSchema,
  shipmentSummaryInsightSchema,
} from '@/domain'
import { loadShipmentFacts } from '@/mocks/engine/facts'
import { recompute } from '@/mocks/engine/recompute'
import { deriveShipment } from '@/mocks/engine/shipment-view'
import { NOW } from '@/mocks/engine/test-fixtures'
import { hoursLater, openExceptions, seededTables } from '@/mocks/engine/test-db'
import { draftMessage } from './draft-message'
import { suggestMapping } from './mapping-suggestion'
import { predictEtaInsight, predictionAgrees } from './predicted-eta'
import { explainPriority } from './priority-rationale'
import { summarise } from './summary'

const db = seededTables()
for (const shipment of db.shipments.all()) recompute(db, shipment.id, NOW)

function shipment(shipmentId: string, now = NOW) {
  const facts = loadShipmentFacts(db, shipmentId)
  if (!facts) throw new Error(`No facts for ${shipmentId}`)
  return { facts, view: deriveShipment(facts, now) }
}

function withException(shipmentId: string) {
  const [exception] = openExceptions(db, shipmentId)
  if (!exception) throw new Error(`${shipmentId} should have an open exception`)
  return { exception, ...shipment(shipmentId) }
}

describe('BR-AI-01 Shipment summary', () => {
  it('says where it is, timing, ETA with its source and the next milestone (SH-10436)', () => {
    const { facts, view } = shipment('shp_016')
    const summary = summarise(facts, view, NOW)

    expect(shipmentSummaryInsightSchema.parse(summary)).toEqual(summary)
    expect(summary.content.text).toBe(
      'Your order is on board the BW Aurora to Port of Veracruz, about 1 day behind plan. Expected delivery Tue 17 Nov (our estimate). Next: arrival at Port of Veracruz.',
    )
    expect(summary).toMatchObject({ model: 'mock-v1', confidence: 0.9 })
    expect(summary.evidence.map((item) => item.ref?.kind)).toEqual([
      'milestone',
      'raw_event',
      'milestone',
    ])
  })

  it('names the operator behind an operator estimate (SH-10402, EuroRoad)', () => {
    const { facts, view } = shipment('shp_002')

    expect(summarise(facts, view, NOW).content.text).toContain('(estimated by EuroRoad)')
  })

  it('explains an open hold in customer terms (SH-10441)', () => {
    const { facts, view } = shipment('shp_018')

    expect(summarise(facts, view, NOW).content.text).toContain('Customs has put it on hold')
  })

  it('lowers the confidence to 0.6 for a stale shipment (SH-10406)', () => {
    const { facts, view } = shipment('shp_006')

    expect(summarise(facts, view, NOW).confidence).toBe(0.6)
  })
})

describe('BR-AI-02 Priority rationale', () => {
  it('gives the score with its factors as evidence (SH-10441 hold)', () => {
    const { exception, facts, view } = withException('shp_018')
    const rationale = explainPriority(exception, facts, view, db.activity.all(), NOW)

    expect(priorityInsightSchema.parse(rationale)).toEqual(rationale)
    expect(rationale).toMatchObject({ confidence: 0.85, content: { score: 90 } })
    expect(rationale.evidence.map((item) => item.text)).toEqual([
      'High severity',
      'Key account',
      'International',
      'ETA in 19 h',
    ])
  })

  it('loses 0.2 confidence when the shipment is stale (SH-10406)', () => {
    const { exception, facts, view } = withException('shp_006')

    expect(explainPriority(exception, facts, view, [], NOW).confidence).toBe(0.65)
  })
})

describe('BR-AI-03 Drafted customer message', () => {
  it('fills the template with the reference, what happened and old → new ETA', () => {
    const { exception, facts, view } = withException('shp_016')
    const draft = draftMessage(exception, facts, view, NOW)

    expect(draftMessageInsightSchema.parse(draft)).toEqual(draft)
    expect(draft).toMatchObject({
      confidence: 0.8,
      content: { subject: 'SH-10436: updated delivery estimate', requiresAction: false },
    })
    expect(draft.content.message).toContain('Dear customer,')
    expect(draft.content.message).toContain('running about 1 day behind schedule')
    expect(draft.content.message).toContain(
      'The committed delivery date was Mon 16 Nov; the current estimate is Tue 17 Nov',
    )
  })
})

describe('BR-AI-04 Mapping suggestion', () => {
  it('suggests delivered at about 75% for "Parcel handed to recipient" (SIM-04)', () => {
    const suggestion = suggestMapping(
      { rawEventId: 'evt_x', label: 'Parcel handed to recipient' },
      NOW,
    )

    expect(mappingSuggestionInsightSchema.parse(suggestion)).toEqual(suggestion)
    expect(suggestion.content.candidates[0]).toEqual({ target: 'delivered', score: 0.75 })
    expect(suggestion.confidence).toBe(0.75)
    expect(suggestion.evidence[0]?.ref).toEqual({ kind: 'raw_event', id: 'evt_x' })
  })

  it('normalises accents, case and punctuation', () => {
    const suggestion = suggestMapping({ rawEventId: 'evt_x', label: 'ENTREGADO… Délivered!' }, NOW)

    expect(suggestion.content.candidates[0]?.target).toBe('delivered')
  })

  it('has no confident suggestion below 0.4 (RET-PLAT)', () => {
    const suggestion = suggestMapping({ rawEventId: 'evt_x', label: 'RET-PLAT' }, NOW)

    expect(suggestion.content.candidates).toEqual([])
  })
})

describe('BR-AI-05 Predicted ETA', () => {
  it('predicts SH-10432 on BW Meridian about 35 h late at 0.75, flagging it at risk', () => {
    const { facts, view } = shipment('shp_014')
    const prediction = predictEtaInsight(facts, view, NOW)

    expect(prediction && etaPredictionInsightSchema.parse(prediction)).toEqual(prediction)
    expect(prediction?.confidence).toBe(0.75)
    expect(view.prediction?.delayHours).toBeCloseTo(216 * 0.15 + 12 * 0.2, 5)
    expect(prediction?.content.predictedEta).toMatchObject({
      provenance: 'predicted',
      source: 'ai',
    })
    expect(view.onTime).toBe('at_risk')
  })

  it('agrees with the ETA within 2 h, and loses 0.1 confidence when stale', () => {
    expect(predictionAgrees(shipment('shp_001').view)).toBe(true)
    expect(predictionAgrees(shipment('shp_014').view)).toBe(false)
    expect(shipment('shp_015').view.prediction?.confidence).toBe(0.75)
    expect(shipment('shp_015', hoursLater(49)).view.prediction?.confidence).toBe(0.65)
  })

  it('has no prediction once delivered', () => {
    const { facts, view } = shipment('shp_003')

    expect(predictEtaInsight(facts, view, NOW)).toBeNull()
  })
})
