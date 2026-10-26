import { describe, expect, it } from 'vitest'
import type { ActivityEntry } from '@/domain'
import { describeActivity, exceptionHistory } from './activity-description'

const base = { shipmentId: 'shp_017', userId: null, userName: null }

const raised: ActivityEntry = {
  ...base,
  id: 'act_1',
  exceptionId: 'exc_1',
  at: '2026-10-20T10:00:00.000Z',
  type: 'exception_raised',
  payload: { exceptionType: 'missing_document', reason: 'Commercial invoice missing' },
}
const upload: ActivityEntry = {
  ...base,
  id: 'act_2',
  exceptionId: 'exc_1',
  at: '2026-10-21T10:00:00.000Z',
  userId: 'usr_marc',
  userName: 'Marc Puig',
  type: 'upload_document',
  payload: { type: 'commercial_invoice', fileName: 'invoice.pdf', size: 2048 },
}
const other: ActivityEntry = { ...raised, id: 'act_3', exceptionId: 'exc_2' }

describe('OP-10 exception history', () => {
  it('keeps only the exception entries, oldest first', () => {
    expect(exceptionHistory([upload, other, raised], 'exc_1')).toEqual([raised, upload])
  })

  it('BR-EX-07: says what the engine did automatically', () => {
    expect(describeActivity(raised)).toBe('Raised automatically: Commercial invoice missing')
  })

  it('BR-AC-03: names the uploaded document', () => {
    expect(describeActivity(upload)).toBe('Commercial invoice uploaded (invoice.pdf)')
  })
})
