import type { Clock } from '@/mocks/clock'
import type { RawEventRow } from '../raw-events'
import { eventBuilders, shipmentEvents, unmapped } from './builders'

// Hours relative to now. Planned dates are in legs/road.ts.
export function euRawEvents(clock: Clock): RawEventRow[] {
  const { tir, eur, eurEta } = eventBuilders(clock)
  return [
    // SH-10411: back to the platform (`RET-PLAT`, unmapped), then a new ETA 30 h after the
    // committed date → late, `delay` high.
    ...shipmentEvents('shp_010', [
      eur('PU', -7, 'ZARAGOZA'),
      eur('DP', -5, 'ZARAGOZA'),
      unmapped(eur('RET-PLAT', -4, 'ZARAGOZA')),
      eurEta(40, -3, 'ZARAGOZA'),
    ]),
    // SH-10412: delivered 3 days ago, on time.
    ...shipmentEvents('shp_011', [
      tir('100', -82, 'Bilbao'),
      tir('200', -80, 'Bilbao'),
      tir('400', -77, 'Bordeaux'),
      tir('500', -72.5, 'Bordeaux'),
    ]),
    // SH-10421: departed on time 11 h ago; stale after 12 h of silence (SIM-03 at +2 h).
    ...shipmentEvents('shp_012', [eur('PU', -13, 'BARCELONA'), eur('DP', -11, 'BARCELONA')]),
  ]
}
