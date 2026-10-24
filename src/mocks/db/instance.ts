import { createSharedDatabase } from './database'
import { createBrowserStorage, createMemoryStorage } from './storage'

// The database the handlers act on: one per tab in the browser, shared through the
// `localStorage` snapshot (02 §5.5); one per test process in Node.
const storage = typeof window === 'undefined' ? createMemoryStorage() : createBrowserStorage()

export const { clock, database } = createSharedDatabase(storage)
