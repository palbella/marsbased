import { describe, expect, it } from 'vitest'
import { detectExceptions, mostSpecificWins } from './exception-rules'
import { deriveShipment } from './shipment-view'
import { NOW, at, document, etaUpdate, event, facts, multimodalLegs } from './test-fixtures'

type FactsOptions = Parameters<typeof facts>[0]

const ALL_DOCUMENTS = [
  document('commercial_invoice', 'available'),
  document('packing_list', 'available'),
]

const detect = (options: FactsOptions) => {
  const shipment = facts(options)
  return detectExceptions(deriveShipment(shipment, NOW), shipment, NOW)
}
const ofType = (options: FactsOptions, type: string) =>
  detect(options).find((exception) => exception.type === type)
const customs = (events: ReturnType<typeof event>[], extra: FactsOptions = {}) => ({
  legs: multimodalLegs(-80),
  destinationCountry: 'MX',
  plannedEta: at(72),
  events,
  documents: ALL_DOCUMENTS,
  ...extra,
})

describe('BR-EX-01 Delay', () => {
  it('is raised when late: medium up to 24 h past the committed date, high beyond', () => {
    const departed = event('departed_site', 1, -3)

    expect(ofType({ events: [departed, etaUpdate(1, -1, 30)] }, 'delay')?.severity).toBe('medium')
    expect(ofType({ events: [departed, etaUpdate(1, -1, 40)] }, 'delay')?.severity).toBe('high')
    expect(ofType({ events: [departed, etaUpdate(1, -1, 20)] }, 'delay')).toBeUndefined()
  })
})

describe('BR-EX-02 Hold', () => {
  it('is raised high while a customs hold is open', () => {
    const submitted = event('customs_submitted', 2, -29)
    const hold = event('customs_hold', 2, -5)

    expect(ofType(customs([submitted, hold]), 'hold')).toMatchObject({
      severity: 'high',
      rawEventId: hold.rawEventId,
    })
    expect(
      ofType(customs([submitted, hold, event('customs_cleared', 2, -1)]), 'hold'),
    ).toBeUndefined()
  })
})

describe('BR-EX-03 Customs incident', () => {
  it('is raised high when customs has not cleared 48 h after submission', () => {
    expect(ofType(customs([event('customs_submitted', 2, -48)]), 'customs_incident')).toMatchObject(
      {
        severity: 'high',
      },
    )
    expect(
      ofType(customs([event('customs_submitted', 2, -47)]), 'customs_incident'),
    ).toBeUndefined()
  })

  it('is not raised while a hold is open (that is BR-EX-02)', () => {
    const events = [event('customs_submitted', 2, -72), event('customs_hold', 2, -5)]

    expect(ofType(customs(events), 'customs_incident')).toBeUndefined()
  })
})

describe('BR-EX-04 Stale', () => {
  it('is medium when stale and high when very stale', () => {
    expect(ofType({ events: [event('departed_site', 1, -13)] }, 'stale')?.severity).toBe('medium')
    expect(ofType({ events: [event('departed_site', 1, -25)] }, 'stale')?.severity).toBe('high')
    expect(ofType({ events: [event('departed_site', 1, -11)] }, 'stale')).toBeUndefined()
  })
})

describe('BR-EX-05 Missing document', () => {
  const withInvoicePending = (vesselArrival: number) => ({
    legs: multimodalLegs(vesselArrival),
    destinationCountry: 'MX',
    documents: [document('commercial_invoice', 'pending'), document('packing_list', 'available')],
  })

  it('is medium within 72 h of the planned customs submission and high under 24 h', () => {
    expect(ofType(withInvoicePending(40), 'missing_document')?.severity).toBe('medium')
    expect(ofType(withInvoicePending(20), 'missing_document')?.severity).toBe('high')
    expect(ofType(withInvoicePending(80), 'missing_document')).toBeUndefined()
  })

  it('is not raised when the invoice and packing list are available, or without customs', () => {
    const shipment = {
      legs: multimodalLegs(40),
      destinationCountry: 'MX',
      documents: ALL_DOCUMENTS,
    }

    expect(ofType(shipment, 'missing_document')).toBeUndefined()
    expect(
      ofType({ ...withInvoicePending(40), destinationCountry: 'FR' }, 'missing_document'),
    ).toBeUndefined()
  })
})

describe('BR-EX-11 Most specific wins', () => {
  it('drops stale while a hold or customs incident explains the silence', () => {
    const detected = detect(customs([event('customs_submitted', 2, -72)]))

    expect(detected.map((exception) => exception.type)).toEqual(['customs_incident', 'stale'])
    expect(mostSpecificWins(detected).map((exception) => exception.type)).toEqual([
      'customs_incident',
    ])
  })
})

describe('BR-EX-07 Delivered shipments', () => {
  it('have no exceptions left', () => {
    const delivered = [event('departed_site', 1, -30), event('delivered', 1, -1)]

    expect(detect({ events: delivered, plannedEta: at(-20) })).toEqual([])
  })
})
