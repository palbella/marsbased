import { describe, expect, it } from 'vitest'
import { exceptionSchema } from './exception'
import { exceptionActionRequestSchema } from './exception-action'

const exception = {
  id: 'exc_004',
  shipmentId: 'shp_016',
  shipmentReference: 'SH-10436',
  accountName: 'Corvane México S.A. de C.V.',
  operatorId: 'op_bws',
  operatorName: 'BlueWave Shipping Line',
  mode: 'sea',
  type: 'delay',
  severity: 'high',
  status: 'open',
  waitingOn: null,
  assigneeId: null,
  reason: 'Vessel ETA moved +30 h. Customer not yet notified.',
  nextActions: ['notify_customer', 'contact_operator'],
  priorityScore: 78,
  priorityFactors: ['Key account', 'International'],
  detectedAt: '2026-11-05T08:00:00Z',
  resolvedAt: null,
  resolutionNote: null,
}

describe('exceptionSchema', () => {
  it('parses an exception', () => {
    expect(exceptionSchema.parse(exception)).toEqual(exception)
  })

  it('rejects a type outside the glossary', () => {
    expect(exceptionSchema.safeParse({ ...exception, type: 'damage' }).success).toBe(false)
  })

  it('rejects a severity outside BR-PR-01', () => {
    expect(exceptionSchema.safeParse({ ...exception, severity: 'critical' }).success).toBe(false)
  })

  it('rejects a status outside BR-EX-09', () => {
    expect(exceptionSchema.safeParse({ ...exception, status: 'closed' }).success).toBe(false)
  })

  it('rejects a next action outside BR-NA-01', () => {
    const nextActions = ['call_customer']
    expect(exceptionSchema.safeParse({ ...exception, nextActions }).success).toBe(false)
  })

  it('rejects a priority score above 100 (BR-PR-01)', () => {
    expect(exceptionSchema.safeParse({ ...exception, priorityScore: 101 }).success).toBe(false)
  })
})

describe('exceptionActionRequestSchema', () => {
  const validRequests = [
    {
      type: 'notify_customer',
      payload: { subject: 'Delay on SH-10436', message: 'New ETA…', requiresAction: false },
    },
    { type: 'contact_operator', payload: { operatorId: 'op_bws', message: 'Please confirm.' } },
    {
      type: 'upload_document',
      payload: { type: 'commercial_invoice', fileName: 'invoice.pdf', size: 120_000 },
    },
    { type: 'acknowledge', payload: {} },
    { type: 'resolve', payload: { note: 'Customer informed by phone.' } },
  ]

  it.each(validRequests)('parses a $type action (BR-AC-01..05)', (request) => {
    expect(exceptionActionRequestSchema.parse(request)).toEqual(request)
  })

  it('rejects an unknown action type', () => {
    const request = { type: 'escalate', payload: {} }
    expect(exceptionActionRequestSchema.safeParse(request).success).toBe(false)
  })

  it('rejects resolve without a note (BR-AC-05)', () => {
    const request = { type: 'resolve', payload: { note: '   ' } }
    expect(exceptionActionRequestSchema.safeParse(request).success).toBe(false)
  })

  it('rejects a payload that belongs to another action', () => {
    const request = { type: 'contact_operator', payload: { note: 'Done' } }
    expect(exceptionActionRequestSchema.safeParse(request).success).toBe(false)
  })

  it('rejects an unknown document type (BR-AC-03)', () => {
    const payload = { type: 'photo', fileName: 'photo.pdf', size: 100 }
    const request = { type: 'upload_document', payload }
    expect(exceptionActionRequestSchema.safeParse(request).success).toBe(false)
  })

  it('rejects a document over 10 MB (OP-13)', () => {
    const payload = { type: 'cmr', fileName: 'cmr.pdf', size: 11 * 1024 * 1024 }
    const request = { type: 'upload_document', payload }
    expect(exceptionActionRequestSchema.safeParse(request).success).toBe(false)
  })
})
