import { describe, expect, it } from 'vitest'
import type { Alert, AlertType } from '@/domain'
import { incidentAlert } from './incident-notice'

function alert(id: string, type: AlertType): Alert {
  return {
    id,
    shipmentId: 'shp_1',
    shipmentReference: 'SH-10441',
    type,
    title: `${type} title`,
    message: `${type} message`,
    etaImpact: null,
    requiresAction: false,
    createdAt: '2026-11-12T10:00:00.000Z',
    readAt: null,
  }
}

describe('CP-12 hold and customs-incident notice', () => {
  it('hold: while the shipment is on hold, from the latest on_hold alert', () => {
    const alerts = [
      alert('eta', 'eta_changed'),
      alert('hold-new', 'on_hold'),
      alert('hold-old', 'on_hold'),
    ]
    expect(incidentAlert({ status: 'on_hold' }, alerts)?.id).toBe('hold-new')
  })

  it('hold: no notice once the status is no longer on hold', () => {
    expect(incidentAlert({ status: 'in_customs' }, [alert('hold', 'on_hold')])).toBeNull()
  })

  it('customs incident: while the latest alert is customs_issue and still in customs', () => {
    expect(incidentAlert({ status: 'in_customs' }, [alert('issue', 'customs_issue')])?.id).toBe(
      'issue',
    )
  })

  it('customs incident: no notice after the release (status moved on)', () => {
    expect(incidentAlert({ status: 'in_transit' }, [alert('issue', 'customs_issue')])).toBeNull()
  })

  it('customs incident: newer ETA or message alerts neither show nor hide it', () => {
    const alerts = [
      alert('message', 'message'),
      alert('late', 'late'),
      alert('issue', 'customs_issue'),
    ]
    expect(incidentAlert({ status: 'in_customs' }, alerts)?.id).toBe('issue')
    expect(incidentAlert({ status: 'in_customs' }, [alert('late', 'late')])).toBeNull()
  })

  it('customs incident: a newer on_hold alert replaces it as the latest customs alert', () => {
    const alerts = [alert('hold', 'on_hold'), alert('issue', 'customs_issue')]
    expect(incidentAlert({ status: 'in_customs' }, alerts)).toBeNull()
  })
})
