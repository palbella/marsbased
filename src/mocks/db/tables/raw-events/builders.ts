import type { MappingStatus } from '@/domain'
import type { Clock } from '@/mocks/clock'
import type { OperatorPayload, RawEventRow } from '../raw-events'
import { legId } from '../legs/leg-ids'

const MS_PER_MINUTE = 60 * 1000
const MS_PER_HOUR = 60 * MS_PER_MINUTE
// Operators transmit a few minutes after the fact.
const TRANSMISSION_DELAY_MINUTES = 5
// 07 §3: LastMile Express reports Mexico City local time (UTC−6, no daylight saving).
const MEXICO_CITY_UTC_OFFSET_HOURS = -6

// Each operator runs one leg of a route: the first mile (TIR, PLD) or a single road leg
// (TIR, EUR) is leg 1, the sea leg 2 and the last mile 3 (07 §4).
const LEG_SEQUENCE_BY_OPERATOR: Record<string, number> = {
  op_tir: 1,
  op_eur: 1,
  op_pld: 1,
  op_bws: 2,
  op_lmx: 3,
}

export interface EventDraft {
  operatorId: string
  payload: OperatorPayload
  receivedAt: string
  mappingStatus: MappingStatus
}

// Builders take hours relative to now (negative = past) and write each operator's own
// format (07 §3). Operator clocks report whole minutes.
export function eventBuilders(clock: Clock) {
  const at = (hours: number) => new Date(clock.hoursFromNow(hours)).setUTCSeconds(0, 0)
  const draft = (operatorId: string, payload: OperatorPayload, sentAt: number): EventDraft => ({
    operatorId,
    payload,
    receivedAt: new Date(sentAt + TRANSMISSION_DELAY_MINUTES * MS_PER_MINUTE).toISOString(),
    mappingStatus: 'mapped',
  })

  return {
    tir: (code: string, hours: number, location: string) =>
      draft('op_tir', { code, ts: toIso(at(hours)), location, eta: null }, at(hours)),
    // Code 700: `eta` is the new arrival.
    tirEta: (etaHours: number, sentHours: number, location: string) =>
      draft(
        'op_tir',
        { code: '700', ts: toIso(at(sentHours)), location, eta: toIso(at(etaHours)) },
        at(sentHours),
      ),
    eur: (code: string, hours: number, place: string) =>
      draft('op_eur', toCsv(code, at(hours), place), at(hours)),
    // `NEWETA`: date and time are the new ETA, so only the reception tells when it was sent.
    eurEta: (etaHours: number, sentHours: number, place: string) =>
      draft('op_eur', toCsv('NEWETA', at(etaHours), place), at(sentHours)),
    pld: (status: string, hours: number, terminal: string) =>
      draft('op_pld', { status, time: toIso(at(hours)), terminal }, at(hours)),
    bws: (eventCode: string, hours: number, vessel: string, port: string) =>
      draft('op_bws', bwsPayload(eventCode, false, vessel, port, at(hours)), at(hours)),
    // `ETA`: an estimate whose `eventDateTime` is the new vessel arrival.
    bwsEta: (arrivalHours: number, sentHours: number, vessel: string, port: string) =>
      draft('op_bws', bwsPayload('ETA', true, vessel, port, at(arrivalHours)), at(sentHours)),
    lmx: (status: string, hours: number, city: string) =>
      draft('op_lmx', { status, date: toMexicoCityLocal(at(hours)), city }, at(hours)),
  }
}

// BR-NM-03: seeded unmapped on purpose (07 §3, `RET-PLAT`).
export function unmapped(draft: EventDraft): EventDraft {
  return { ...draft, mappingStatus: 'unmapped' }
}

// `evt_015_03` is the third raw event of `shp_015`.
export function shipmentEvents(shipmentId: string, drafts: EventDraft[]): RawEventRow[] {
  const shipmentNumber = shipmentId.replace('shp_', '')
  return drafts.map((draft, index) => ({
    id: `evt_${shipmentNumber}_${String(index + 1).padStart(2, '0')}`,
    legId: legId(shipmentId, LEG_SEQUENCE_BY_OPERATOR[draft.operatorId] ?? 1),
    ...draft,
  }))
}

function bwsPayload(
  eventCode: string,
  isEstimate: boolean,
  vessel: string,
  port: string,
  time: number,
) {
  return { eventCode, isEstimate, vessel, port, eventDateTime: toIso(time) }
}

// "2026-11-10T08:15:00Z", as in the operator examples.
function toIso(time: number): string {
  return new Date(time).toISOString().replace('.000Z', 'Z')
}

// "DP;2026-11-10;08:15;BARCELONA".
function toCsv(code: string, time: number, place: string): string {
  const iso = toIso(time)
  return `${code};${iso.slice(0, 10)};${iso.slice(11, 16)};${place}`
}

// "10/11/2026 09:30".
function toMexicoCityLocal(time: number): string {
  const local = new Date(time + MEXICO_CITY_UTC_OFFSET_HOURS * MS_PER_HOUR)
  const pad = (value: number) => String(value).padStart(2, '0')
  const date = `${pad(local.getUTCDate())}/${pad(local.getUTCMonth() + 1)}/${local.getUTCFullYear()}`
  return `${date} ${pad(local.getUTCHours())}:${pad(local.getUTCMinutes())}`
}
