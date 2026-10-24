# 07 — Seed Data & Scenarios

Synthetic data for Phase 1 (NFR-02). No real or personal data: companies, people and
addresses are invented; e-mails use the reserved `.test` domain. Lives in
`src/mocks/db/tables/*` (architecture §5.5).

Design goals:
- Every rule in [04-domain-logic.md](04-domain-logic.md) is visible in at least one shipment.
- Every test account opens on something meaningful.
- Every simulator scenario has a known starting state and expected outcome, which doubles as
  an acceptance test.

## 1. Seeding principles

- **SD-01 Relative dates.** All dates are offsets from "now" at seed time (`hoursAgo(5)`,
  `daysFromNow(3)`), see BR-TM-01.
- **SD-02 Facts only.** Seeds contain users, organisations, shipments, legs, raw events,
  mappings, documents and past actions. **Exceptions and alerts are not hand-written:**
  `createDatabase()` runs the engine over every shipment, which derives them with the
  timestamp of the event that triggered them. Alerts older than 24 h are created as read.
- **SD-03 Past actions are replayed** through the action rules (BR-AC-*), so their effects
  are consistent (e.g. `waitingOn: 'operator'`).
- **SD-04 Safe margins.** Apart from the scenario targets, no active shipment has its
  committed date, next planned milestone or staleness threshold within the next 3 h, so
  scenarios and small clock advances only change what they intend to.

## 2. Organisation

Manufacturer: **Corvane Industrial** (fictional).

### Sites

| ID | Name | Type | City |
|----|------|------|------|
| `site_zgz` | Zaragoza Plant | factory | Zaragoza, ES |
| `site_bio` | Bilbao Plant | factory | Bilbao, ES |
| `site_vlc` | Valencia Warehouse | warehouse | Valencia, ES (next to the port) |
| `site_bcn` | Barcelona Warehouse | warehouse | Barcelona, ES |

### Accounts

| ID | Name | Type | Country | Tier |
|----|------|------|---------|------|
| `acc_001` | Alba Retail S.L. | customer | ES | key |
| `acc_002` | Nexo Construcciones S.A. | customer | ES | standard |
| `acc_003` | Talleres Ruiz S.L. | customer | ES | standard |
| `acc_004` | Durand Équipements SARL | customer | FR | standard |
| `acc_005` | Corvane México S.A. de C.V. | subsidiary | MX | key |

All content (UI, alerts, AI outputs, operator messages) is in English (A-4).

### Users

All seeded users share the non-production password `Tracking2026!` (`MOCK_USER_PASSWORD`).

| ID | Name | E-mail | Role | Perimeter |
|----|------|--------|------|-----------|
| `usr_001` | Laura Gómez | laura.gomez@albaretail.test | customer | Alba Retail |
| `usr_002` | Jordi Serra | jordi.serra@nexo.test | customer | Nexo Construcciones |
| `usr_003` | Ana Ruiz | ana.ruiz@talleresruiz.test | customer | Talleres Ruiz |
| `usr_004` | Camille Durand | camille.durand@durand.test | customer | Durand Équipements |
| `usr_005` | Diego Hernández | diego.hernandez@corvane-mx.test | customer | Corvane México (subsidiary) |
| `usr_010` | Marc Puig | marc.puig@corvane.test | ops_agent | Zaragoza Plant, Valencia Warehouse |
| `usr_011` | Núria Vidal | nuria.vidal@corvane.test | ops_agent | Bilbao Plant, Barcelona Warehouse |
| `usr_020` | Elena Martín | elena.martin@corvane.test | ops_manager | All sites |

The sign-in test accounts hint (03 UI-07) lists them in this order.

## 3. Operators and raw formats

| ID | Name | Mode | Format | Delay factor |
|----|------|------|--------|--------------|
| `op_tir` | Trans-Iberia Road | road | `tir-json` | 1.05 |
| `op_eur` | EuroRoad Freight | road | `eur-csv` | 1.10 |
| `op_pld` | PortLink Drayage | road (port) | `pld-json` | 1.05 |
| `op_bws` | BlueWave Shipping Line | sea | `bws-edi` | 1.02 (*BW Aurora*) · 1.15 (*BW Meridian*) |
| `op_lmx` | LastMile Express MX | road (last mile, MX) | `lmx-text` | 1.20 |

