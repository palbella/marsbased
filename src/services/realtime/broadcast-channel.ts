import {
  domainEventSchema,
  REALTIME_CHANNEL,
  REALTIME_LOCAL_EVENT,
  type DomainEvent,
} from '@/domain'
import { monitoring } from '@/lib/monitoring'
import type { RealtimeClient, RealtimeStatus } from './realtime-client'

type EventHandler = (event: DomainEvent) => void
type StatusHandler = (status: RealtimeStatus) => void

// 02 §7, Phase 1: other tabs' events arrive through the `BroadcastChannel`, this tab's own
// through the local dispatch (a channel never delivers to its sender). The channel opens with
// the first subscriber and closes with the last.
class BroadcastChannelClient implements RealtimeClient {
  private readonly handlers = new Set<EventHandler>()
  private readonly statusHandlers = new Set<StatusHandler>()
  private channel: BroadcastChannel | null = null

  subscribe(handler: EventHandler): () => void {
    this.handlers.add(handler)
    if (!this.channel) this.open()
    return () => {
      this.handlers.delete(handler)
      if (this.handlers.size === 0 && this.channel) this.close()
    }
  }

  onStatusChange(handler: StatusHandler): () => void {
    this.statusHandlers.add(handler)
    handler(this.status())
    return () => {
      this.statusHandlers.delete(handler)
    }
  }

  private status(): RealtimeStatus {
    return this.channel ? 'connected' : 'disconnected'
  }

  private open(): void {
    if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') return
    this.channel = new BroadcastChannel(REALTIME_CHANNEL)
    this.channel.addEventListener('message', this.onMessage)
    window.addEventListener(REALTIME_LOCAL_EVENT, this.onLocal)
    this.notifyStatus()
  }

  private close(): void {
    this.channel?.close()
    this.channel = null
    window.removeEventListener(REALTIME_LOCAL_EVENT, this.onLocal)
    this.notifyStatus()
  }

  private notifyStatus(): void {
    this.statusHandlers.forEach((handler) => handler(this.status()))
  }

  private readonly onMessage = (message: MessageEvent) => this.deliver(message.data)

  private readonly onLocal = (event: Event) =>
    this.deliver(event instanceof CustomEvent ? event.detail : null)

  // BR-RT-01: anything that is not a thin event is dropped and reported, never delivered.
  private deliver(data: unknown): void {
    const parsed = domainEventSchema.safeParse(data)
    if (!parsed.success) {
      monitoring.captureMessage('Malformed realtime event', 'warning', {
        tags: { area: 'realtime' },
      })
      return
    }
    this.handlers.forEach((handler) => handler(parsed.data))
  }
}

export function createBroadcastChannelClient(): RealtimeClient {
  return new BroadcastChannelClient()
}
