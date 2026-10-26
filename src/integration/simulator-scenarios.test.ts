import { beforeEach, describe, expect, it } from 'vitest'
import type { Exception, ScenarioId, Shipment } from '@/domain'
import {
  aiService,
  alertsService,
  documentsService,
  exceptionsService,
  mappingsService,
  shipmentsService,
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

// NFR-07, 07 §6: the simulator scenarios produce exactly their expected outcomes, through the
// same endpoints the panel and both roles use.
setupMockApi()

const HOURS = 60 * 60 * 1000

beforeEach(() => resetData())

async function run(id: ScenarioId) {
  await signInAs(USERS.elena)
  return simulatorService.runScenario(id)
}

async function openOf(email: string, shipmentId: string): Promise<Exception[]> {
  await signInAs(email)
  return exceptionsService.list({ shipmentId })
}

async function seenBy(email: string, shipmentId: string): Promise<Shipment> {
  await signInAs(email)
  return shipmentsService.getById(shipmentId)
}

describe('07 §6 simulator scenarios', () => {
  it(
    'SIM-01 vessel delay: ETA +36 h estimated, late, high delay, one late alert',
    async () => {
      const id = shipmentIdOf('SH-10433')
      const before = await seenBy(USERS.marc, id)
      const summaryBefore = await aiService.getSummary(id)
      await run('SIM-01')

      const after = await seenBy(USERS.marc, id)
      expect(after.eta?.provenance).toBe('estimated')
      expect(after.eta?.source).toBe('system')
      const moved = Date.parse(after.eta?.value ?? '') - Date.parse(before.eta?.value ?? '')
      expect(Math.round(moved / HOURS)).toBe(36)
      expect(after.onTime).toBe('late')
      const [delay, ...others] = await openOf(USERS.marc, id)
      expect(others).toEqual([])
      expect(delay).toMatchObject({ type: 'delay', severity: 'high' })
      expect(delay?.nextActions[0]).toBe('notify_customer')
      expect((await aiService.getSummary(id)).content).not.toEqual(summaryBefore.content)

      await signInAs(USERS.diego)
      const alerts = (await alertsService.list({ shipmentId: id })).filter((a) => a.type === 'late')
      expect(alerts).toHaveLength(1)
      expect(alerts[0]?.etaImpact?.newEta?.value).toBe(after.eta?.value)
    },
    SLOW_TEST_TIMEOUT_MS,
  )

  it(
    'SIM-02 customs hold: on hold, high hold with Contact operator, on_hold alert',
    async () => {
      const id = shipmentIdOf('SH-10447')
      await run('SIM-02')
      expect((await seenBy(USERS.marc, id)).status).toBe('on_hold')
      const holds = (await openOf(USERS.marc, id)).filter((item) => item.type === 'hold')
      expect(holds).toHaveLength(1)
      expect(holds[0]).toMatchObject({ severity: 'high' })
      expect(holds[0]?.nextActions[0]).toBe('contact_operator')

      expect((await seenBy(USERS.diego, id)).status).toBe('on_hold')
      const alerts = await alertsService.list({ shipmentId: id })
      expect(alerts.filter((alert) => alert.type === 'on_hold')).toHaveLength(1)
    },
    SLOW_TEST_TIMEOUT_MS,
  )

  it(
    'SIM-03 operator goes silent: SH-10421 stale for Núria and Elena, nothing else',
    async () => {
      const id = shipmentIdOf('SH-10421')
      await signInAs(USERS.elena)
      const shipmentsBefore = await shipmentsService.list()
      const queueBefore = await exceptionsService.list()
      await signInAs(USERS.camille)
      const alertsBefore = await alertsService.list()
      await run('SIM-03')

      for (const email of [USERS.nuria, USERS.elena]) {
        const stale = (await openOf(email, id)).filter((item) => item.type === 'stale')
        expect(stale).toHaveLength(1)
        expect(stale[0]?.severity).toBe('medium')
      }
      expect((await seenBy(USERS.camille, id)).stale).toBe(true)
      expect(await alertsService.list()).toEqual(alertsBefore)

      // SD-04: every other shipment keeps its state; the queue only gains the stale exception.
      await signInAs(USERS.elena)
      const state = (s: Shipment) => [s.id, s.status, s.onTime, s.stale]
      const others = (list: Shipment[]) => list.filter((s) => s.id !== id).map(state)
      expect(others(await shipmentsService.list())).toEqual(others(shipmentsBefore))
      const queueIds = (await exceptionsService.list()).map((item) => item.id)
      expect(queueIds.filter((item) => !queueBefore.some((e) => e.id === item))).toHaveLength(1)
    },
    SLOW_TEST_TIMEOUT_MS,
  )

  it(
    'SIM-04 unknown code: unmapped with a delivered suggestion; Accept delivers',
    async () => {
      const id = shipmentIdOf('SH-10450')
      await signInAs(USERS.marc)
      const timelineBefore = await shipmentsService.getTimeline(id)
      await run('SIM-04')

      await signInAs(USERS.marc)
      const unmapped = (await mappingsService.listUnmapped()).find(
        (row) => row.rawCode === 'Parcel handed to recipient',
      )
      expect(unmapped).toBeDefined()
      const suggestion = await aiService.getMappingSuggestion(unmapped?.latestRawEventId ?? '')
      const [top] = suggestion.content.candidates
      expect(top?.target).toBe('delivered')
      expect(top?.score).toBeCloseTo(0.75, 1)
      expect(await shipmentsService.getTimeline(id)).toEqual(timelineBefore)

      await mappingsService.confirm({
        operatorId: 'op_lmx',
        rawCode: 'Parcel handed to recipient',
        target: 'delivered',
      })
      expect((await shipmentsService.getById(id)).status).toBe('delivered')
      expect(await exceptionsService.list({ shipmentId: id })).toEqual([])
      const pod = (await documentsService.list(id)).find((d) => d.type === 'proof_of_delivery')
      expect(pod?.status).toBe('pending')
      await signInAs(USERS.diego)
      const alerts = await alertsService.list({ shipmentId: id })
      expect(alerts.filter((alert) => alert.type === 'delivered')).toHaveLength(1)
    },
    SLOW_TEST_TIMEOUT_MS,
  )

  it(
    'SIM-05 delivery: delivered (confirmed), on time, delivered alert, POD available',
    async () => {
      const id = shipmentIdOf('SH-10401')
      await run('SIM-05')

      const delivered = await seenBy(USERS.laura, id)
      expect(delivered).toMatchObject({ status: 'delivered', onTime: 'on_time' })
      expect(delivered.eta?.provenance).toBe('confirmed')
      const alerts = await alertsService.list({ shipmentId: id })
      expect(alerts.filter((alert) => alert.type === 'delivered')).toHaveLength(1)
      const pod = (await documentsService.list(id)).find((d) => d.type === 'proof_of_delivery')
      expect(pod?.status).toBe('available')
    },
    SLOW_TEST_TIMEOUT_MS,
  )
})
