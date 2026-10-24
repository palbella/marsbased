import { Table } from './table'
import type { AccountRow } from './tables/accounts'
import type { ActivityRow } from './tables/activity'
import type { AlertRow } from './tables/alerts'
import type { DocumentRow } from './tables/documents'
import type { ExceptionRow } from './tables/exceptions'
import type { LegRow } from './tables/legs'
import type { OperatorRow } from './tables/operators'
import type { RawEventRow } from './tables/raw-events'
import type { SessionRow } from './tables/sessions'
import type { ShipmentRow } from './tables/shipments'
import type { SimulatorRow } from './tables/simulator'
import type { SiteRow } from './tables/sites'
import type { StatusMappingRow } from './tables/status-mappings'
import type { UserSiteRow } from './tables/user-sites'
import type { UserRow } from './tables/users'

// The row type of every table in 02 §5.5.
export interface RowTypes {
  users: UserRow
  sessions: SessionRow
  userSites: UserSiteRow
  accounts: AccountRow
  sites: SiteRow
  operators: OperatorRow
  shipments: ShipmentRow
  legs: LegRow
  rawEvents: RawEventRow
  statusMappings: StatusMappingRow
  exceptions: ExceptionRow
  activity: ActivityRow
  alerts: AlertRow
  documents: DocumentRow
  simulator: SimulatorRow
}

export type TableName = keyof RowTypes
export type TableRows = { [Name in TableName]: RowTypes[Name][] }
export type Tables = { [Name in TableName]: Table<RowTypes[Name]> }

// A record, so the compiler flags a table missing from the list.
const TABLE_NAME_SET: Record<TableName, true> = {
  users: true,
  sessions: true,
  userSites: true,
  accounts: true,
  sites: true,
  operators: true,
  shipments: true,
  legs: true,
  rawEvents: true,
  statusMappings: true,
  exceptions: true,
  activity: true,
  alerts: true,
  documents: true,
  simulator: true,
}
// Object.keys widens the keys to string.
export const TABLE_NAMES = Object.keys(TABLE_NAME_SET) as TableName[]

export function createTables(): Tables {
  return {
    users: new Table(),
    sessions: new Table(),
    userSites: new Table(),
    accounts: new Table(),
    sites: new Table(),
    operators: new Table(),
    shipments: new Table(),
    legs: new Table(),
    rawEvents: new Table(),
    statusMappings: new Table(),
    exceptions: new Table(),
    activity: new Table(),
    alerts: new Table(),
    documents: new Table(),
    simulator: new Table(),
  }
}

export function loadTables(tables: Tables, rows: TableRows): void {
  for (const name of TABLE_NAMES) loadTable(tables, rows, name)
}

function loadTable<Name extends TableName>(tables: Tables, rows: TableRows, name: Name): void {
  tables[name].load(rows[name])
}
