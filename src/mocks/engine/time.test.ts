import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'
import { addHours, hoursBetween } from './time'

const MOCKS_DIR = join(__dirname, '..')

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return sourceFiles(path)
    return /\.ts$/.test(name) && !/\.test\.ts$/.test(name) ? [path] : []
  })
}

describe('BR-TM-01 Time comes from the clock', () => {
  it('no mock module but clock.ts reads the real time', () => {
    const readers = sourceFiles(MOCKS_DIR)
      .filter((path) => /Date\.now\(|new Date\(\)/.test(readFileSync(path, 'utf8')))
      .map((path) => relative(MOCKS_DIR, path))

    expect(readers).toEqual(['clock.ts'])
  })
})

describe('BR-TM-02 ISO 8601 UTC', () => {
  it('engine dates are ISO 8601 UTC strings', () => {
    expect(addHours('2026-11-10T08:15:00+02:00', 1.5)).toBe('2026-11-10T07:45:00.000Z')
    expect(hoursBetween('2026-11-10T08:00:00Z', '2026-11-10T20:30:00.000Z')).toBe(12.5)
  })
})