`delayFactor` is the historical ratio actual/planned duration used by BR-AI-05. SH-10432
sails on *BW Meridian*; every other sea shipment on *BW Aurora*. For a vessel with no
history, BlueWave's default factor is 1.05.

### Payload examples and mappings (`statusMappings` seed)

**`tir-json`** — numeric status codes:
`{ "code": "200", "ts": "2026-11-10T08:15:00Z", "location": "Zaragoza", "eta": null }`

| Code | Target |
|------|--------|
| `100` | `picked_up` |
| `200` | `departed_site` |
| `300` | `arrived_port` |
| `400` | `out_for_delivery` |
| `500` | `delivered` |
| `700` | `eta_update` (uses `eta`) |
| `900` | `position_update` |

**`eur-csv`** — `"DP;2026-11-10;08:15;BARCELONA"` (code; date; time in UTC; place)

| Code | Target |
|------|--------|
| `PU` | `picked_up` |
| `DP` | `departed_site` |
| `OFD` | `out_for_delivery` |
| `POD` | `delivered` |
| `PING` | `position_update` |
| `NEWETA` | `eta_update` (date and time are the new ETA) |
| `RET-PLAT` | *unmapped* (seeded on purpose, US-O-05) |

**`pld-json`** — `{ "status": "GATE_IN", "time": "2026-11-10T08:15:00Z", "terminal": "ESVLC-T2" }`

| Status | Target |
|--------|--------|
| `PICKUP` | `picked_up` |
| `DEPART` | `departed_site` |
| `GATE_IN` | `arrived_port` |

**`bws-edi`** — `{ "eventCode": "VD", "isEstimate": false, "vessel": "BW Aurora", "port": "ESVLC", "eventDateTime": "2026-11-10T08:15:00Z" }`

| Code | Target |
|------|--------|
| `LOAD` | `loaded_on_vessel` |
| `VD` | `vessel_departed` |
| `VA` | `vessel_arrived` |
| `DISC` | `discharged` |
| `ETA` | `eta_update` (`isEstimate: true`, `eventDateTime` is the new arrival) |
| `CSUB` | `customs_submitted` |
| `CHLD` | `customs_hold` |
| `CREL` | `customs_cleared` |
| `POS` | `position_update` (daily AIS position report while at sea; `port` is the next port of call) |

**`lmx-text`** — free-text statuses and a local date format (`DD/MM/YYYY HH:mm`, Mexico
City time); the code is the status text, trimmed, compared exactly (case-sensitive):
`{ "status": "On delivery route", "date": "10/11/2026 09:30", "city": "Querétaro" }`

| Text | Target |
|------|--------|
| "Collected at port" | `picked_up` |
| "On delivery route" | `out_for_delivery` |
| "Delivered" | `delivered` |

### AI-4 synonyms (excerpt)

`delivered`: "delivered", "handed to recipient", "handed to customer", "proof of delivery",
"pod". `out_for_delivery`: "out for delivery", "on delivery route", "with courier".
`customs_hold`: "customs hold", "held by customs". The full list lives in
`mocks/ai/synonyms.ts`.

## 4. Shipments

Routes: **domestic and EU** are a single road leg. **Multimodal to Mexico** is: road to
Valencia port (`op_tir` from Zaragoza or Bilbao, `op_pld` from Valencia Warehouse) → sea
Valencia → Veracruz (`op_bws`, vessels *BW Aurora* and *BW Meridian*) → customs → last mile
Veracruz → Querétaro (`op_lmx`).

"Arrival in N days" for sea shipments means the vessel reaching Veracruz (`vessel_arrived`).
Planned leg windows include loading and unloading slots, so some road legs are longer than
the distance alone suggests; this also keeps SD-04 margins.

