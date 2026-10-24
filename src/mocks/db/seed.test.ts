import { describe, expect, it } from 'vitest'
import type { z } from 'zod'
import {
  bwsPayloadSchema,
  eurPayloadSchema,
  lmxPayloadSchema,
  pldPayloadSchema,
  tirPayloadSchema,
  type OperatorFormat,
} from '@/domain'
import { createClock } from '@/mocks/clock'
import { createDatabase } from './database'
import { seedRows } from './seed'
import { createMemoryStorage } from './storage'

const clock = createClock(
  () => 0,
  () => Date.parse('2026-11-10T08:00:00.000Z'),
)
const db = createDatabase(clock, createMemoryStorage())

const PAYLOAD_SCHEMAS: Record<OperatorFormat, z.ZodType> = {
  'tir-json': tirPayloadSchema,
  'eur-csv': eurPayloadSchema,
  'pld-json': pldPayloadSchema,
  'bws-edi': bwsPayloadSchema,
  'lmx-text': lmxPayloadSchema,
}

const idsOf = (rows: { id: string }[]) => new Set(rows.map((row) => row.id))

describe('seed catalogue (07)', () => {
  it('07 §2–4: has the counts of the catalogue', () => {
    expect(db.sites.all()).toHaveLength(4)
    expect(db.accounts.all()).toHaveLength(5)
    expect(db.users.all()).toHaveLength(8)
    expect(db.operators.all()).toHaveLength(5)
    expect(db.shipments.all()).toHaveLength(22)
    expect(db.statusMappings.all()).toHaveLength(28)
    expect(db.simulator.all()).toHaveLength(1)
  })

  it('07 §2: each ops agent has the sites of their perimeter', () => {
    const sitesOf = (userId: string) =>
      db.userSites.where((row) => row.userId === userId).map((row) => row.siteId)

    expect(sitesOf('usr_010')).toEqual(['site_zgz', 'site_vlc'])
    expect(sitesOf('usr_011')).toEqual(['site_bio', 'site_bcn'])
    expect(sitesOf('usr_020')).toEqual([])
  })

  it('07 §5: each account has the number of shipments its user lands on', () => {
    const countFor = (accountId: string) =>
      db.shipments.where((row) => row.accountId === accountId).length

    expect(['acc_001', 'acc_002', 'acc_003', 'acc_004', 'acc_005'].map(countFor)).toEqual([
      4, 3, 2, 3, 10,
    ])
  })

  it('SD-02: exceptions, alerts and activity are never hand-written; sessions start empty', () => {
    const rows = seedRows(clock)

    expect(rows.exceptions).toEqual([])
    expect(rows.alerts).toEqual([])
    expect(rows.activity).toEqual([])
    expect(rows.shipmentEvaluations).toEqual([])
    expect(db.sessions.all()).toEqual([])
  })

  it('every foreign key resolves', () => {
    const [accounts, sites, users, shipments, operators, legs] = [
      idsOf(db.accounts.all()),
      idsOf(db.sites.all()),
      idsOf(db.users.all()),
      idsOf(db.shipments.all()),
      idsOf(db.operators.all()),
      idsOf(db.legs.all()),
    ]
    for (const user of db.users.all()) {
      expect(user.accountId === null || accounts.has(user.accountId)).toBe(true)
    }
    for (const { userId, siteId } of db.userSites.all()) {
      expect(users.has(userId) && sites.has(siteId)).toBe(true)
    }
    for (const shipment of db.shipments.all()) {
      expect(accounts.has(shipment.accountId) && sites.has(shipment.originSiteId)).toBe(true)
    }
    for (const leg of db.legs.all()) {
      expect(shipments.has(leg.shipmentId) && operators.has(leg.operatorId)).toBe(true)
    }
    for (const event of db.rawEvents.all()) expect(legs.has(event.legId)).toBe(true)
    for (const mapping of db.statusMappings.all()) {
      expect(operators.has(mapping.operatorId)).toBe(true)
    }
    for (const document of db.documents.all()) expect(shipments.has(document.shipmentId)).toBe(true)
  })

  it('every raw event comes from the operator of its leg', () => {
    for (const event of db.rawEvents.all()) {
      expect(db.legs.findById(event.legId)?.operatorId).toBe(event.operatorId)
    }
  })

  it("every raw event parses with its operator's payload schema", () => {
    for (const event of db.rawEvents.all()) {
      const operator = db.operators.findById(event.operatorId)
      if (!operator) throw new Error(`Unknown operator ${event.operatorId}`)
      expect(PAYLOAD_SCHEMAS[operator.format].safeParse(event.payload).success).toBe(true)
    }
  })

  it('BR-NM-03, US-O-05: the only unmapped events are the two EuroRoad `RET-PLAT`', () => {
    const unmapped = db.rawEvents.where((event) => event.mappingStatus === 'unmapped')

    expect(unmapped).toHaveLength(2)
    for (const event of unmapped) expect(String(event.payload)).toMatch(/^RET-PLAT;/)
    expect(db.statusMappings.where((mapping) => mapping.rawCode === 'RET-PLAT')).toEqual([])
  })

  it('every shipment has legs in sequence, and its committed date is the last arrival', () => {
    for (const shipment of db.shipments.all()) {
      const legs = db.legs.where((leg) => leg.shipmentId === shipment.id)
      expect(legs.map((leg) => leg.sequence)).toEqual(legs.map((_, index) => index + 1))
      expect(legs.at(-1)?.plannedArrival).toBe(shipment.plannedEta)
    }
  })

  it('07 §3: SH-10432 sails on BW Meridian, every other sea leg on BW Aurora', () => {
    const vesselOf = (shipmentId: string) =>
      db.legs.where((leg) => leg.shipmentId === shipmentId && leg.mode === 'sea')[0]?.vessel

    expect(vesselOf('shp_014')).toBe('BW Meridian')
    const seaLegs = db.legs.where((leg) => leg.mode === 'sea' && leg.shipmentId !== 'shp_014')
    expect(seaLegs).toHaveLength(9)
    for (const leg of seaLegs) expect(leg.vessel).toBe('BW Aurora')
  })

  it('07 §4: SH-10433 has no `LOAD` event', () => {
    const events = db.rawEvents.where((event) => event.legId.startsWith('leg_015_'))
    expect(events.map((event) => JSON.stringify(event.payload)).join()).not.toContain('"LOAD"')
  })
})
