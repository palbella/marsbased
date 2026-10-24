import { describe, expect, it } from 'vitest'
import { database } from '@/mocks/db/instance'
import {
  aiService,
  alertsService,
  authService,
  documentsService,
  exceptionsService,
  ForbiddenError,
  mappingsService,
  NotFoundError,
  referenceService,
  shipmentsService,
  UnauthorizedError,
} from '@/services'
import { shipmentIdOf, signInAs, setupMockApi, USERS } from './setup'

setupMockApi()

// 07 §5: what each customer lands on.
const CUSTOMER_SHIPMENTS = [
  { email: USERS.laura, accountId: 'acc_001', count: 4 },
  { email: USERS.jordi, accountId: 'acc_002', count: 3 },
  { email: USERS.ana, accountId: 'acc_003', count: 2 },
  { email: USERS.camille, accountId: 'acc_004', count: 3 },
  { email: USERS.diego, accountId: 'acc_005', count: 10 },
]

const OPS_SITES = [
  { email: USERS.marc, sites: ['site_zgz', 'site_vlc'] },
  { email: USERS.nuria, sites: ['site_bio', 'site_bcn'] },
]

describe('US-01, BR-PM-01 perimeter', () => {
  it.each(CUSTOMER_SHIPMENTS)(
    '$email sees only their account',
    async ({ email, accountId, count }) => {
      await signInAs(email)
      const shipments = await shipmentsService.list()
      expect(shipments).toHaveLength(count)
      expect(shipments.every((shipment) => shipment.accountId === accountId)).toBe(true)
      // CP-16: customers never see exceptions, not even as a count.
      expect(shipments.every((shipment) => shipment.openExceptionCount === undefined)).toBe(true)
    },
  )

  it.each(OPS_SITES)('$email sees only the shipments of their sites', async ({ email, sites }) => {
    await signInAs(email)
    const shipments = await shipmentsService.list()
    const expected = database.shipments.where((row) => sites.includes(row.originSiteId))
    expect(shipments.map((shipment) => shipment.id).sort()).toEqual(
      expected.map((row) => row.id).sort(),
    )
    const exceptions = await exceptionsService.list({ status: 'all' })
    const visible = new Set(expected.map((row) => row.id))
    expect(exceptions.every((exception) => visible.has(exception.shipmentId))).toBe(true)
  })

  it('the ops manager sees every shipment', async () => {
    await signInAs(USERS.elena)
    expect(await shipmentsService.list()).toHaveLength(22)
  })

  it("07 §5: Marc Puig's attention queue, ordered by BR-PR-02", async () => {
    await signInAs(USERS.marc)
    const queue = await exceptionsService.list()
    expect(
      queue.map(({ shipmentReference, type, priorityScore }) => [
        shipmentReference,
        type,
        priorityScore,
      ]),
    ).toEqual([
      ['SH-10441', 'hold', 90],
      ['SH-10444', 'customs_incident', 60],
      ['SH-10436', 'delay', 60],
      ['SH-10411', 'delay', 54],
      ['SH-10438', 'missing_document', 48],
      ['SH-10409', 'delay', 24],
    ])
  })

  it('reference data only offers what the perimeter uses (OP-21)', async () => {
    await signInAs(USERS.marc)
    const reference = await referenceService.get()
    expect(reference.sites.map((site) => site.id).sort()).toEqual(['site_vlc', 'site_zgz'])
  })
})

describe('BR-PM-02 out of perimeter answers 404', () => {
  it('for an ops agent opening another site’s shipment and everything under it', async () => {
    await signInAs(USERS.marc)
    const bilbao = shipmentIdOf('SH-10406')
    await expect(shipmentsService.getById(bilbao)).rejects.toBeInstanceOf(NotFoundError)
    await expect(shipmentsService.getTimeline(bilbao)).rejects.toBeInstanceOf(NotFoundError)
    await expect(documentsService.list(bilbao)).rejects.toBeInstanceOf(NotFoundError)
    await expect(aiService.getSummary(bilbao)).rejects.toBeInstanceOf(NotFoundError)
  })

  it('for a customer opening another account’s shipment, same as a missing one', async () => {
    await signInAs(USERS.laura)
    await expect(shipmentsService.getById(shipmentIdOf('SH-10436'))).rejects.toBeInstanceOf(
      NotFoundError,
    )
    await expect(shipmentsService.getById('shp_999')).rejects.toBeInstanceOf(NotFoundError)
  })
})

describe('BR-PM-03 role permissions answer 403', () => {
  it('for a customer calling ops-only endpoints', async () => {
    await signInAs(USERS.diego)
    const shipmentId = shipmentIdOf('SH-10436')
    const calls = [
      () => exceptionsService.list(),
      () => shipmentsService.getRawEvents(shipmentId),
      () => shipmentsService.getActivity(shipmentId),
      () => referenceService.get(),
      () => mappingsService.listUnmapped(),
      () => aiService.getPriority('exc_001'),
    ]
    for (const call of calls) await expect(call()).rejects.toBeInstanceOf(ForbiddenError)
  })

  it('for ops calling the customer alerts', async () => {
    await signInAs(USERS.marc)
    await expect(alertsService.list()).rejects.toBeInstanceOf(ForbiddenError)
  })
})

describe('authentication (US-00)', () => {
  it('rejects requests without a token', async () => {
    await expect(shipmentsService.list()).rejects.toBeInstanceOf(UnauthorizedError)
  })

  it('answers a wrong password with a generic 401', async () => {
    const attempt = authService.signIn({ email: USERS.marc, password: 'wrong' })
    await expect(attempt).rejects.toBeInstanceOf(UnauthorizedError)
  })

  it('ends the session on sign-out', async () => {
    const user = await signInAs(USERS.diego)
    expect(await authService.me()).toEqual(user)
    expect(user.perimeter).toEqual({
      kind: 'account',
      account: { id: 'acc_005', name: 'Corvane México S.A. de C.V.', type: 'subsidiary' },
    })
    await authService.signOut()
    await expect(authService.me()).rejects.toBeInstanceOf(UnauthorizedError)
  })
})

describe('BR-PM-04, BR-PM-05', () => {
  it('BR-PM-04: the customer timeline carries no raw payloads', async () => {
    await signInAs(USERS.diego)
    const timeline = await shipmentsService.getTimeline(shipmentIdOf('SH-10441'))
    expect(JSON.stringify(timeline)).not.toMatch(/payload|eventCode|message/)
    expect(timeline.customsHolds).toHaveLength(1)
  })

  it('BR-PM-05: unmapped statuses list every occurrence but only perimeter shipments', async () => {
    await signInAs(USERS.nuria)
    const [retPlat] = await mappingsService.listUnmapped()
    expect(retPlat).toMatchObject({ operatorId: 'op_eur', rawCode: 'RET-PLAT', occurrences: 2 })
    expect(retPlat?.affectedShipments.map((shipment) => shipment.reference)).toEqual(['SH-10408'])
  })
})
