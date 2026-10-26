import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { REALTIME_CHANNEL, type DomainEvent } from '@/domain'
import {
  authService,
  ConflictError,
  documentsService,
  exceptionsService,
  simulatorService,
} from '@/services'
import {
  resetData,
  shipmentIdOf,
  signInAs,
  SLOW_TEST_TIMEOUT_MS,
  setupMockApi,
  USERS,
} from './setup'

setupMockApi()

// BR-RT-01: what other tabs receive, listened to as another tab would.
let received: DomainEvent[] = []
let channel: BroadcastChannel | null = null

beforeEach(async () => {
  resetData()
  await signInAs(USERS.marc)
  received = []
  channel = new BroadcastChannel(REALTIME_CHANNEL)
  channel.onmessage = (message: MessageEvent<DomainEvent>) => received.push(message.data)
})

afterEach(() => channel?.close())

// Broadcast messages arrive on a later task.
const delivered = () => new Promise((resolve) => setTimeout(resolve, 50))
const types = () => received.map((event) => event.type)

describe('OP-50..53 simulator endpoints', () => {
  it(
    'OP-51: a scenario runs once, then answers 409 until reset',
    async () => {
      expect((await simulatorService.runScenario('SIM-05')).done).toBe(true)
      await expect(simulatorService.runScenario('SIM-05')).rejects.toBeInstanceOf(ConflictError)
      const listed = await simulatorService.listScenarios()
      expect(listed.map(({ id, done }) => [id, done])).toEqual([
        ['SIM-01', false],
        ['SIM-02', false],
        ['SIM-03', false],
        ['SIM-04', false],
        ['SIM-05', true],
      ])
    },
    SLOW_TEST_TIMEOUT_MS,
  )

  it(
    'OP-52: advancing the clock moves the offset and "now" for everyone',
    async () => {
      const before = await simulatorService.getClock()
      expect(before.offsetHours).toBe(0)
      const after = await simulatorService.advanceClock(6)
      expect(after.offsetHours).toBe(6)
      const movedHours = (Date.parse(after.now) - Date.parse(before.now)) / 3_600_000
      expect(movedHours).toBeGreaterThanOrEqual(6)
    },
    SLOW_TEST_TIMEOUT_MS,
  )

  it(
    'OP-53: reset restores the seed, the clock and the scenarios, and keeps the session',
    async () => {
      await simulatorService.runScenario('SIM-03')
      await simulatorService.reset()
      expect((await simulatorService.getClock()).offsetHours).toBe(0)
      expect((await simulatorService.listScenarios()).every((item) => !item.done)).toBe(true)
      expect((await authService.me()).email).toBe(USERS.marc)
      await delivered()
      expect(types()).toContain('data.reset')
    },
    SLOW_TEST_TIMEOUT_MS,
  )
})

describe('BR-RT-01 every mutation publishes thin events', () => {
  it(
    'a scenario run publishes the shipment, exception and alert changes',
    async () => {
      await simulatorService.runScenario('SIM-01')
      await delivered()
      const id = shipmentIdOf('SH-10433')
      expect(received).toContainEqual({ type: 'shipment.updated', shipmentId: id })
      expect(types()).toEqual(expect.arrayContaining(['exception.changed', 'alert.created']))
      expect(types()).toContain('simulator.changed')
      // Thin: IDs only.
      for (const event of received) {
        const keys = Object.keys(event).filter((key) => key !== 'type')
        expect(keys.every((key) => key.endsWith('Id'))).toBe(true)
      }
    },
    SLOW_TEST_TIMEOUT_MS,
  )

  it(
    'clock advance and network mode changes publish simulator.changed',
    async () => {
      await simulatorService.advanceClock(2)
      await simulatorService.setNetwork('normal')
      await delivered()
      expect(types().filter((type) => type === 'simulator.changed')).toHaveLength(2)
    },
    SLOW_TEST_TIMEOUT_MS,
  )

  it(
    'an action and an upload publish their changes',
    async () => {
      const [first] = await exceptionsService.list()
      if (!first) throw new Error('The queue is empty')
      await exceptionsService.runAction(first.id, { type: 'acknowledge', payload: {} })
      const id = shipmentIdOf('SH-10438')
      const file = new File([new Uint8Array(1024)], 'invoice.pdf', { type: 'application/pdf' })
      await documentsService.upload(id, { type: 'commercial_invoice', file })
      await delivered()
      expect(received).toContainEqual({
        type: 'exception.changed',
        shipmentId: first.shipmentId,
        exceptionId: first.id,
      })
      expect(received).toContainEqual({ type: 'document.changed', shipmentId: id })
    },
    SLOW_TEST_TIMEOUT_MS,
  )
})