| Ref | Account | Origin | Destination | Operators | State at seed (relative to now) | Shows |
|-----|---------|--------|-------------|-----------|----------------------------------|-------|
| SH-10401 | Alba | Zaragoza | Madrid | TIR | In transit, departed 3 h ago, ETA in 10 h | on time; **SIM-05** |
| SH-10402 | Alba | Barcelona | Sevilla | EUR | Out for delivery since 1 h ago; EuroRoad `NEWETA` sets ETA in 4 h | on time |
| SH-10403 | Alba | Bilbao | Valencia | TIR | Delivered yesterday, on time | delivered + POD |
| SH-10404 | Alba | Zaragoza | Málaga | EUR | In transit, departed 5 h late | `at_risk` (+5 h) |
| SH-10405 | Nexo | Valencia | Madrid | TIR | Delivered 2 days ago, 4 h late | delivered late |
| SH-10406 | Nexo | Bilbao | Barcelona | EUR | In transit, last event 15 h ago | `stale` |
| SH-10407 | Nexo | Zaragoza | Bilbao | TIR | Booked, pickup tomorrow | `booked`, planned-only timeline |
| SH-10408 | Talleres Ruiz | Barcelona | Zaragoza | EUR | In transit, last event `RET-PLAT` 3 h ago | unmapped status |
| SH-10409 | Talleres Ruiz | Valencia | Murcia | TIR | In transit, ETA update +16 h | `delay` medium, `late` |
| SH-10411 | Durand | Zaragoza | Toulouse, FR | EUR | In transit, `NEWETA` +30 h, also a `RET-PLAT` event | `delay` high, EU without customs |
| SH-10412 | Durand | Bilbao | Bordeaux, FR | TIR | Delivered 3 days ago | delivered |
| SH-10421 | Durand | Barcelona | Lyon, FR | EUR | In transit, last event 11 h ago, ETA in 20 h | on time; **SIM-03** |
| SH-10431 | Corvane MX | Bilbao | Querétaro, MX | TIR · BWS · LMX | Booked, pickup in 5 days | multimodal plan with customs |
| SH-10432 | Corvane MX | Zaragoza | Querétaro, MX | TIR · BWS · LMX | At sea, on schedule, arrival in 9 days | AI predicts `at_risk` (BR-AI-05) |
| SH-10433 | Corvane MX | Zaragoza | Querétaro, MX | TIR · BWS · LMX | At sea, on schedule, arrival in 6 days | on time; **SIM-01** |
| SH-10436 | Corvane MX | Valencia | Querétaro, MX | PLD · BWS · LMX | At sea, BWS `ETA` +30 h, 2 h ago | `delay` high, customer not messaged |
| SH-10438 | Corvane MX | Valencia | Querétaro, MX | PLD · BWS · LMX | At sea, arrival in 40 h, commercial invoice pending | `missing_document` medium |
| SH-10441 | Corvane MX | Valencia | Querétaro, MX | PLD · BWS · LMX | `CHLD` 5 h ago, customs declaration pending | `hold` high, upload suggested |
| SH-10444 | Corvane MX | Zaragoza | Querétaro, MX | TIR · BWS · LMX | `CSUB` 72 h ago, no clearance (incident raised 24 h ago); operator contacted 20 h ago; committed date in 3 days | `customs_incident`, waiting on operator (no `stale`, BR-EX-11); on-time `unknown` (ETA outdated, BR-ETA-05) |
| SH-10447 | Corvane MX | Valencia | Querétaro, MX | PLD · BWS · LMX | `CSUB` 6 h ago | `in_customs`; **SIM-02** |
| SH-10450 | Corvane MX | Valencia | Querétaro, MX | PLD · BWS · LMX | Last mile, out for delivery 2 h ago | **SIM-04** |
| SH-10452 | Corvane MX | Zaragoza | Querétaro, MX | TIR · BWS · LMX | Delivered 3 days ago | complete multimodal timeline |

Every shipment has a tracking number per leg (`TIR-…`, `EUR-…`, `PLD-…`, `BWS-BL-…`,
`LMX-…`) and the raw events needed to reach its state, with realistic gaps (e.g. SH-10433
has no `LOAD` event, so that milestone shows "Not reported by operator", BR-MS-04).
Every voyage, finished or not, has one BlueWave `POS` event per day at sea, so no shipment
is or was stale by silence alone (BR-SL-01).

