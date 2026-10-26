// @vitest-environment jsdom
import '@/test/dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { isPredictedRisk, statusSentence } from '@/domain'
import { groupArrivals } from '@/features/arrivals/arrival-groups'
import { ShipmentDetail } from '@/features/shipment-detail'
import { server } from '@/mocks/node'
import { formatDay } from '@/lib/format-date'
import { aiService, alertsService, createQueryClient, shipmentsService } from '@/services'
import {
  resetData,
  setupMockApi,
  shipmentIdOf,
  signInAs,
  SLOW_TEST_TIMEOUT_MS,
  USERS,
} from './setup'

setupMockApi()

// CP-16, BR-PM-04: the customer endpoints the detail page may call (02 §5.2).
const CUSTOMER_DETAIL_PATHS = [
  /^\/api\/shipments\/[^/]+$/,
  /^\/api\/shipments\/[^/]+\/(timeline|documents)$/,
  /^\/api\/ai\/shipments\/[^/]+\/(summary|eta-prediction)$/,
  /^\/api\/alerts$/,
]

function renderDetail(id: string) {
  const requested: string[] = []
  server.events.on('request:start', ({ request }) => {
    requested.push(new URL(request.url).pathname)
  })
  render(
    <QueryClientProvider client={createQueryClient()}>
      <ShipmentDetail id={id} />
    </QueryClientProvider>,
  )
  return requested
}

describe('07 §5: what each customer lands on', () => {
  it('Laura: 4 shipments, SH-10404 at risk pinned on top, an unread at-risk alert', async () => {
    await signInAs(USERS.laura)
    const shipments = await shipmentsService.list({ view: 'active' })
    const [first] = groupArrivals(shipments, new Date())
    expect(first?.id).toBe('attention')
    expect(first?.shipments[0]).toMatchObject({ reference: 'SH-10404', onTime: 'at_risk' })
    const alerts = await alertsService.list()
    expect(alerts.some((alert) => alert.type === 'at_risk' && alert.readAt === null)).toBe(true)
  })

  it('Diego: 10 shipments with hold, customs incident and delay; several unread alerts', async () => {
    await signInAs(USERS.diego)
    const shipments = await shipmentsService.list()
    expect(shipments).toHaveLength(10)
    expect(shipments.map((shipment) => shipment.status)).toEqual(
      expect.arrayContaining(['on_hold', 'in_customs']),
    )
    expect(shipments.some((shipment) => shipment.onTime === 'late')).toBe(true)
    const alerts = await alertsService.list()
    expect(alerts.filter((alert) => alert.readAt === null).length).toBeGreaterThan(1)
  })
})

describe('CP-03 status sentence on seeded data', () => {
  it('SH-10432 is at risk because of the AI and says so', async () => {
    await signInAs(USERS.diego)
    const id = shipmentIdOf('SH-10432')
    const shipment = await shipmentsService.getById(id)
    const insight = await aiService.getEtaPrediction(id)
    if (!insight) throw new Error('SH-10432 has no ETA prediction')
    const prediction = { value: insight.content.predictedEta.value, confidence: insight.confidence }
    expect(isPredictedRisk(shipment)).toBe(true)
    expect(statusSentence(shipment, prediction, formatDay)).toBe(
      // The seeded prediction sits ~35 h after the committed date.
      `AI predicts about 1 day behind the committed ${formatDay(shipment.plannedEta)}`,
    )
  })
})

describe('CP-15, CP-16 customer shipment detail', () => {
  it(
    'calls only customer endpoints and shows no internal data',
    async () => {
      await signInAs(USERS.diego)
      const requested = renderDetail(shipmentIdOf('SH-10441'))
      await screen.findByText('SH-10441')
      await screen.findByRole('region', { name: 'Timeline' })
      const outside = requested.filter(
        (path) => !CUSTOMER_DETAIL_PATHS.some((pattern) => pattern.test(path)),
      )
      expect(outside).toEqual([])
      expect(screen.queryByText(/raw event|exception|priority|activity/i)).toBeNull()
    },
    SLOW_TEST_TIMEOUT_MS,
  )

  it(
    "another account's shipment shows NOT FOUND and nothing else",
    async () => {
      await signInAs(USERS.laura)
      renderDetail(shipmentIdOf('SH-10436'))
      expect(await screen.findByText('NOT FOUND')).toBeTruthy()
      expect(screen.queryByText('SH-10436')).toBeNull()
    },
    SLOW_TEST_TIMEOUT_MS,
  )
})

describe('CP-21, CP-23 opening an alert marks it as read', () => {
  it('the unread count drops', async () => {
    resetData()
    await signInAs(USERS.laura)
    const before = await alertsService.list()
    const unread = before.filter((alert) => alert.readAt === null)
    const [first] = unread
    if (!first) throw new Error('Laura has no unread alert')
    await alertsService.markRead(first.id)
    const after = await alertsService.list()
    expect(after.filter((alert) => alert.readAt === null)).toHaveLength(unread.length - 1)
    resetData()
  })
})
