import { describe, expect, it } from 'vitest'
import { homeFor, resolveNextPath, signInPathFor } from './session-routes'

describe('03 §2 role homes', () => {
  it('customers land on the portal, ops users on the console', () => {
    expect(homeFor('customer')).toBe('/portal')
    expect(homeFor('ops_agent')).toBe('/ops')
    expect(homeFor('ops_manager')).toBe('/ops')
  })
})

describe('UI-09 sign-in redirects', () => {
  it('an unauthenticated visit keeps the requested path in `next`', () => {
    expect(signInPathFor('no-session', '/ops/shipments')).toBe('/sign-in?next=%2Fops%2Fshipments')
  })

  it('an expired session carries the reason; a sign-out goes to plain sign-in', () => {
    expect(signInPathFor('expired', '/ops')).toBe('/sign-in?reason=expired')
    expect(signInPathFor('signed-out', '/ops')).toBe('/sign-in')
  })
})

describe('UI-06 next redirect', () => {
  it('honours a path in the role area or the profile, with its query', () => {
    expect(resolveNextPath('/ops/shipments?status=late', 'ops_agent')).toBe(
      '/ops/shipments?status=late',
    )
    expect(resolveNextPath('/portal', 'customer')).toBe('/portal')
    expect(resolveNextPath('/profile', 'customer')).toBe('/profile')
  })

  it("sends the other role's area to the user's own home", () => {
    expect(resolveNextPath('/ops', 'customer')).toBe('/portal')
    expect(resolveNextPath('/portal/alerts', 'ops_manager')).toBe('/ops')
  })

  it('goes home without `next` or with a look-alike prefix', () => {
    expect(resolveNextPath(null, 'customer')).toBe('/portal')
    expect(resolveNextPath('/portalx', 'customer')).toBe('/portal')
  })

  it('never redirects off the origin', () => {
    const attempts = [
      '//evil.test',
      'https://evil.test/portal',
      '/portal?u=https://x',
      '/\\evil.test',
    ]
    for (const next of attempts) expect(resolveNextPath(next, 'customer')).toBe('/portal')
  })
})
