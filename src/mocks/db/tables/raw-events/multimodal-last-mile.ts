import type { Clock } from '@/mocks/clock'
import type { RawEventRow } from '../raw-events'
import { eventBuilders, shipmentEvents } from './builders'
import { AURORA, VERACRUZ } from './places'
import { routeEvents } from './route-events'

// Hours relative to now. Planned dates follow the template in legs/multimodal.ts.
export function multimodalLastMileRawEvents(clock: Clock): RawEventRow[] {
  const { bws, lmx } = eventBuilders(clock)
  const { tirToPort, pldToPort, sailed, dailyPositions } = routeEvents(clock)
  return [
    // SH-10450: cleared, out for delivery 2 h ago → out_for_delivery (SIM-04).
    ...shipmentEvents('shp_021', [
      ...pldToPort(-403),
      ...sailed(-403, AURORA),
      ...dailyPositions(-379, -43, AURORA),
      bws('VA', -43, AURORA, VERACRUZ),
      bws('CSUB', -42, AURORA, VERACRUZ),
      bws('DISC', -34, AURORA, VERACRUZ),
      bws('CREL', -20, AURORA, VERACRUZ),
      lmx('Collected at port', -8, 'Veracruz'),
      lmx('On delivery route', -2, 'Querétaro'),
    ]),
    // SH-10452: every milestone reported, delivered 3 days ago → complete timeline.
    ...shipmentEvents('shp_022', [
      ...tirToPort(-480, 'Zaragoza'),
      ...sailed(-480, AURORA),
      ...dailyPositions(-456, -121, AURORA),
      bws('VA', -121, AURORA, VERACRUZ),
      bws('CSUB', -119, AURORA, VERACRUZ),
      bws('DISC', -108, AURORA, VERACRUZ),
      bws('CREL', -97, AURORA, VERACRUZ),
      lmx('Collected at port', -86, 'Veracruz'),
      lmx('On delivery route', -78, 'Querétaro'),
      lmx('Delivered', -73, 'Querétaro'),
    ]),
  ]
}
