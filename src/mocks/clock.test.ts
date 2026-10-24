import { describe, expect, it } from 'vitest'
import { createClock } from './clock'

const REAL_TIME = Date.parse('2026-11-10T08:00:00.000Z')

describe('clock (BR-TM-01, BR-TM-02)', () => {
  it('BR-TM-01: now is real time plus the offset', () => {
    const clock = createClock(
      () => 10,
      () => REAL_TIME,
    )

    expect(clock.now().toISOString()).toBe('2026-11-10T18:00:00.000Z')
  })

  it('BR-TM-01: reads the offset on every call, so advancing it moves the clock', () => {
    let offsetHours = 0
    const clock = createClock(
      () => offsetHours,
      () => REAL_TIME,
    )
    offsetHours = 2

    expect(clock.now().toISOString()).toBe('2026-11-10T10:00:00.000Z')
  })

  it('BR-TM-02: relative helpers return ISO 8601 UTC strings', () => {
    const clock = createClock(
      () => 0,
      () => REAL_TIME,
    )

    expect(clock.hoursAgo(3)).toBe('2026-11-10T05:00:00.000Z')
    expect(clock.hoursFromNow(5)).toBe('2026-11-10T13:00:00.000Z')
    expect(clock.daysAgo(2)).toBe('2026-11-08T08:00:00.000Z')
    expect(clock.daysFromNow(1)).toBe('2026-11-11T08:00:00.000Z')
  })
})
