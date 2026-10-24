const MS_PER_HOUR = 60 * 60 * 1000
const HOURS_PER_DAY = 24

// BR-TM-01: the simulation clock is real time plus an offset the simulator advances.
// Every date the mock backend produces goes through it; nothing else reads `Date.now()`.
export interface Clock {
  now(): Date
  // BR-TM-02: relative helpers return ISO 8601 UTC strings, ready to store.
  hoursAgo(hours: number): string
  hoursFromNow(hours: number): string
  daysAgo(days: number): string
  daysFromNow(days: number): string
}

export function createClock(
  readOffsetHours: () => number,
  readRealTime: () => number = () => Date.now(),
): Clock {
  const now = () => new Date(readRealTime() + readOffsetHours() * MS_PER_HOUR)
  const hoursFromNow = (hours: number) =>
    new Date(now().getTime() + hours * MS_PER_HOUR).toISOString()

  return {
    now,
    hoursFromNow,
    hoursAgo: (hours) => hoursFromNow(-hours),
    daysFromNow: (days) => hoursFromNow(days * HOURS_PER_DAY),
    daysAgo: (days) => hoursFromNow(-days * HOURS_PER_DAY),
  }
}
