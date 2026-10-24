import { describe, expect, it } from 'vitest'
import { createClock } from '@/mocks/clock'
import { createDatabase } from './database'
import { createMemoryStorage } from './storage'

const MS_PER_HOUR = 60 * 60 * 1000
const clock = createClock(
  () => 0,
  () => Date.parse('2026-11-10T08:00:00.000Z'),
)
const db = createDatabase(clock, createMemoryStorage())
const now = clock.now().getTime()

const hoursFromNow = (iso: string) => (Date.parse(iso) - now) / MS_PER_HOUR
const bwsCode = (payload: unknown) =>
  typeof payload === 'object' && payload !== null && 'eventCode' in payload
    ? payload.eventCode
    : null

describe('seeded facts behind 07 §4', () => {
  it('07 §4, BR-SL-01: BlueWave reports at least once a day from sailing to arrival or now', () => {
    for (const leg of db.legs.where((row) => row.mode === 'sea')) {
      const events = db.rawEvents.where((event) => event.legId === leg.id)
      const sailed = events.find((event) => bwsCode(event.payload) === 'VD')
      if (!sailed) continue
      const arrived = events.find((event) => bwsCode(event.payload) === 'VA')
      const end = arrived ? Date.parse(arrived.receivedAt) : now
      const times = events
        .map((event) => Date.parse(event.receivedAt))
        .filter((time) => time >= Date.parse(sailed.receivedAt) && time <= end)
        .sort((a, b) => a - b)

      const gaps = [...times, end].slice(1).map((time, index) => time - (times[index] ?? time))
      expect(Math.max(...gaps), leg.id).toBeLessThanOrEqual(24 * MS_PER_HOUR)
    }
  })

  it('07 §4: SH-10444 was submitted to customs 72 h ago, nothing since, committed in 3 days', () => {
    const shipment = db.shipments.findById('shp_019')
    const events = db.rawEvents
      .where((event) => event.legId.startsWith('leg_019_'))
      .sort((a, b) => a.receivedAt.localeCompare(b.receivedAt))
    const last = events.at(-1)

    expect(bwsCode(last?.payload)).toBe('CSUB')
    expect(Math.round(hoursFromNow(last?.receivedAt ?? ''))).toBe(-72)
    expect(hoursFromNow(shipment?.plannedEta ?? '')).toBe(72)
  })

  it('07 §4 "Documents": multimodal shipments carry no CMR', () => {
    const multimodal = new Set(
      db.legs.where((leg) => leg.mode === 'sea').map((leg) => leg.shipmentId),
    )
    const cmrs = db.documents.where((document) => document.type === 'cmr')

    expect(cmrs).toHaveLength(12)
    for (const cmr of cmrs) expect(multimodal.has(cmr.shipmentId)).toBe(false)
  })
})
