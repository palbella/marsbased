import { describe, expect, it } from 'vitest'
import { signInRequestSchema, signInResponseSchema } from './auth'
import { shipmentFiltersSchema } from './filters'
import { confirmMappingRequestSchema } from './mapping'
import { advanceClockRequestSchema } from './simulator'

const signInResponse = {
  token: 'tok_abc123',
  user: {
    id: 'usr_010',
    name: 'Marc Puig',
    email: 'marc.puig@corvane.test',
    role: 'ops_agent',
    perimeter: {
      kind: 'sites',
      sites: [
        { id: 'site_zgz', name: 'Zaragoza Plant' },
        { id: 'site_vlc', name: 'Valencia Warehouse' },
      ],
    },
  },
}

describe('auth schemas (US-00)', () => {
  it('parses a sign-in response with the user perimeter', () => {
    expect(signInResponseSchema.parse(signInResponse)).toEqual(signInResponse)
  })

  it('rejects a role outside BR-PM-03', () => {
    const user = { ...signInResponse.user, role: 'admin' }
    expect(signInResponseSchema.safeParse({ ...signInResponse, user }).success).toBe(false)
  })

  it('rejects a sign-in request with an invalid email', () => {
    const request = { email: 'marc.puig', password: 'Tracking2026!' }
    expect(signInRequestSchema.safeParse(request).success).toBe(false)
  })
})

describe('request schemas', () => {
  it('parses shipment filters from 02 §5.2', () => {
    const filters = { view: 'active', status: 'in_transit', onTime: 'late', scope: 'international' }
    expect(shipmentFiltersSchema.parse(filters)).toEqual(filters)
  })

  it('rejects an unknown shipment view', () => {
    expect(shipmentFiltersSchema.safeParse({ view: 'archived' }).success).toBe(false)
  })

  it('rejects a mapping to a target outside BR-NM-01', () => {
    const request = { operatorId: 'op_eur', rawCode: 'RET-PLAT', target: 'returned' }
    expect(confirmMappingRequestSchema.safeParse(request).success).toBe(false)
  })

  it('rejects moving the simulation clock backwards (OP-52)', () => {
    expect(advanceClockRequestSchema.safeParse({ hours: -2 }).success).toBe(false)
  })
})
