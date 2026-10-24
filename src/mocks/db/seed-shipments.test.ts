import { describe, expect, it } from 'vitest'
import { hoursFromSeededNow, seededDb, seededShipment } from './seeded-state'

type Seeded = ReturnType<typeof seededShipment>

const openTypes = ({ open }: Seeded) =>
  open.map((exception) => `${exception.type}:${exception.severity}`)
const states = ({ view }: Seeded) => view.milestones.map((milestone) => milestone.state)

// 07 §4 "Shows", one test per shipment, after createDatabase() ran the engine (SD-02).
const SHOWS: [reference: string, shows: string, check: (shipment: Seeded) => void][] = [
  ['SH-10401', 'on time', (s) => {
    expect(s.view).toMatchObject({ status: 'in_transit', onTime: 'on_time' })
    expect(openTypes(s)).toEqual([])
  }],
  ['SH-10402', 'on time, out for delivery, EuroRoad ETA', (s) => {
    expect(s.view).toMatchObject({ status: 'out_for_delivery', onTime: 'on_time' })
    expect(s.view.eta).toMatchObject({ source: 'op_eur', provenance: 'estimated' })
    expect(hoursFromSeededNow(s.view.eta.value)).toBe(4)
  }],
  ['SH-10403', 'delivered + POD', (s) => {
    expect(s.view).toMatchObject({ status: 'delivered', onTime: 'on_time' })
    expect(s.facts.documents).toContainEqual(expect.objectContaining({ type: 'proof_of_delivery', status: 'available' }))
  }],
  ['SH-10404', 'at_risk (+5 h)', (s) => {
    expect(s.view).toMatchObject({ onTime: 'at_risk', etaDeltaHours: 5 })
    expect(openTypes(s)).toEqual([])
  }],
  ['SH-10405', 'delivered late', (s) => {
    expect(s.view).toMatchObject({ status: 'delivered', onTime: 'late' })
    expect(s.exceptions).toMatchObject([{ type: 'delay', status: 'resolved' }])
  }],
  ['SH-10406', 'stale', (s) => {
    expect(s.view.staleness).toMatchObject({ stale: true, veryStale: false })
    expect(openTypes(s)).toEqual(['stale:medium'])
  }],
  ['SH-10407', 'booked, planned-only timeline', (s) => {
    expect(s.view.status).toBe('booked')
    expect(s.view.milestones.every((milestone) => milestone.actual === null)).toBe(true)
    expect(s.view.eta.source).toBe('booking')
  }],
  ['SH-10408', 'unmapped status, timeline unchanged', (s) => {
    expect(s.view).toMatchObject({ status: 'in_transit', onTime: 'on_time' })
    expect(s.view.latestDone?.type).toBe('departed_site')
    expect(s.facts.events.at(-1)).toMatchObject({ code: 'RET-PLAT', target: null })
    expect(s.view.lastEventAt).toBe(s.facts.events.at(-1)?.occurredAt)
  }],
  ['SH-10409', 'delay medium, late', (s) => {
    expect(s.view.onTime).toBe('late')
    expect(openTypes(s)).toEqual(['delay:medium'])
  }],
  ['SH-10411', 'delay high, EU without customs', (s) => {
    expect(s.view).toMatchObject({ onTime: 'late', hasCustoms: false, international: true })
    expect(openTypes(s)).toEqual(['delay:high'])
  }],
  ['SH-10412', 'delivered', (s) => {
    expect(s.view).toMatchObject({ status: 'delivered', onTime: 'on_time' })
  }],
  ['SH-10421', 'on time', (s) => {
    expect(s.view).toMatchObject({ onTime: 'on_time', staleness: { stale: false } })
    expect(openTypes(s)).toEqual([])
  }],
  ['SH-10431', 'multimodal plan with customs', (s) => {
    expect(s.view).toMatchObject({ status: 'booked', hasCustoms: true })
    expect(s.view.milestones.map((milestone) => milestone.type)).toContain('customs_submitted')
    expect(s.view.milestones).toHaveLength(12)
  }],
  ['SH-10432', 'AI predicts at_risk (BR-AI-05)', (s) => {
    expect(s.view).toMatchObject({ onTime: 'at_risk', etaDeltaHours: 0 })
    expect(s.view.prediction?.confidence).toBe(0.75)
  }],
  ['SH-10433', 'on time, LOAD not reported', (s) => {
    expect(s.view.onTime).toBe('on_time')
    expect(s.view.milestones.find((m) => m.type === 'loaded_on_vessel')?.state).toBe('not_reported')
  }],
  ['SH-10436', 'delay high, customer not messaged', (s) => {
    expect(s.view.eta).toMatchObject({ source: 'system' })
    expect(openTypes(s)).toEqual(['delay:high'])
    expect(s.open[0]?.nextActions[0]).toBe('notify_customer')
  }],
  ['SH-10438', 'missing_document medium', (s) => {
    expect(openTypes(s)).toEqual(['missing_document:medium'])
  }],
  ['SH-10441', 'hold high, upload suggested', (s) => {
    expect(s.view.status).toBe('on_hold')
    expect(openTypes(s)).toEqual(['hold:high'])
    expect(s.open[0]?.nextActions[0]).toBe('upload_document')
  }],
  ['SH-10444', 'customs_incident waiting on operator, no stale, on-time unknown', (s) => {
    expect(openTypes(s)).toEqual(['customs_incident:high'])
    expect(s.open[0]).toMatchObject({ status: 'acknowledged', waitingOn: 'operator' })
    expect(hoursFromSeededNow(s.open[0]?.detectedAt ?? null)).toBe(-24)
    expect(s.view).toMatchObject({ onTime: 'unknown', eta: { outdated: true } })
  }],
  ['SH-10447', 'in_customs', (s) => {
    expect(s.view).toMatchObject({ status: 'in_customs', onTime: 'on_time' })
    expect(openTypes(s)).toEqual([])
  }],
  ['SH-10450', 'last mile, out for delivery', (s) => {
    expect(s.view).toMatchObject({ status: 'out_for_delivery', currentLeg: { sequence: 3 } })
  }],
  ['SH-10452', 'delivered, complete multimodal timeline', (s) => {
    expect(s.view.status).toBe('delivered')
    expect(states(s).every((state) => state === 'done')).toBe(true)
  }],
] // prettier-ignore

describe('07 §4: every shipment shows its state after seeding (SD-02)', () => {
  it.each(SHOWS)('%s: %s', (reference, _shows, check) => {
    check(seededShipment(reference))
  })

  it('covers all 22 shipments', () => {
    expect(SHOWS.map(([reference]) => reference).sort()).toEqual(
      seededDb.shipments
        .all()
        .map((shipment) => shipment.reference)
        .sort(),
    )
  })
})
