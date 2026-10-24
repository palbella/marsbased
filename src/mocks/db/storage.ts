// Where the database snapshot lives: `localStorage` in the browser, so every tab shares it
// (02 §5.5); memory in Node, which has no `localStorage`.
export interface SnapshotStorage {
  read(key: string): string | null
  write(key: string, value: string): void
}

export function createBrowserStorage(): SnapshotStorage {
  return {
    read: (key) => localStorage.getItem(key),
    write: (key, value) => localStorage.setItem(key, value),
  }
}

export function createMemoryStorage(): SnapshotStorage {
  const values = new Map<string, string>()
  return {
    read: (key) => values.get(key) ?? null,
    write: (key, value) => {
      values.set(key, value)
    },
  }
}
