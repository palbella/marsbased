import type { Exception } from '@/domain'

// OP-12: the editable starting point of "Contact operator". The only place its wording lives:
// short, formal, English.
const SIGN_OFF = 'Kind regards,\nCorvane Industrial logistics team'

export function operatorMessageTemplate(
  exception: Pick<Exception, 'operatorName' | 'shipmentReference' | 'reason'>,
): string {
  return [
    `Hello ${exception.operatorName} team,`,
    `Regarding shipment ${exception.shipmentReference}: ${exception.reason}.`,
    'Please send us an update on its status and the current ETA as soon as possible.',
    SIGN_OFF,
  ].join('\n\n')
}
