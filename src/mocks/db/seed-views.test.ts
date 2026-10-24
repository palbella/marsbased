import { describe, expect, it } from 'vitest'
import { comparePriority } from '@/mocks/engine/priority'
import { hoursFromSeededNow, seededDb, seededShipment } from './seeded-state'

function queueOf(userId: string) {
  const sites = seededDb.userSites.where((row) => row.userId === userId).map((row) => row.siteId)
  return seededDb.shipments
    .where((shipment) => sites.includes(shipment.originSiteId))
    .flatMap((shipment) => seededShipment(shipment.reference).open.map((e) => ({ ...e, shipment })))
    .map((exception) => ({ ...exception, score: exception.priority.score }))
    .sort(comparePriority)
}

const unreadAlerts = (accountId: string) =>
  seededDb.alerts.where((alert) => alert.accountId === accountId && alert.readAt === null)

describe('07 §5: what each test account sees on sign-in', () => {
  it('Marc Puig: the attention queue in the exact order and scores of 07 §5', () => {
    const queue = queueOf('usr_010')

    expect(queue.map((e) => [e.shipment.reference, e.type, e.score])).toEqual([
      ['SH-10441', 'hold', 90],
      ['SH-10444', 'customs_incident', 60],
      ['SH-10436', 'delay', 60],
      ['SH-10411', 'delay', 54],
      ['SH-10438', 'missing_document', 48],
      ['SH-10409', 'delay', 24],
    ])
    expect(queue[1]).toMatchObject({ waitingOn: 'operator' })
  })

  it('Núria Vidal: the stale SH-10406, and RET-PLAT unmapped twice', () => {
    expect(queueOf('usr_011').map((e) => [e.shipment.reference, e.type])).toEqual([
      ['SH-10406', 'stale'],
    ])
    expect(seededDb.rawEvents.where((row) => row.mappingStatus === 'unmapped')).toHaveLength(2)
  })

  it('Laura Gómez: an unread at_risk alert', () => {
    expect(unreadAlerts('acc_001').map((alert) => alert.type)).toEqual(['at_risk'])
  })

  it('Ana Ruiz and Camille Durand: a late shipment with its alert', () => {
    expect(unreadAlerts('acc_003').map((alert) => alert.type)).toEqual(['late'])
    expect(unreadAlerts('acc_004').map((alert) => alert.type)).toEqual(['late'])
  })

  it('Diego Hernández: several unread alerts (hold, customs incident, delay)', () => {
    expect(
      unreadAlerts('acc_005')
        .map((alert) => alert.type)
        .sort(),
    ).toEqual(['customs_issue', 'late', 'on_hold'])
  })
})

describe('SD-02 Derived as if the system had been running', () => {
  it('dates each exception and alert when its condition first held', () => {
    const sh10438 = seededShipment('SH-10438')
    const sh10441 = seededShipment('SH-10441')

    // Planned customs submission in 40 h: the 72 h window opens just after −32 h, and the
    // first checkpoint after it is the daily BlueWave POS received at −31 h 55 min.
    expect(hoursFromSeededNow(sh10438.open[0]?.detectedAt ?? null)).toBeCloseTo(-31.92, 2)
    // On the reception of the `CHLD` event, 5 h ago plus the transmission delay.
    expect(hoursFromSeededNow(sh10441.alerts[0]?.createdAt ?? null)).toBeCloseTo(-4.92, 2)
  })

  it('records the stale exception SH-10444 had before the incident explained it (BR-EX-11)', () => {
    const [stale] = seededShipment('SH-10444').exceptions.filter((e) => e.type === 'stale')

    expect(stale).toMatchObject({ status: 'resolved' })
    expect(stale?.resolutionNote).toContain('explained by an open hold or customs incident')
  })

  it('creates alerts older than 24 h as read, and keeps the 24 h one unread', () => {
    for (const alert of seededDb.alerts.all()) {
      const age = -(hoursFromSeededNow(alert.createdAt) ?? 0)
      expect(alert.readAt === null, `${alert.id} at −${age} h`).toBe(age <= 24)
    }
    expect(seededShipment('SH-10444').alerts).toMatchObject([
      { type: 'customs_issue', readAt: null },
    ])
  })
})

describe('SD-03 Past actions are replayed through the action rules', () => {
  it('SH-10405: notify_customer 2 days ago, with its message alert', () => {
    const { alerts } = seededShipment('SH-10405')

    expect(alerts.map((alert) => alert.type)).toEqual(['at_risk', 'late', 'message', 'delivered'])
    expect(hoursFromSeededNow(alerts[2]?.createdAt ?? null)).toBe(-48)
  })

  it('SH-10444: contact_operator 20 h ago, by Marc Puig', () => {
    const contact = seededDb.activity.all().find((entry) => entry.type === 'contact_operator')

    expect(contact).toMatchObject({ userId: 'usr_010', shipmentId: 'shp_019' })
    expect(hoursFromSeededNow(contact?.at ?? null)).toBe(-20)
  })
})
