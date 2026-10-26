import { describe, expect, it } from 'vitest'
import { createClock } from '@/mocks/clock'
import { createDatabase, createSharedDatabase } from './database'
import { readSnapshot, SEED_MAX_AGE_HOURS, SNAPSHOT_KEY } from './snapshot'
import { createMemoryStorage, type SnapshotStorage } from './storage'

const REAL_TIME = Date.parse('2026-11-10T08:00:00.000Z')
const clock = createClock(
  () => 0,
  () => REAL_TIME,
)
const session = { id: 'token-123', userId: 'usr_001', createdAt: clock.hoursAgo(1) }

// Two tabs share one localStorage (02 §5.5 "Persistence and multiple tabs").
function twoTabs(storage: SnapshotStorage = createMemoryStorage()) {
  return { storage, tab1: createDatabase(clock, storage), tab2: createDatabase(clock, storage) }
}

describe('database persistence (02 §5.5)', () => {
  it('seeds once and lets the next tab load the same snapshot', () => {
    const { tab1, tab2 } = twoTabs()

    expect(tab1.revision()).toBe(1)
    expect(tab2.revision()).toBe(1)
    expect(tab2.shipments.all()).toEqual(tab1.shipments.all())
  })

  it('a write persisted in one tab is visible in the other after refresh()', () => {
    const { tab1, tab2 } = twoTabs()

    tab1.sessions.insert(session)
    tab1.persistIfChanged()
    tab2.refresh()

    expect(tab1.revision()).toBe(2)
    expect(tab2.revision()).toBe(2)
    expect(tab2.sessions.findById('token-123')).toEqual(session)
  })

  it('persistIfChanged() without writes does not bump the revision', () => {
    const { storage, tab1 } = twoTabs()
    const before = storage.read(SNAPSHOT_KEY)

    tab1.persistIfChanged()

    expect(tab1.revision()).toBe(1)
    expect(storage.read(SNAPSHOT_KEY)).toBe(before)
  })

  it('refresh() without a newer revision changes nothing', () => {
    const { tab1 } = twoTabs()
    tab1.sessions.insert(session)

    tab1.refresh()

    expect(tab1.sessions.findById('token-123')).toEqual(session)
    expect(tab1.revision()).toBe(1)
  })

  it('reset() restores the seeds, keeps sessions and bumps the revision', () => {
    const { tab1, tab2 } = twoTabs()
    const seededShipment = tab1.shipments.findById('shp_001')
    tab1.sessions.insert(session)
    tab1.shipments.update('shp_001', { destinationCity: 'Changed' })
    tab1.shipments.remove('shp_002')
    tab1.persistIfChanged()

    tab1.reset()
    tab2.refresh()

    expect(tab1.revision()).toBe(3)
    for (const tab of [tab1, tab2]) {
      expect(tab.shipments.all()).toHaveLength(22)
      expect(tab.shipments.findById('shp_001')).toEqual(seededShipment)
      expect(tab.sessions.all()).toEqual([session])
    }
  })

  it('reseeds when the snapshot is missing, corrupt or from an older version', () => {
    for (const stored of [null, '{not json', JSON.stringify({ version: 0, revision: 7 })]) {
      const storage = createMemoryStorage()
      if (stored !== null) storage.write(SNAPSHOT_KEY, stored)

      const db = createDatabase(clock, storage)

      expect(db.shipments.all()).toHaveLength(22)
      expect(db.revision()).toBe(1)
    }
  })

  it('BR-TM-01: tabs share the clock offset stored in the simulator row', () => {
    const storage = createMemoryStorage()
    const tab1 = createSharedDatabase(storage, () => REAL_TIME)
    const tab2 = createSharedDatabase(storage, () => REAL_TIME)

    tab1.database.simulator.update('sim_001', { clockOffsetHours: 2 })
    tab1.database.persistIfChanged()
    tab2.database.refresh()

    expect(tab2.clock.now().toISOString()).toBe('2026-11-10T10:00:00.000Z')

    tab2.database.reset()
    expect(tab2.clock.now().toISOString()).toBe('2026-11-10T08:00:00.000Z')
  })
})

describe('seeds do not age (SD-05)', () => {
  const HOUR_MS = 3_600_000

  // Tabs whose real time can be moved forward, as if the browser came back hours later.
  function agingTabs() {
    let realTime = REAL_TIME
    const storage = createMemoryStorage()
    const openTab = () => createSharedDatabase(storage, () => realTime).database
    const passHours = (hours: number) => {
      realTime += hours * HOUR_MS
    }
    const freshSeed = () => createSharedDatabase(createMemoryStorage(), () => realTime).database
    return { storage, openTab, passHours, freshSeed }
  }

  it(`SD-05: a snapshot seeded more than ${SEED_MAX_AGE_HOURS} h ago reseeds on load, keeping sessions`, () => {
    const { storage, openTab, passHours, freshSeed } = agingTabs()
    const first = openTab()
    first.sessions.insert(session)
    first.persistIfChanged()

    passHours(7)
    const later = openTab()
    const fresh = freshSeed()

    expect(later.revision()).toBe(3)
    expect(later.shipments.all()).toEqual(fresh.shipments.all())
    expect(later.alerts.all()).toEqual(fresh.alerts.all())
    expect(later.sessions.all()).toEqual([session])
    expect(readSnapshot(storage)?.seededAt).toBe(REAL_TIME + 7 * HOUR_MS)
  })

  it(`SD-05: a snapshot seeded less than ${SEED_MAX_AGE_HOURS} h ago is kept as is`, () => {
    const { openTab, passHours } = agingTabs()
    const first = openTab()
    first.shipments.update('shp_001', { destinationCity: 'Changed' })
    first.persistIfChanged()

    passHours(5)
    const later = openTab()

    expect(later.revision()).toBe(2)
    expect(later.shipments.all()).toEqual(first.shipments.all())
  })

  it('SD-05: a snapshot without a seed time reseeds, keeping sessions', () => {
    const { storage, openTab } = agingTabs()
    const first = openTab()
    first.sessions.insert(session)
    first.persistIfChanged()
    const legacy = { ...readSnapshot(storage), seededAt: undefined }
    storage.write(SNAPSHOT_KEY, JSON.stringify(legacy))

    const later = openTab()

    expect(later.revision()).toBe(3)
    expect(later.sessions.all()).toEqual([session])
  })

  it('SD-05: the age is real time, so advancing the simulation clock does not reseed', () => {
    const { openTab } = agingTabs()
    const tab = openTab()
    tab.simulator.update('sim_001', { clockOffsetHours: 24 })
    tab.persistIfChanged()

    tab.refresh()

    expect(tab.revision()).toBe(2)
    expect(tab.simulator.findById('sim_001')?.clockOffsetHours).toBe(24)
  })

  it('SD-05: two open tabs converge on the reseeded data after refresh()', () => {
    const { openTab, passHours, freshSeed } = agingTabs()
    const tab1 = openTab()
    const tab2 = openTab()
    tab1.sessions.insert(session)
    tab1.persistIfChanged()
    tab2.refresh()

    passHours(7)
    tab1.refresh()
    tab2.refresh()

    for (const tab of [tab1, tab2]) {
      expect(tab.revision()).toBe(3)
      expect(tab.shipments.all()).toEqual(freshSeed().shipments.all())
      expect(tab.sessions.all()).toEqual([session])
    }
  })
})
