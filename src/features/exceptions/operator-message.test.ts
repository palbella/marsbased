import { describe, expect, it } from 'vitest'
import { operatorMessageTemplate } from './operator-message'

describe('OP-12 contact operator template', () => {
  it('greets the operator, names the shipment and reason, and asks for status and ETA', () => {
    const message = operatorMessageTemplate({
      operatorName: 'BlueWave Shipping Line',
      shipmentReference: 'SH-10436',
      reason: 'ETA 30 h after the committed date',
    })
    expect(message).toBe(
      [
        'Hello BlueWave Shipping Line team,',
        'Regarding shipment SH-10436: ETA 30 h after the committed date.',
        'Please send us an update on its status and the current ETA as soon as possible.',
        'Kind regards,\nCorvane Industrial logistics team',
      ].join('\n\n'),
    )
  })
})
