import type { DomainEvent } from '@/domain'
import { createBroadcastChannelClient } from './broadcast-channel'

export type RealtimeStatus = 'connected' | 'disconnected'

// 02 §7: live updates are push, behind one interface with a transport per phase.
export interface RealtimeClient {
  subscribe(handler: (event: DomainEvent) => void): () => void
  // Connection state for the live indicator (DS-01, UI-03); called once on subscribe.
  onStatusChange(handler: (status: RealtimeStatus) => void): () => void
}

const BROADCAST_CHANNEL_TRANSPORT = 'broadcast-channel'

// 02 §5.7 `NEXT_PUBLIC_REALTIME`: `broadcast-channel` in Phase 1. The SSE transport arrives
// with the Phase 2 backend; until then any other value never connects, so the strip says
// OFFLINE instead of pretending to be live.
export function createRealtimeClient(
  transport = process.env.NEXT_PUBLIC_REALTIME ?? BROADCAST_CHANNEL_TRANSPORT,
): RealtimeClient {
  if (transport === BROADCAST_CHANNEL_TRANSPORT) return createBroadcastChannelClient()
  return {
    subscribe: () => () => undefined,
    onStatusChange: (handler) => {
      handler('disconnected')
      return () => undefined
    },
  }
}

// One connection per tab, shared by every subscriber.
export const realtimeClient = createRealtimeClient()
