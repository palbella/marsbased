import { REALTIME_CHANNEL, REALTIME_LOCAL_EVENT, type DomainEvent } from '@/domain'

// BR-RT-01, 02 §7: every mutation hands its thin events here. Each event goes to every other
// tab through the `BroadcastChannel` and to this tab through a local dispatch, so every tab,
// the sender included, gets it exactly once. Identical events of one mutation are sent once.
export function publishChanges(changes: DomainEvent[]): void {
  const events = withoutDuplicates(changes)
  if (events.length === 0) return
  broadcast(events)
  if (typeof window === 'undefined') return
  for (const event of events) {
    window.dispatchEvent(new CustomEvent(REALTIME_LOCAL_EVENT, { detail: event }))
  }
}

// Opened per publish and closed right away: messages already posted are still delivered, and
// no channel is left open to keep a test process alive.
function broadcast(events: DomainEvent[]): void {
  if (typeof BroadcastChannel === 'undefined') return
  const channel = new BroadcastChannel(REALTIME_CHANNEL)
  for (const event of events) channel.postMessage(event)
  channel.close()
}

function withoutDuplicates(changes: DomainEvent[]): DomainEvent[] {
  const seen = new Set<string>()
  return changes.filter((event) => {
    const key = JSON.stringify(event)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
