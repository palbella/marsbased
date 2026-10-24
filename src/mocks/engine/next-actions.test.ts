import { describe, expect, it } from 'vitest'
import type { ExceptionType } from '@/domain'
import { applyExceptionAction } from './actions/apply-action'
import { loadShipmentFacts } from './facts'
import { ALWAYS_AVAILABLE_ACTIONS, nextActions, requiredDocuments } from './next-actions'
import { recompute } from './recompute'
import { deriveShipment } from './shipment-view'
import { NOW } from './test-fixtures'
import { hoursLater, openExceptions, seededTables } from './test-db'

function actionsFor(db: ReturnType<typeof seededTables>, shipmentId: string, type: ExceptionType, now = NOW) {
  const facts = loadShipmentFacts(db, shipmentId)
  const exception = openExceptions(db, shipmentId).find((row) => row.type === type)
  if (!facts || !exception) throw new Error(`${shipmentId} should have a ${type} exception`)
  return nextActions(exception, facts, deriveShipment(facts, now), db.activity.all())
} // prettier-ignore

function engineRan(...shipmentIds: string[]) {
  const db = seededTables()
  for (const shipmentId of shipmentIds) recompute(db, shipmentId, NOW)
  return db
}

describe('BR-NA-01 Suggested actions', () => {
  it('delay: notify the customer first, contact the operator once messaged', () => {
    const db = engineRan('shp_016')
    expect(actionsFor(db, 'shp_016', 'delay')).toEqual(['notify_customer', 'contact_operator'])

    const [delay] = openExceptions(db, 'shp_016')
    const payload = { subject: 'Delay', message: 'Vessel delayed.', requiresAction: false }
    const request = { type: 'notify_customer', payload }
    applyExceptionAction(db, { exceptionId: delay?.id ?? '', userId: 'usr_010', request, now: NOW })
    expect(actionsFor(db, 'shp_016', 'delay')).toEqual(['contact_operator', 'notify_customer'])
  })

  it('hold: upload when a required document is missing (SH-10441), else contact', () => {
    expect(actionsFor(engineRan('shp_018'), 'shp_018', 'hold')).toEqual([
      'upload_document',
      'notify_customer',
    ])
  })

  it('customs_incident: contact the operator, then notify (SH-10444)', () => {
    expect(actionsFor(engineRan('shp_019'), 'shp_019', 'customs_incident')).toEqual([
      'contact_operator',
      'notify_customer',
    ])
  })

  it('stale: contact the operator, and notify too once very stale (SH-10406)', () => {
    const db = engineRan('shp_006')
    expect(actionsFor(db, 'shp_006', 'stale')).toEqual(['contact_operator'])

    recompute(db, 'shp_006', hoursLater(10))
    expect(actionsFor(db, 'shp_006', 'stale', hoursLater(10))).toEqual([
      'contact_operator',
      'notify_customer',
    ])
  })

  it('missing_document: upload, then contact the operator (SH-10438)', () => {
    expect(actionsFor(engineRan('shp_017'), 'shp_017', 'missing_document')).toEqual([
      'upload_document',
      'contact_operator',
    ])
  })
})

describe('BR-NA-02 Always available', () => {
  it('acknowledge and resolve are always available', () => {
    expect(ALWAYS_AVAILABLE_ACTIONS).toEqual(['acknowledge', 'resolve'])
  })
})

describe('BR-NA-03 Required documents', () => {
  const required = (shipmentId: string) => {
    const facts = loadShipmentFacts(seededTables(), shipmentId)
    if (!facts) throw new Error(`No facts for ${shipmentId}`)
    return requiredDocuments(facts, deriveShipment(facts, NOW))
  }

  it('road shipments need the CMR, plus the POD once delivered', () => {
    expect(required('shp_001')).toEqual(['cmr'])
    expect(required('shp_003')).toEqual(['cmr', 'proof_of_delivery'])
  })

  it('sea shipments need BL, invoice and packing list, plus the declaration after CSUB', () => {
    expect(required('shp_015')).toEqual(['bill_of_lading', 'commercial_invoice', 'packing_list'])
    expect(required('shp_020')).toContain('customs_declaration')
    expect(required('shp_022')).toEqual([
      'bill_of_lading',
      'commercial_invoice',
      'packing_list',
      'customs_declaration',
      'proof_of_delivery',
    ])
  })
})
