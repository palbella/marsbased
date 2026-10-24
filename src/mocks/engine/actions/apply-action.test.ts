import { describe, expect, it } from 'vitest'
import { eventBuilders } from '@/mocks/db/tables/raw-events/builders'
import { recompute } from '../recompute'
import { NOW } from '../test-fixtures'
import { alertsOf, clock, hoursLater, ingest, openExceptions, seededTables } from '../test-db'
import { applyExceptionAction } from './apply-action'

const { tir } = eventBuilders(clock)

// The open exception of `shipmentId` once the engine has run at NOW.
function setUp(shipmentId: string) {
  const db = seededTables()
  recompute(db, shipmentId, NOW)
  const [exception] = openExceptions(db, shipmentId)
  if (!exception) throw new Error(`${shipmentId} should have an open exception`)
  const act = (request: unknown, userId = 'usr_010') =>
    applyExceptionAction(db, { exceptionId: exception.id, userId, request, now: NOW })
  return { db, exception, act }
}

describe('BR-AC-01 Notify customer', () => {
  it('creates a message alert for the account and acknowledges the exception', () => {
    const { db, exception, act } = setUp('shp_009')
    const payload = { subject: 'Delay', message: 'New ETA tomorrow.', requiresAction: false }

    expect(act({ type: 'notify_customer', payload }).ok).toBe(true)
    expect(alertsOf(db, 'shp_009').at(-1)).toMatchObject({
      type: 'message',
      accountId: 'acc_003',
      title: 'Delay',
      message: 'New ETA tomorrow.',
    })
    expect(db.exceptions.findById(exception.id)?.status).toBe('acknowledged')
    expect(db.activity.all().at(-1)).toMatchObject({
      type: 'notify_customer',
      userId: 'usr_010',
      at: NOW.toISOString(),
    })
  })
})

describe('BR-AC-02 Contact operator', () => {
  it('acknowledges and waits on the operator until it reports again', () => {
    const { db, exception, act } = setUp('shp_009')
    act({ type: 'contact_operator', payload: { operatorId: 'op_tir', message: 'Status?' } })
    expect(db.exceptions.findById(exception.id)).toMatchObject({
      status: 'acknowledged',
      waitingOn: 'operator',
      assigneeId: null,
    })

    ingest(db, 'shp_009', tir('900', 0.5, 'Albacete'), hoursLater(1))
    expect(db.exceptions.findById(exception.id)?.waitingOn).toBeNull()
  })

  it('rejects an operator that does not carry the shipment', () => {
    const { act } = setUp('shp_009')

    expect(
      act({ type: 'contact_operator', payload: { operatorId: 'op_bws', message: 'Hi' } }),
    ).toMatchObject({
      ok: false,
      status: 422,
    })
  })
})

describe('BR-AC-03 Upload document', () => {
  it('makes the document available and the engine resolves missing_document (SH-10438)', () => {
    const { db, exception, act } = setUp('shp_017')
    const payload = { type: 'commercial_invoice', fileName: 'invoice.pdf', size: 2048 }

    const result = act({ type: 'upload_document', payload })

    expect(result).toMatchObject({ ok: true })
    expect(result.ok && result.changes).toContainEqual({
      type: 'document.changed',
      shipmentId: 'shp_017',
    })
    expect(db.documents.where((row) => row.shipmentId === 'shp_017')).toContainEqual(
      expect.objectContaining({
        type: 'commercial_invoice',
        status: 'available',
        uploadedBy: 'usr_010',
      }),
    )
    expect(db.exceptions.findById(exception.id)?.status).toBe('resolved')
  })
})

describe('BR-AC-04 Acknowledge', () => {
  it('acknowledges and assigns the exception to the user', () => {
    const { db, exception, act } = setUp('shp_009')
    act({ type: 'acknowledge', payload: {} }, 'usr_020')

    expect(db.exceptions.findById(exception.id)).toMatchObject({
      status: 'acknowledged',
      assigneeId: 'usr_020',
    })
  })
})

describe('BR-AC-05 Resolve', () => {
  it('resolves with the note', () => {
    const { db, exception, act } = setUp('shp_009')
    act({ type: 'resolve', payload: { note: 'Agreed with the customer' } })

    expect(db.exceptions.findById(exception.id)).toMatchObject({
      status: 'resolved',
      resolvedAt: NOW.toISOString(),
      resolutionNote: 'Agreed with the customer',
    })
  })

  it('requires a note', () => {
    const { act } = setUp('shp_009')

    expect(act({ type: 'resolve', payload: { note: '  ' } })).toMatchObject({ status: 422 })
  })
})

describe('BR-AC-06 Validation', () => {
  it('answers 422 to an invalid payload and 409 to an action on a resolved exception', () => {
    const { act } = setUp('shp_009')

    expect(act({ type: 'notify_customer', payload: { subject: 'No message' } })).toMatchObject({
      ok: false,
      status: 422,
    })
    act({ type: 'resolve', payload: { note: 'Done' } })
    expect(act({ type: 'acknowledge', payload: {} })).toMatchObject({ ok: false, status: 409 })
  })

  it('answers 404 to an unknown exception', () => {
    const db = seededTables()
    const request = { type: 'acknowledge', payload: {} }

    expect(
      applyExceptionAction(db, { exceptionId: 'exc_999', userId: 'usr_010', request, now: NOW }),
    ).toMatchObject({ ok: false, status: 404 })
  })
})
