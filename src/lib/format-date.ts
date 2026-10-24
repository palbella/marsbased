// BR-TM-02: timestamps arrive as ISO UTC and are shown in the viewer's local time zone.
const MS_PER_MINUTE = 60_000
const MINUTES_PER_HOUR = 60
const HOURS_PER_DAY = 24
// Up to two days a delay still reads best in hours ("36 h ago").
const RELATIVE_HOURS_LIMIT = 48

const dayFormat = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
})
const shortDayFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' })
const timeFormat = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

// "Thu 14 Nov"
export function formatDay(iso: string): string {
  return dayFormat.format(new Date(iso)).replace(',', '')
}

// "Thu 14 Nov 10:20"
export function formatDayTime(iso: string): string {
  return `${formatDay(iso)} ${formatTime(iso)}`
}

// "12 Nov"
export function formatShortDay(iso: string): string {
  return shortDayFormat.format(new Date(iso))
}

// "12 Nov 14:05", for source tooltips (DS-05).
export function formatStamp(iso: string): string {
  return `${formatShortDay(iso)} ${formatTime(iso)}`
}

export function formatTime(iso: string): string {
  return timeFormat.format(new Date(iso))
}

// "14 h", "3 days": a span of time without direction.
export function formatDuration(fromIso: string, now: Date): string {
  const minutes = Math.abs(Math.round((now.getTime() - Date.parse(fromIso)) / MS_PER_MINUTE))
  if (minutes < MINUTES_PER_HOUR) return `${minutes} min`
  const hours = Math.round(minutes / MINUTES_PER_HOUR)
  if (hours < RELATIVE_HOURS_LIMIT) return `${hours} h`
  const days = Math.round(hours / HOURS_PER_DAY)
  return `${days} days`
}

// BR-TM-02 relative hints: "2 h ago", "in 3 days", "just now".
export function formatRelative(iso: string, now: Date): string {
  const elapsed = now.getTime() - Date.parse(iso)
  if (Math.abs(elapsed) < MS_PER_MINUTE) return 'just now'
  const span = formatDuration(iso, now)
  return elapsed > 0 ? `${span} ago` : `in ${span}`
}
