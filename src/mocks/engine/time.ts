// BR-TM-01: engine functions receive `now` from the clock; these helpers never read the real
// time. BR-TM-02: dates are ISO 8601 UTC strings.
export const MS_PER_HOUR = 60 * 60 * 1000

export function addHours(iso: string, hours: number): string {
  return new Date(Date.parse(iso) + hours * MS_PER_HOUR).toISOString()
}

// Positive when `to` is after `from`.
export function hoursBetween(from: string | Date, to: string | Date): number {
  return (toTime(to) - toTime(from)) / MS_PER_HOUR
}

export function isAfter(a: string | Date, b: string | Date): boolean {
  return toTime(a) > toTime(b)
}

function toTime(date: string | Date): number {
  return typeof date === 'string' ? Date.parse(date) : date.getTime()
}
