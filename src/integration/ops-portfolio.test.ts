import { beforeAll, describe, expect, it } from 'vitest'
import { exceptionsService, shipmentsService } from '@/services'
import {
  resetData,
  shipmentIdOf,
  signInAs,
  SLOW_TEST_TIMEOUT_MS,
  setupMockApi,
  USERS,
} from './setup'

setupMockApi()

beforeAll(() => resetData())

describe('OP-22 portfolio default order', () => {
  it('lists active shipments attention-first and delivered shipments last', async () => {
    await signInAs(USERS.elena)
    const shipments = await shipmentsService.list()
    const firstDelivered = shipments.findIndex((shipment) => shipment.status === 'delivered')
    expect(firstDelivered).toBeGreaterThan(0)
    expect(shipments.slice(firstDelivered).every((s) => s.status === 'delivered')).toBe(true)
    expect(shipments[0]?.onTime).toBe('late')
  })
})

describe('OP-30 ops shipment detail', () => {
  it('traces the BlueWave "VD" event to its normalised milestone on SH-10433', async () => {
    await signInAs(USERS.marc)
    const id = shipmentIdOf('SH-10433')
    const [timeline, rawEvents] = await Promise.all([
      shipmentsService.getTimeline(id),
      shipmentsService.getRawEvents(id),
    ])
    const departed = timeline.milestones.find((milestone) => milestone.type === 'vessel_departed')
    const raw = rawEvents.find((event) => event.id === departed?.rawEventId)
    expect(raw).toMatchObject({ operatorId: 'op_bws', code: 'VD', target: 'vessel_departed' })
  })

  it(
    'lists open and resolved exceptions of one shipment with status=all',
    async () => {
      await signInAs(USERS.marc)
      const id = shipmentIdOf('SH-10436')
      const exceptions = await exceptionsService.list({ shipmentId: id, status: 'all' })
      expect(exceptions.length).toBeGreaterThan(0)
      expect(exceptions.every((exception) => exception.shipmentId === id)).toBe(true)
    },
    SLOW_TEST_TIMEOUT_MS,
  )
})
