import type { ExceptionActionRequest, ExceptionType } from '@/domain'
import type { Clock } from '@/mocks/clock'

export interface PastActionSeed {
  at: string
  userId: string
  shipmentId: string
  // The open exception of this type on the shipment receives the action.
  exceptionType: ExceptionType
  action: ExceptionActionRequest
}

// 07 §4 "Past actions". Not applied here: seeding replays them through the action rules
// (SD-03), so their effects stay consistent.
export function pastActionsSeed({ hoursAgo, daysAgo }: Clock): PastActionSeed[] {
  return [
    {
      at: hoursAgo(20),
      userId: 'usr_010',
      shipmentId: 'shp_019',
      exceptionType: 'customs_incident',
      action: {
        type: 'contact_operator',
        payload: { operatorId: 'op_bws', message: 'Please confirm customs status at Veracruz.' },
      },
    },
    {
      at: daysAgo(2),
      userId: 'usr_010',
      shipmentId: 'shp_005',
      exceptionType: 'delay',
      action: {
        type: 'notify_customer',
        payload: {
          subject: 'SH-10405 is running about 4 hours late',
          message:
            'Dear customer, your shipment SH-10405 from Valencia to Madrid is running about 4 hours behind schedule. We will confirm the delivery as soon as it happens.',
          requiresAction: false,
        },
      },
    },
  ]
}
