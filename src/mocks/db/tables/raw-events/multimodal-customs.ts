import type { Clock } from '@/mocks/clock'
import type { RawEventRow } from '../raw-events'
import { eventBuilders, shipmentEvents } from './builders'
import { AURORA, VERACRUZ } from './places'
import { routeEvents } from './route-events'

// Hours relative to now. Planned dates follow the template in legs/multimodal.ts.
export function multimodalCustomsRawEvents(clock: Clock): RawEventRow[] {
  const { bws } = eventBuilders(clock)
  const { tirToPort, pldToPort, sailed, dailyPositions } = routeEvents(clock)
  return [
    // SH-10441: customs submitted on arrival, then held 5 h ago → on_hold, `hold` high.
    ...shipmentEvents('shp_018', [
      ...pldToPort(-390),
      ...sailed(-390, AURORA),
      ...dailyPositions(-366, -30, AURORA),
      bws('VA', -30, AURORA, VERACRUZ),
      bws('CSUB', -29, AURORA, VERACRUZ),
      bws('DISC', -20, AURORA, VERACRUZ),
      bws('CHLD', -5, AURORA, VERACRUZ),
    ]),
    // SH-10444: customs submitted 72 h ago, nothing since → `customs_incident` raised 24 h ago
    // (BR-EX-03), before the operator was contacted; very stale → on-time `unknown`.
    ...shipmentEvents('shp_019', [
      ...tirToPort(-433, 'Zaragoza'),
      ...sailed(-433, AURORA),
      ...dailyPositions(-409, -76, AURORA),
      bws('VA', -76, AURORA, VERACRUZ),
      bws('DISC', -74, AURORA, VERACRUZ),
      bws('CSUB', -72, AURORA, VERACRUZ),
    ]),
    // SH-10447: customs submitted 6 h ago → in_customs (SIM-02 adds the hold).
    ...shipmentEvents('shp_020', [
      ...pldToPort(-367),
      ...sailed(-367, AURORA),
      ...dailyPositions(-343, -10, AURORA),
      bws('VA', -10, AURORA, VERACRUZ),
      bws('DISC', -8, AURORA, VERACRUZ),
      bws('CSUB', -6, AURORA, VERACRUZ),
    ]),
  ]
}
