import type { DomainEvent } from '@/domain'

// BR-RT-01, 02 §7: every mutation hands its thin events here. Publishing (local dispatch +
// BroadcastChannel) arrives with T11; until then the changes are dropped on purpose.
export function publishChanges(changes: DomainEvent[]): void {
  void changes
}
