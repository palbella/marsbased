import { beforeEach, describe, expect, it } from 'vitest'
import { exceptionSchema, type ExceptionType } from '@/domain'
import {
  alertsService,
  ConflictError,
  documentsService,
  exceptionsService,
  ForbiddenError,
  shipmentsService,
  ValidationError,
} from '@/services'
import { apiPost } from '@/services/api-client'
import { resetData, SLOW_TEST_TIMEOUT_MS, signInAs, setupMockApi, USERS } from './setup'

setupMockApi()

beforeEach(async () => {
  resetData()
  await signInAs(USERS.marc)
}, SLOW_TEST_TIMEOUT_MS)

async function openException(reference: string, type: ExceptionType) {
  const queue = await exceptionsService.list()
  const exception = queue.find((item) => item.shipmentReference === reference && item.type === type)
  if (!exception) throw new Error(`No open ${type} on ${reference}`)
  return exception
}

describe('POST /api/exceptions/:id/actions (04 §10)', () => {
  it('BR-AC-01: notify customer acknowledges and creates a message alert the customer sees', async () => {
    const delay = await openException('SH-10436', 'delay')
    const payload = {
      subject: 'Delay on SH-10436',
      message: 'The vessel is late.',
      requiresAction: false,
    }
    const updated = await exceptionsService.runAction(delay.id, {
      type: 'notify_customer',
      payload,
    })
    expect(updated.status).toBe('acknowledged')
    // BR-NA-01: once the customer is messaged, contacting the operator comes first.
    expect(updated.nextActions[0]).toBe('contact_operator')

    await signInAs(USERS.diego)
    const alerts = await alertsService.list({ shipmentId: delay.shipmentId })
    expect(alerts[0]).toMatchObject({ type: 'message', title: payload.subject, readAt: null })
  })

  it('BR-AC-02: contact operator acknowledges and waits on the operator', async () => {
    const delay = await openException('SH-10436', 'delay')
    const updated = await exceptionsService.runAction(delay.id, {
      type: 'contact_operator',
      payload: { operatorId: 'op_bws', message: 'Please confirm the new ETA.' },
    })
    expect(updated).toMatchObject({ status: 'acknowledged', waitingOn: 'operator' })
  })

  it('BR-AC-02: an operator that does not carry the shipment answers 422', async () => {
    const delay = await openException('SH-10436', 'delay')
    const contact = exceptionsService.runAction(delay.id, {
      type: 'contact_operator',
      payload: { operatorId: 'op_tir', message: 'Hello' },
    })
    await expect(contact).rejects.toBeInstanceOf(ValidationError)
  })

  it('BR-AC-03: uploading the commercial invoice resolves missing_document automatically', async () => {
    const missing = await openException('SH-10438', 'missing_document')
    const updated = await exceptionsService.runAction(missing.id, {
      type: 'upload_document',
      payload: { type: 'commercial_invoice', fileName: 'invoice.pdf', size: 52_000 },
    })
    expect(updated.status).toBe('resolved')
    expect(updated.resolutionNote).toMatch(/^Resolved automatically/)
    const documents = await documentsService.list(missing.shipmentId)
    expect(documents.find((document) => document.type === 'commercial_invoice')).toMatchObject({
      status: 'available',
      fileName: 'invoice.pdf',
    })
  })

  it('BR-AC-04: acknowledge assigns the exception to the user', async () => {
    const delay = await openException('SH-10409', 'delay')
    const updated = await exceptionsService.runAction(delay.id, {
      type: 'acknowledge',
      payload: {},
    })
    expect(updated).toMatchObject({ status: 'acknowledged', assigneeId: 'usr_010' })
  })

  it('BR-AC-05: resolve takes a required note', async () => {
    const delay = await openException('SH-10409', 'delay')
    const noNote = exceptionsService.runAction(delay.id, {
      type: 'resolve',
      payload: { note: ' ' },
    })
    await expect(noNote).rejects.toBeInstanceOf(ValidationError)

    const note = 'Customer agreed to the new date.'
    const updated = await exceptionsService.runAction(delay.id, {
      type: 'resolve',
      payload: { note },
    })
    expect(updated).toMatchObject({ status: 'resolved', resolutionNote: note, nextActions: [] })
    // OP-01: resolved exceptions leave the default (active) queue.
    expect((await exceptionsService.list()).some((item) => item.id === delay.id)).toBe(false)
    const resolved = await exceptionsService.list({
      status: 'resolved',
      shipmentId: delay.shipmentId,
    })
    expect(resolved.map((item) => item.id)).toContain(delay.id)
  })

  it('BR-AC-06: an action on a resolved exception answers 409', async () => {
    const delay = await openException('SH-10409', 'delay')
    await exceptionsService.runAction(delay.id, { type: 'resolve', payload: { note: 'Done.' } })
    const again = exceptionsService.runAction(delay.id, { type: 'acknowledge', payload: {} })
    await expect(again).rejects.toBeInstanceOf(ConflictError)
  })

  it('BR-AC-06: an invalid payload answers 422', async () => {
    const delay = await openException('SH-10409', 'delay')
    const invalid = apiPost(
      `/exceptions/${delay.id}/actions`,
      { type: 'escalate', payload: {} },
      exceptionSchema,
    )
    await expect(invalid).rejects.toBeInstanceOf(ValidationError)
  })

  it('records every action in the shipment activity with its user (OP-15)', async () => {
    const delay = await openException('SH-10409', 'delay')
    await exceptionsService.runAction(delay.id, { type: 'acknowledge', payload: {} })
    const activity = await shipmentsService.getActivity(delay.shipmentId)
    expect(activity.at(-1)).toMatchObject({
      type: 'acknowledge',
      userId: 'usr_010',
      userName: 'Marc Puig',
    })
  })

  it('BR-PM-03: customers cannot run actions', async () => {
    const delay = await openException('SH-10436', 'delay')
    await signInAs(USERS.diego)
    const attempt = exceptionsService.runAction(delay.id, { type: 'acknowledge', payload: {} })
    await expect(attempt).rejects.toBeInstanceOf(ForbiddenError)
  })
})
