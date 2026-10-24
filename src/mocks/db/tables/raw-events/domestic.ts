import type { Clock } from '@/mocks/clock'
import type { RawEventRow } from '../raw-events'
import { eventBuilders, shipmentEvents, unmapped } from './builders'

type Builders = ReturnType<typeof eventBuilders>

// Hours relative to now. Planned dates are in legs/road.ts.
export function domesticRawEvents(clock: Clock): RawEventRow[] {
  const builders = eventBuilders(clock)
  return [...albaRawEvents(builders), ...nexoAndTalleresRawEvents(builders)]
}

function albaRawEvents({ tir, eur, eurEta }: Builders): RawEventRow[] {
  return [
    // SH-10401: departed on time 3 h ago → in transit, on time.
    ...shipmentEvents('shp_001', [tir('100', -5, 'Zaragoza'), tir('200', -3, 'Zaragoza')]),
    // SH-10402: out for delivery 1 h ago; the driver confirms arrival in 4 h → on time.
    ...shipmentEvents('shp_002', [
      eur('PU', -12, 'BARCELONA'),
      eur('DP', -10, 'BARCELONA'),
      eur('OFD', -1, 'SEVILLA'),
      eurEta(4, -0.5, 'SEVILLA'),
    ]),
    // SH-10403: delivered 30 min before the committed date, yesterday → delivered on time.
    ...shipmentEvents('shp_003', [
      tir('100', -34, 'Bilbao'),
      tir('200', -32, 'Bilbao'),
      tir('400', -29, 'Valencia'),
      tir('500', -24.5, 'Valencia'),
    ]),
    // SH-10404: picked up and departed 5 h late → at_risk (+5 h).
    ...shipmentEvents('shp_004', [eur('PU', -3, 'ZARAGOZA'), eur('DP', -1, 'ZARAGOZA')]),
  ]
}

function nexoAndTalleresRawEvents({ tir, tirEta, eur }: Builders): RawEventRow[] {
  return [
    // SH-10405: 4 h late from pickup to delivery, 47 h ago → delivered late.
    ...shipmentEvents('shp_005', [
      tir('100', -57, 'Valencia'),
      tir('200', -55, 'Valencia'),
      tir('400', -53, 'Madrid'),
      tir('500', -47, 'Madrid'),
    ]),
    // SH-10406: nothing since departing 15 h ago (road interval 12 h) → stale.
    ...shipmentEvents('shp_006', [eur('PU', -17, 'BILBAO'), eur('DP', -15, 'BILBAO')]),
    // SH-10407: booked, no events yet → planned-only timeline.
    // SH-10408: `RET-PLAT` 3 h ago is unmapped → timeline unchanged, still in transit.
    ...shipmentEvents('shp_008', [
      eur('PU', -6, 'BARCELONA'),
      eur('DP', -4, 'BARCELONA'),
      unmapped(eur('RET-PLAT', -3, 'BARCELONA')),
    ]),
    // SH-10409: TIR estimates arrival 16 h after the committed date → late, `delay` medium.
    ...shipmentEvents('shp_009', [
      tir('100', -6, 'Valencia'),
      tir('200', -4, 'Valencia'),
      tirEta(26, -2, 'Almansa'),
    ]),
  ]
}
