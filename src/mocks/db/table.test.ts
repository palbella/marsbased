import { describe, expect, it } from 'vitest'
import { Table } from './table'

interface Row {
  id: string
  name: string
}

const createTable = () =>
  new Table<Row>([
    { id: 'row_001', name: 'first' },
    { id: 'row_002', name: 'second' },
  ])

describe('Table (02 §5.5)', () => {
  it('reads rows by id and by predicate', () => {
    const table = createTable()

    expect(table.all()).toHaveLength(2)
    expect(table.findById('row_002')?.name).toBe('second')
    expect(table.findById('row_404')).toBeUndefined()
    expect(table.where((row) => row.name.startsWith('f')).map((row) => row.id)).toEqual(['row_001'])
  })

  it('inserts, updates and removes rows', () => {
    const table = createTable()

    table.insert({ id: 'row_003', name: 'third' })
    table.update('row_001', { name: 'renamed' })
    table.remove('row_002')

    expect(table.all()).toEqual([
      { id: 'row_001', name: 'renamed' },
      { id: 'row_003', name: 'third' },
    ])
  })

  it('throws when updating or removing an id that does not exist', () => {
    const table = createTable()

    expect(() => table.update('row_404', { name: 'x' })).toThrow('row_404')
    expect(() => table.remove('row_404')).toThrow('row_404')
  })

  it('rejects a duplicate id', () => {
    expect(() => createTable().insert({ id: 'row_001', name: 'again' })).toThrow('row_001')
  })

  it('never mutates rows handed out earlier', () => {
    const table = createTable()
    const before = table.findById('row_001')

    table.update('row_001', { name: 'renamed' })

    expect(before?.name).toBe('first')
  })

  it('sets the dirty flag on every write, not on reads or loads', () => {
    const table = createTable()
    table.all()
    table.where(() => true)
    expect(table.isDirty()).toBe(false)

    for (const write of [
      () => table.insert({ id: 'row_009', name: 'new' }),
      () => table.update('row_001', { name: 'renamed' }),
      () => table.remove('row_009'),
    ]) {
      table.markClean()
      write()
      expect(table.isDirty()).toBe(true)
    }

    table.load([])
    expect(table.isDirty()).toBe(false)
  })
})
