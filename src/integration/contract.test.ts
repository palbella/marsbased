import { http, HttpResponse } from 'msw'
import { beforeAll, describe, expect, it } from 'vitest'
import { recentMonitoringEvents } from '@/lib/monitoring'
import { server } from '@/mocks/node'
import {
  aiService,
  alertsService,
  authService,
  ContractError,
  documentsService,
  exceptionsService,
  mappingsService,
  referenceService,
  shipmentsService,
  simulatorService,
} from '@/services'
import {
  resetData,
  shipmentIdOf,
  SLOW_TEST_TIMEOUT_MS,
  signInAs,
  setupMockApi,
  USERS,
} from './setup'

setupMockApi()

beforeAll(resetData, SLOW_TEST_TIMEOUT_MS)

describe('02 §5.1 rule 1: the API is the contract', () => {
  it('a malformed response raises ContractError and is captured by monitoring', async () => {
    await signInAs(USERS.marc)
    server.use(http.get('*/api/shipments', () => HttpResponse.json([{ id: 42 }])))
    await expect(shipmentsService.list()).rejects.toBeInstanceOf(ContractError)
    const [captured] = recentMonitoringEvents().filter(
      (event) => event.errorName === 'ContractError',
    )
    expect(captured).toMatchObject({
      level: 'error',
      user: { id: 'usr_010', role: 'ops_agent' },
      request: { method: 'GET', path: '/shipments', status: 200 },
    })
    // NFR-09: no personal data in monitoring.
    expect(JSON.stringify(recentMonitoringEvents())).not.toMatch(/Marc|marc\.puig/)
  })

  // Every service parses its response with the domain schema, so resolving is the proof.
  it(
    'every customer endpoint answers what its schema describes',
    async () => {
      await signInAs(USERS.diego)
      const delivered = shipmentIdOf('SH-10452')
      const atSea = shipmentIdOf('SH-10433')
      expect(await authService.me()).toMatchObject({ role: 'customer' })
      expect(await shipmentsService.list({ view: 'active', q: '104' })).not.toHaveLength(0)
      expect((await shipmentsService.getById(atSea)).reference).toBe('SH-10433')
      // SC-04: the route summary the compact transit line is drawn from.
      expect(await shipmentsService.getById(delivered)).toMatchObject({
        hasCustoms: true,
        lastDoneMilestone: { type: 'delivered' },
      })
      // SC-03: confirmed dates need no basis; our estimates say what they are based on.
      expect((await shipmentsService.getById(delivered)).eta?.basis).toBeNull()
      expect((await shipmentsService.getById(shipmentIdOf('SH-10436'))).eta?.basis).toBe(
        'BlueWave moved the vessel arrival 2 h ago',
      )
      expect((await shipmentsService.getTimeline(atSea)).milestones).not.toHaveLength(0)
      expect((await aiService.getSummary(atSea)).kind).toBe('summary')
      expect((await aiService.getEtaPrediction(atSea))?.kind).toBe('eta_prediction')
      // 02 §5.2: 204 when there is nothing to predict.
      expect(await aiService.getEtaPrediction(delivered)).toBeNull()

      const [alert] = await alertsService.list()
      expect(alert).toBeDefined()
      if (alert) expect((await alertsService.markRead(alert.id)).readAt).not.toBeNull()
      await alertsService.markAllRead()
      expect((await alertsService.list()).every((item) => item.readAt !== null)).toBe(true)

      const pod = (await documentsService.list(delivered)).find(
        (doc) => doc.type === 'proof_of_delivery',
      )
      const file = await documentsService.download(pod?.id ?? '')
      expect(file.fileName).toBe(pod?.fileName)
      expect(file.blob.type).toBe('application/pdf')
      expect(new TextDecoder().decode(await file.blob.arrayBuffer())).toMatch(
        /^%PDF-1\.4[\s\S]*%%EOF\n$/,
      )
      await authService.signOut()
    },
    SLOW_TEST_TIMEOUT_MS,
  )

  it(
    'every ops endpoint answers what its schema describes',
    async () => {
      await signInAs(USERS.elena)
      const shipmentId = shipmentIdOf('SH-10441')
      const counts = (await shipmentsService.list()).map((shipment) => shipment.openExceptionCount)
      expect(counts.every((count) => count !== undefined)).toBe(true)
      expect(counts.some((count) => (count ?? 0) > 0)).toBe(true)
      expect(await shipmentsService.getRawEvents(shipmentId)).not.toHaveLength(0)
      expect(await shipmentsService.getActivity(shipmentId)).not.toHaveLength(0)
      expect((await referenceService.get()).sites).toHaveLength(4)

      const [hold] = await exceptionsService.list({ shipmentId })
      expect(hold?.type).toBe('hold')
      expect((await exceptionsService.getById(hold?.id ?? '')).id).toBe(hold?.id)
      expect((await aiService.getPriority(hold?.id ?? '')).content.score).toBe(hold?.priorityScore)
      expect((await aiService.draftMessage(hold?.id ?? '')).kind).toBe('draft')
      expect(
        await exceptionsService.list({ status: 'all', type: 'hold', mode: 'sea' }),
      ).not.toHaveLength(0)

      const file = new File(['%PDF-1.4'], 'customs-declaration.pdf', { type: 'application/pdf' })
      const uploaded = await documentsService.upload(shipmentId, {
        type: 'customs_declaration',
        file,
      })
      expect(uploaded).toMatchObject({ status: 'available', fileName: 'customs-declaration.pdf' })

      const [unmapped] = await mappingsService.listUnmapped()
      const suggestion = await aiService.getMappingSuggestion(unmapped?.latestRawEventId ?? '')
      expect(suggestion.kind).toBe('mapping')
      const mapping = { operatorId: 'op_eur', rawCode: 'RET-PLAT', target: 'ignore' } as const
      expect(await mappingsService.confirm(mapping)).toMatchObject(mapping)
      expect(await mappingsService.listUnmapped()).toHaveLength(0)
      expect(await simulatorService.getNetwork()).toEqual({ mode: 'normal' })
    },
    SLOW_TEST_TIMEOUT_MS,
  )
})
