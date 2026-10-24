// 02 §5.5: a typed array with just the operations handlers need, no query language.
export class Table<Row extends { id: string }> {
  private rows: Row[] = []
  // Set by every write, so the database only persists when something changed.
  private dirty = false

  constructor(rows: Row[] = []) {
    this.rows = [...rows]
  }

  all(): Row[] {
    return [...this.rows]
  }

  findById(id: string): Row | undefined {
    return this.rows.find((row) => row.id === id)
  }

  where(predicate: (row: Row) => boolean): Row[] {
    return this.rows.filter(predicate)
  }

  insert(row: Row): Row {
    if (this.findById(row.id)) throw new Error(`Duplicate id "${row.id}"`)
    this.rows.push(row)
    this.dirty = true
    return row
  }

  update(id: string, patch: Partial<Omit<Row, 'id'>>): Row {
    const index = this.indexOf(id)
    const current = this.rows[index]
    if (current === undefined) throw new Error(`No row with id "${id}"`)
    // A new object, so rows handed out earlier are never mutated behind the caller's back.
    const updated = { ...current, ...patch }
    this.rows[index] = updated
    this.dirty = true
    return updated
  }

  remove(id: string): void {
    this.rows.splice(this.indexOf(id), 1)
    this.dirty = true
  }

  isDirty(): boolean {
    return this.dirty
  }

  markClean(): void {
    this.dirty = false
  }

  // Replaces every row with a snapshot or a reseed; a load is not a write.
  load(rows: Row[]): void {
    this.rows = [...rows]
    this.dirty = false
  }

  // Serialises as its rows, so a snapshot is plain JSON.
  toJSON(): Row[] {
    return this.rows
  }

  private indexOf(id: string): number {
    const index = this.rows.findIndex((row) => row.id === id)
    if (index === -1) throw new Error(`No row with id "${id}"`)
    return index
  }
}
