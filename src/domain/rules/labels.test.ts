import { describe, expect, it } from 'vitest'
import { perimeterFieldLabel, perimeterLabel } from './labels'

describe('UI-08 perimeter labels', () => {
  it('a customer sees their account name', () => {
    const perimeter = {
      kind: 'account' as const,
      account: { id: 'acc_001', name: 'Alba Retail S.L.', type: 'customer' as const },
    }
    expect(perimeterLabel(perimeter)).toBe('Alba Retail S.L.')
    expect(perimeterFieldLabel(perimeter)).toBe('Account')
  })

  it('an ops agent sees their sites', () => {
    const perimeter = {
      kind: 'sites' as const,
      sites: [
        { id: 'site_zgz', name: 'Zaragoza Plant' },
        { id: 'site_vlc', name: 'Valencia Warehouse' },
      ],
    }
    expect(perimeterLabel(perimeter)).toBe('Zaragoza Plant, Valencia Warehouse')
    expect(perimeterFieldLabel(perimeter)).toBe('Sites')
  })

  it('a manager sees "All sites"', () => {
    expect(perimeterLabel({ kind: 'all' })).toBe('All sites')
  })
})
