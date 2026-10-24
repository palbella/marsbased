import type { Clock } from '@/mocks/clock'
import type { RawEventRow } from '../raw-events'
import { eventBuilders, shipmentEvents } from './builders'
import { AURORA, MERIDIAN, VALENCIA, VERACRUZ } from './places'
import { NOW, routeEvents } from './route-events'

// Hours relative to now. Planned dates follow the template in legs/multimodal.ts.
export function multimodalAtSeaRawEvents(clock: Clock): RawEventRow[] {
  const { bws, bwsEta } = eventBuilders(clock)
  const { tirToPort, pldToPort, sailed, dailyPositions } = routeEvents(clock)
  return [
    // SH-10431: booked, no events yet → multimodal plan with customs.
    // SH-10432: sailed on time on BW Meridian, arrival in 9 days → on schedule.
    ...shipmentEvents('shp_014', [
      ...tirToPort(-144, 'Zaragoza'),
      ...sailed(-144, MERIDIAN),
      ...dailyPositions(-120, NOW, MERIDIAN),
    ]),
    // SH-10433: sailed on time, arrival in 6 days; no `LOAD` → "Not reported by operator"
    // (BR-MS-04).
    ...shipmentEvents('shp_015', [
      ...tirToPort(-216, 'Zaragoza'),
      bws('VD', -192, AURORA, VALENCIA),
      ...dailyPositions(-192, NOW, AURORA),
    ]),
    // SH-10436: BlueWave moves the arrival 30 h later, 2 h ago → late, `delay` high.
    ...shipmentEvents('shp_016', [
      ...pldToPort(-264),
      ...sailed(-264, AURORA),
      ...dailyPositions(-240, NOW, AURORA),
      bwsEta(126, -2, AURORA, VERACRUZ),
    ]),
    // SH-10438: on schedule, arrival in 40 h; the invoice is pending in documents.ts.
    ...shipmentEvents('shp_017', [
      ...pldToPort(-320),
      ...sailed(-320, AURORA),
      ...dailyPositions(-296, NOW, AURORA),
    ]),
  ]
}
