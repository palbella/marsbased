import { describe, expect, it } from 'vitest'
import type { Alert } from '@/domain'
import { groupAlertsByDay, newUnreadAlerts } from './alert-groups'

const NOW = new Date(2026, 10, 12, 15, 0)

function alert(id: string, createdAt: Date, readAt: string | null = null): Alert {
  return {
    id,
    shipmentId: 'shp_1',
    shipmentReference: 'SH-10436',
    type: 'late',
    title: 'Delivery delayed by ~1 day',
    message: 'The vessel departed late.',
    etaImpact: null,
    requiresAction: false,
    createdAt: createdAt.toISOString(),
    readAt,
  }
}

describe('CP-20 alerts grouped by day', () => {
  it('splits Today from Earlier at local midnight, keeping the order', () => {
    const alerts = [
      alert('a', new Date(2026, 10, 12, 10, 42)),
      alert('b', new Date(2026, 10, 12, 0, 0)),
      alert('c', new Date(2026, 10, 11, 23, 59)),
    ]
    expect(groupAlertsByDay(alerts, NOW)).toEqual([
      { title: 'Today', alerts: [alerts[0], alerts[1]] },
      { title: 'Earlier', alerts: [alerts[2]] },
    ])
  })

  it('leaves out empty groups', () => {
    const alerts = [alert('c', new Date(2026, 10, 3, 8, 15))]
    expect(groupAlertsByDay(alerts, NOW).map((group) => group.title)).toEqual(['Earlier'])
  })
})

describe('CP-31 new unread alerts', () => {
  it('returns unread alerts that were not in the previous data', () => {
    const fresh = alert('new', NOW)
    const read = alert('read', NOW, NOW.toISOString())
    const known = alert('known', NOW)
    expect(newUnreadAlerts(new Set(['known']), [fresh, read, known])).toEqual([fresh])
  })
})