### Documents

Per BR-NA-03. Required documents become `available` when this milestone is done:

| Document | Available from |
|----------|----------------|
| CMR (road shipments) | `picked_up` |
| Commercial invoice, packing list (sea shipments) | booking, dated 48 h before pickup |
| Bill of lading | `vessel_departed` |
| Customs declaration | `customs_submitted` |
| Proof of delivery | `delivered` |

Multimodal shipments are sea shipments for document purposes: no CMR. Exceptions:
- SH-10438: commercial invoice `pending`.
- SH-10441: customs declaration `pending` (`CSUB` came before `CHLD`, so it is required and
  upload is suggested).
- Booked shipments: everything `pending`.

Downloads return a generic sample PDF (`public/sample-document.pdf`) with the right file
name.

### Past actions (replayed, SD-03)

| When | User | Shipment | Action |
|------|------|----------|--------|
| 20 h ago | Marc Puig | SH-10444 | `contact_operator` BlueWave: "Please confirm customs status at Veracruz." |
| 2 days ago | Marc Puig | SH-10405 | `notify_customer` about the 4 h delay |

## 5. What each test account sees on sign-in

| User | Lands on | Highlights |
|------|----------|------------|
| Laura Gómez (Alba) | 4 shipments | 1 `at_risk` at the top, 1 out for delivery, recent delivery; unread `at_risk` alert |
| Jordi Serra (Nexo) | 3 shipments | stale shipment with banner, booked shipment, delivered late |
| Ana Ruiz (Talleres) | 2 shipments | 1 `late` with alert |
| Camille Durand (Durand) | 3 shipments | 1 `late` (+30 h), EU route without customs |
| Diego Hernández (Corvane MX) | 10 shipments | multimodal with customs: hold, customs incident, delay, AI-predicted risk; several unread alerts |
| Marc Puig (ops, ZGZ + VLC) | Attention queue | 1 SH-10441 hold (90) · 2 SH-10444 customs incident, waiting on operator (60) · 3 SH-10436 delay (60) · 4 SH-10411 delay (54) · 5 SH-10438 missing document (48) · 6 SH-10409 delay (24) |
| Núria Vidal (ops, BIO + BCN) | Attention queue | stale shipment; `RET-PLAT` unmapped (seen 2 times) in Status mappings |
| Elena Martín (ops manager) | Attention queue | everything above |

## 6. Simulator scenarios

Each scenario inserts raw events through the normal ingestion path (BR-NM-*), so it
exercises the same code as real operator events. Expected outcomes are acceptance tests.

| ID | Name | Action | Expected outcome |
|----|------|--------|------------------|
| SIM-01 | Vessel delay | `op_bws` `ETA` for SH-10433, arrival +36 h | ETA +36 h (`estimated`, source `system` from BlueWave, BR-ETA-03); `late`; `delay` high in the queue with primary *Notify customer*; one `late` alert for Corvane MX with the ETA change; AI summary and prediction updated |
| SIM-02 | Customs hold | `op_bws` `CHLD` for SH-10447 | Status `on_hold`; `hold` high with primary *Contact operator* (documents complete); `on_hold` alert for Corvane MX |
| SIM-03 | Operator goes silent | Clock +2 h | SH-10421 has no event for 13 h → `stale` medium for Núria and Elena; customer view shows the stale banner; no customer alert (BR-AL-02); nothing else changes (SD-04) |
| SIM-04 | Unknown status code | `op_lmx` "Parcel handed to recipient" for SH-10450 | Unmapped in Status mappings with suggestion `delivered` (~75%); timeline unchanged. On *Accept*: SH-10450 `delivered`, open exceptions resolved, `delivered` alert, POD `pending` |
| SIM-05 | Delivery | `op_tir` `500` for SH-10401 | `delivered` (`confirmed`), on time; `delivered` alert for Alba; POD `available` |

Reset (`POST /api/simulator/reset`) restores this exact state with a fresh "now".
