// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { REALTIME_CHANNEL, REALTIME_LOCAL_EVENT, type DomainEvent } from '@/domain'
import { createBroadcastChannelClient } from './broadcast-channel'

const nextTask = () => new Promise((resolve) => setTimeout(resolve, 20))

describe('02 §7 broadcast-channel transport', () => {
  it('receives other tabs through the channel and this tab through the local dispatch', async () => {
    const client = createBroadcastChannelClient()
    const received: DomainEvent[] = []
    const unsubscribe = client.subscribe((event) => received.push(event))

    const otherTab = new BroadcastChannel(REALTIME_CHANNEL)
    otherTab.postMessage({ type: 'alert.created', shipmentId: 'shp_1', alertId: 'alr_1' })
    window.dispatchEvent(new CustomEvent(REALTIME_LOCAL_EVENT, { detail: { type: 'data.reset' } }))
    await nextTask()
    otherTab.close()
    unsubscribe()

    expect(received).toEqual([
      { type: 'data.reset' },
      { type: 'alert.created', shipmentId: 'shp_1', alertId: 'alr_1' },
    ])
  })

  it('ignores malformed events', async () => {
    const client = createBroadcastChannelClient()
    const received: DomainEvent[] = []
    const unsubscribe = client.subscribe((event) => received.push(event))
    window.dispatchEvent(new CustomEvent(REALTIME_LOCAL_EVENT, { detail: { type: 'nope' } }))
    await nextTask()
    unsubscribe()
    expect(received).toEqual([])
  })

  it('reports connected while subscribed and disconnected after the last unsubscribe', () => {
    const client = createBroadcastChannelClient()
    const statuses: string[] = []
    client.onStatusChange((status) => statuses.push(status))
    const unsubscribe = client.subscribe(() => undefined)
    unsubscribe()
    expect(statuses).toEqual(['disconnected', 'connected', 'disconnected'])
  })
})
