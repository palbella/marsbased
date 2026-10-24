import { describe, expect, it } from 'vitest'
import { createClock } from '@/mocks/clock'
import { pastActionsSeed } from './past-actions'
import { seedRows } from './seed'

const REAL_TIME = Date.parse('2026-11-10T08:00:00.000Z')
const SHIFT_HOURS = 10
const MS_PER_HOUR = 60 * 60 * 1000

const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/
// eur-csv "DP;2026-11-10;08:15;BARCELONA".
const EUR_CSV = /^([^;]+);(\d{4}-\d{2}-\d{2});(\d{2}:\d{2});(.+)$/
// lmx-text "10/11/2026 09:30".
const LMX_DATE = /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})$/

// The seeded facts only: what the engine derives from them (SD-02) is checked in
// seed-shipments.test.ts and seed-views.test.ts.
function seededFacts(offsetHours: number) {
  const clock = createClock(
    () => offsetHours,
    () => REAL_TIME,
  )
  return { tables: seedRows(clock), pastActions: pastActionsSeed(clock) }
}

let datesSeen = 0

// Rewrites every date found in the seed, in any of the formats the seed writes.
function shift(value: unknown, hours: number): unknown {
  if (Array.isArray(value)) return value.map((item) => shift(item, hours))
  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(Object.entries(value).map(([key, v]) => [key, shift(v, hours)]))
  }
  if (typeof value !== 'string') return value
  return shiftDateString(value, hours)
}

function shiftDateString(value: string, hours: number): string {
  const later = (iso: string) => new Date(Date.parse(iso) + hours * MS_PER_HOUR).toISOString()
  if (ISO_DATE.test(value)) {
    datesSeen += 1
    const shifted = later(value)
    return value.includes('.') ? shifted : shifted.replace('.000Z', 'Z')
  }
  const csv = EUR_CSV.exec(value)
  if (csv) {
    datesSeen += 1
    const shifted = later(`${csv[2]}T${csv[3]}:00Z`)
    return `${csv[1]};${shifted.slice(0, 10)};${shifted.slice(11, 16)};${csv[4]}`
  }
  const lmx = LMX_DATE.exec(value)
  if (lmx) {
    datesSeen += 1
    const shifted = later(`${lmx[3]}-${lmx[2]}-${lmx[1]}T${lmx[4]}:${lmx[5]}:00Z`)
    const [date, time] = [shifted.slice(0, 10).split('-'), shifted.slice(11, 16)]
    return `${date[2]}/${date[1]}/${date[0]} ${time}`
  }
  return value
}

describe('relative seed dates (SD-01)', () => {
  it(`SD-01: a clock offset of +${SHIFT_HOURS} h shifts every seeded date by exactly ${SHIFT_HOURS} h`, () => {
    const atNow = seededFacts(0)
    const later = seededFacts(SHIFT_HOURS)

    expect(shift(atNow, SHIFT_HOURS)).toEqual(later)
    // Guards against a vacuous pass if the date formats stop matching.
    expect(datesSeen).toBeGreaterThan(300)
  })
})
