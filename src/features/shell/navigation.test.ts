import { describe, expect, it } from 'vitest'
import { initialsOf } from './initials'
import { activeHref, hasCounter, navigation } from './navigation'

describe('UI-05 menu per role', () => {
  it('customers get Arrivals and Alerts; both ops roles get the console', () => {
    expect(navigation.customer.map((item) => item.label)).toEqual(['Arrivals', 'Alerts'])
    expect(navigation.ops_agent.map((item) => item.label)).toEqual(['Attention', 'Shipments'])
    expect(navigation.ops_manager).toEqual(navigation.ops_agent)
  })

  it('counters belong to the role that can read them', () => {
    expect(hasCounter(navigation.customer, 'unreadAlerts')).toBe(true)
    expect(hasCounter(navigation.customer, 'activeExceptions')).toBe(false)
    expect(hasCounter(navigation.ops_agent, 'activeExceptions')).toBe(true)
  })

  it('marks the most specific route as current', () => {
    expect(activeHref(navigation.ops_agent, '/ops')).toBe('/ops')
    expect(activeHref(navigation.ops_agent, '/ops/shipments/shp_001')).toBe('/ops/shipments')
    expect(activeHref(navigation.customer, '/portal/shipments/shp_001')).toBe('/portal')
    expect(activeHref(navigation.customer, '/profile')).toBeNull()
  })
})

describe('UI-04 avatar initials', () => {
  it('uses the first and last name', () => {
    expect(initialsOf('Laura Gómez')).toBe('LG')
    expect(initialsOf('Diego Hernández')).toBe('DH')
    expect(initialsOf('Elena')).toBe('E')
  })
})
