# 04 — Domain Logic

Business rules behind every view. Satisfies the goals and stories in
[01-product-spec.md](01-product-spec.md); implemented in `src/mocks/{operators,engine,ai}`
(see [02-architecture.md](02-architecture.md) §5.4). In Phase 2 these rules move to the
backend unchanged.

Rule IDs (`BR-<area>-<n>`) are referenced by tasks and tests. Every rule is a pure function
of the stored facts and `now` (the simulation clock), so it is deterministic and testable.

```
raw event ─► normalise (§2) ─► milestones (§3) ─► status (§4) · ETA (§5) · on-time (§6) · staleness (§7)
          ─► exceptions (§8) ─► next action (§9) · priority (§11) ─► alerts (§12) ─► realtime (§15)
```

## 1. Time

- **BR-TM-01** All rules receive `now` from `mocks/clock.ts`; nothing reads `Date.now()`
  directly. The clock is real time plus an offset that the simulator can advance.
- **BR-TM-02** All timestamps are stored and exchanged as ISO 8601 UTC. The UI formats them
  in the viewer's local time zone, with relative hints ("in 2 days", "3 h ago").

## 2. Normalisation of operator events

Each operator reports in its own format (see [07-seed-data.md](07-seed-data.md) §3). Every
format has a parser `(rawEvent) => { code, label, occurredAt, isEstimate, location?, eta? }`
that receives the whole raw event (payload + `receivedAt`), then goes through the same
mapping. For `eta_update` events the payload date is the **new ETA**, so `occurredAt` is
the event's `receivedAt`.

- **BR-NM-01 Mapping.** The pair `(operatorId, code)` is looked up in `statusMappings`. A
  mapping targets one of:
  - a `MilestoneType` (§3), e.g. `BWS:VD → vessel_departed`;
  - `eta_update`: the operator sends a new expected arrival for its leg;
  - `position_update`: a heartbeat (GPS ping, scan) with no milestone; it only refreshes
    `lastEventAt`;
  - `ignore`: informational codes with no tracking meaning.
- **BR-NM-02 Provenance.** An event that reports something that happened fills the
  milestone's `actual` with provenance `confirmed`. An event flagged as an estimate, or an
  `eta_update`, produces a value with provenance `estimated`, sourced to that operator.
- **BR-NM-03 Unmapped events.** If no mapping exists, the event is stored as `unmapped`. It
  does not change the timeline, status or ETA, but it does refresh `lastEventAt`. It shows
  up in Status mappings (US-O-05). When a mapping is confirmed, every unmapped event with
  that `(operatorId, code)` is reprocessed, including past ones.
- **BR-NM-04 Duplicates and order.** An event with the same operator, leg, code and
  `occurredAt` as an existing one is ignored. Events are applied in `occurredAt` order, not
  in order of arrival; a late event can fill an earlier milestone.
- **BR-NM-05 Traceability.** Every milestone value keeps the `rawEventId` it came from, so
  ops can see the original operator message next to it (US-O-04, P1).
- **BR-NM-06 Out-of-plan events.** A mapped event whose milestone is not in its leg's plan
  (BR-MS-01) is kept as a raw event but does not change the timeline.

## 3. Milestone plan

- **BR-MS-01 Plan per leg.** When a shipment is ingested, its milestones are generated from
  the legs:

  | Leg kind | Milestones |
  |----------|-----------|
  | Road, only leg (domestic / EU) | `picked_up`, `departed_site`, `out_for_delivery`, `delivered` |
  | Road, site → port (first leg) | `picked_up`, `departed_site`, `arrived_port` |
  | Sea | `loaded_on_vessel`, `vessel_departed`, `vessel_arrived`, `discharged` |
  | Customs (destination, see BR-MS-02) | `customs_submitted`, `customs_cleared` |
  | Road, port → destination (last mile) | `picked_up`, `out_for_delivery`, `delivered` |

- **BR-MS-02 Customs.** Customs milestones are added when the destination country is
  outside the EU customs union. They sit between `discharged` and the last-mile leg.
  Intra-EU shipments (e.g. Spain → France) are international but have no customs.
- **BR-MS-03 Planned dates.** Each leg has `plannedDeparture` and `plannedArrival` (from the
  booking). Planned dates per milestone:

  | Milestone | Planned at |
  |-----------|-----------|
  | `picked_up` | leg departure − 2 h |
  | `departed_site`, `vessel_departed` | leg departure |
  | `loaded_on_vessel` | leg departure − 12 h |
  | `arrived_port`, `vessel_arrived` | leg arrival |
  | `discharged` | sea leg arrival + 12 h |
  | `customs_submitted` | sea leg arrival |
  | `customs_cleared` | sea leg arrival + 24 h |
  | `out_for_delivery` | last leg arrival − 6 h |
  | `delivered` | last leg arrival |

  Planned dates have provenance `estimated`, source `booking`.
- **BR-MS-04 Milestone state.**
  - `done`: has an actual value.
  - `not_reported`: no actual value, but a later milestone is done. It is shown as passed,
    but labelled "Not reported by operator", never as confirmed.
  - `overdue`: no actual value, the planned date is more than 2 h in the past and no later
    milestone is done.
  - `pending`: anything else.
- **BR-MS-05 Customs hold.** A `customs_hold` event is shown as a timeline entry on the
  customs block. It is open until a later `customs_cleared` arrives.
- **BR-MS-06 Current leg.** The current leg is the leg of the latest done milestone. If that
  milestone is the last one of its leg, the current leg is the next one. Before any event,
  it is the first leg. The customs block counts as the tail of the sea leg (its events come
  from the sea operator), so the sea leg stays current until `customs_cleared`.

## 4. Shipment status

- **BR-ST-01** The status is derived from the latest done milestone (by plan order):

  | Latest done milestone | Status |
  |-----------------------|--------|
  | none | `booked` |
  | `picked_up`, `departed_site`, `vessel_departed` | `in_transit` |
  | `arrived_port`, `loaded_on_vessel`, `vessel_arrived`, `discharged`, `customs_cleared` | `at_port` |
  | `customs_submitted` | `in_customs` |
  | `out_for_delivery` | `out_for_delivery` |
  | `delivered` | `delivered` |

  The last-mile `picked_up` also maps to `in_transit`.
- **BR-ST-02** An open customs hold (BR-MS-05) overrides the status to `on_hold`.

## 5. ETA

The ETA is the expected delivery date shown to users. It is chosen in this order, and the
first rule that applies wins:

- **BR-ETA-01 Delivered.** The actual delivery date, `confirmed`.
- **BR-ETA-02 Operator estimate, last leg.** The latest `eta_update` from the last leg's
  operator: `estimated`, source that operator.
- **BR-ETA-03 Operator estimate, earlier leg.** If an earlier leg's operator sent an
  `eta_update` for its own arrival, the difference with that leg's planned arrival is
  carried forward: `ETA = plannedEta + (newLegArrival − plannedLegArrival)`. `estimated`,
  source `system`, and the evidence names the operator update it comes from. It applies
  only until that leg's arrival milestone is done; after that, BR-ETA-04 takes over.
- **BR-ETA-04 System estimate.** `delay = max(0, actual − planned)` of the latest done
  milestone; `ETA = plannedEta + delay`. `estimated`, source `system`. Before any event,
  `ETA = plannedEta`, source `booking`, observed at the booking time (first-leg departure
  − 48 h, see 07 §4 "Documents").
- **BR-ETA-05 Unknown.** If the shipment is stale beyond twice its interval (BR-SL-02), the
  ETA is still returned with its provenance, but it is flagged `outdated: true` and the
  on-time indicator becomes `unknown` (BR-OT-01). No rule ever produces a date without a
  source.
- **BR-ETA-06 Predicted ETA.** The AI prediction (BR-AI-05) is returned separately as
  `predictedEta`. It never replaces the ETA.

`plannedEta` is the delivery date committed to the customer at booking time.

## 6. On-time indicator

- **BR-OT-01** With `delta = ETA − plannedEta`:

  | Indicator | Condition (first match wins) |
  |-----------|------------------------------|
  | `late` | `now > plannedEta` and not delivered (a fact, independent of data freshness) |
  | `unknown` | ETA flagged outdated (BR-ETA-05) |
  | `late` | `delta > 12 h` |
  | `at_risk` | `2 h < delta ≤ 12 h`, or the AI predicts `predictedEta − plannedEta > 12 h` with confidence ≥ 0.6 |
  | `on_time` | otherwise |

- **BR-OT-02 Delivered shipments** are `on_time` if delivered at most 2 h after
  `plannedEta`, and `late` otherwise.
- **BR-OT-03 Attention-first sort** (customer list, US-C-01): `late` → `at_risk` →
  `on_hold` status → `unknown` → `on_time`, then by ETA ascending.

## 7. Staleness

- **BR-SL-01** The expected update interval depends on the current leg: road 12 h, sea 48 h.
  While in customs (`in_customs`, `on_hold`) it is 24 h.
- **BR-SL-02** A shipment is **stale** when `now − lastEventAt` exceeds its interval, and
  **very stale** beyond twice the interval. Delivered shipments are never stale.
  `lastEventAt` counts every event, including `position_update` and unmapped ones.

## 8. Exceptions

- **BR-EX-01 Delay.** Raised when the on-time indicator is `late`. Severity `medium` if
  `delta ≤ 24 h`, `high` otherwise.
- **BR-EX-02 Hold.** Raised while a customs hold is open (BR-MS-05). Severity `high`.
- **BR-EX-03 Customs incident.** Raised when `customs_submitted` is done, there is no
  `customs_cleared` 48 h later, and there is no open hold (which would be BR-EX-02).
  Severity `high`.
- **BR-EX-04 Stale.** Raised when the shipment is stale (BR-SL-02). Severity `medium`,
  `high` if very stale.
- **BR-EX-05 Missing document.** Raised for shipments with customs (BR-MS-02) when the
  planned `customs_submitted` is less than 72 h away or already past, and the commercial
  invoice or the packing list is not `available`. Severity `medium`, `high` under 24 h.
- **BR-EX-06 One open exception per shipment and type.** The engine upserts by
  `(shipmentId, type)`. If one is open or acknowledged, it updates its severity instead of
  creating another.
- **BR-EX-07 Auto-resolution.** When the condition no longer holds, the exception is
  resolved automatically, with an activity entry "Resolved automatically: <reason>". When a
  shipment is delivered, all its open exceptions are resolved.
- **BR-EX-08 Manual resolution.** An agent can resolve an exception with a note even if the
  condition still holds. The engine does not reopen that type for that shipment unless the
  severity increases or a new triggering event arrives after the resolution.
- **BR-EX-09 Lifecycle.** `open` → `acknowledged` → `resolved`. An exception can also carry
  `waitingOn: 'operator'` after "contact operator" (BR-AC-02).
- **BR-EX-10 When the engine runs.** After every inserted raw event, document change or
  confirmed mapping (for the affected shipment), and for all shipments when the clock
  advances or the data is reset.
- **BR-EX-11 Most specific wins.** `stale` is not raised while a `hold` or
  `customs_incident` is open for the shipment: the silence is already explained by them.

## 9. Next action

- **BR-NA-01** Each exception carries an ordered list of suggested actions; the first one is
  the primary action shown in the queue.

  | Exception | Primary | Secondary |
  |-----------|---------|-----------|
  | `delay` | `notify_customer` if no ops message was sent for this exception, otherwise `contact_operator` | the other one |
  | `hold` | `upload_document` if a required document is missing, otherwise `contact_operator` | `notify_customer` |
  | `customs_incident` | `contact_operator` | `notify_customer` |
  | `stale` | `contact_operator` | `notify_customer` if very stale |
  | `missing_document` | `upload_document` | `contact_operator` |

- **BR-NA-02** `acknowledge` and `resolve` are always available besides the suggestions.
- **BR-NA-03** Required documents: road shipments need the CMR. Sea shipments need the bill of
  lading, commercial invoice and packing list, plus the customs declaration once customs
  is submitted. All shipments get a proof of delivery once delivered.

## 10. Actions

All actions go through `POST /api/exceptions/:id/actions`, are ops-only and are recorded in
`activity` with user and timestamp.

- **BR-AC-01 Notify customer.** `{ subject, message }`. Creates an alert of type `message`
  for the shipment's account (BR-AL-01) and sets the exception to `acknowledged`.
- **BR-AC-02 Contact operator.** `{ operatorId, message }`. Logged only (no real delivery in
  Phase 1). Sets `acknowledged` and `waitingOn: 'operator'`. A new event from that
  operator for the shipment clears `waitingOn`.
- **BR-AC-03 Upload document.** `{ type, fileName, size }`. Creates or updates the document
  as `available`, then runs the engine (BR-EX-10), which may auto-resolve
  `missing_document` or change the next action of a `hold`.
- **BR-AC-04 Acknowledge.** Sets `acknowledged` and assigns the exception to the user.
- **BR-AC-05 Resolve.** A note is required. Sets `resolved` (BR-EX-08).
- **BR-AC-06 Validation.** Invalid payloads answer `422`; actions on a resolved exception
  answer `409`.

## 11. Priority (AI-2)

- **BR-PR-01 Score.** `score = min(100, round(severity × impact × urgency × age × 10))`:

  | Factor | Values |
  |--------|--------|
  | severity | high 3 · medium 2 · low 1 |
  | impact | 1, +0.5 if the account is `key`, +0.5 if the shipment is international |
  | urgency | 1.5 if ETA is less than 24 h away or past · 1.2 under 72 h · 1.0 otherwise |
  | age | 1.2 if open more than 24 h without any action · 1.0 otherwise |

- **BR-PR-02 Order.** Score descending, then `detectedAt` ascending (the older exception
  first on a tie).
- **BR-PR-03 Explanation.** The AI rationale lists each factor with its value as evidence
  ("Key account", "International", "ETA in 18 h", "Open 30 h without action"), so the
  ranking is never a black box.

## 12. Customer alerts

- **BR-AL-01 Triggers.** Transitions are detected against the shipment's last evaluation
  (on-time indicator, ETA, status), stored in `shipmentEvaluations` after every
  recomputation; a shipment's first evaluation compares against `on_time` and
  `plannedEta`. Alerts are created for the shipment's account when:

  | Type | When |
  |------|------|
  | `at_risk` | on-time indicator goes from `on_time` to `at_risk` |
  | `late` | on-time indicator becomes `late` |
  | `eta_changed` | ETA moves more than 12 h from the ETA of the last alert sent for that shipment (or from `plannedEta`) |
  | `on_hold` | a hold is opened |
  | `customs_issue` | a customs incident is raised |
  | `delivered` | the shipment is delivered |
  | `message` | ops sends a message (BR-AC-01) |

- **BR-AL-02 Not for internal issues.** `stale` and `missing_document` never create
  automatic alerts: they are internal. Ops can still message the customer.
- **BR-AL-03 Content.** Each alert has a title, what happened, the ETA impact (old → new,
  with provenance) and `requiresAction` (true only for ops messages flagged as such).
- **BR-AL-04 Deduplication.** One alert per `(shipmentId, type, newValue)`. Repeated events
  with the same outcome create no new alerts. `newValue` is the new ETA for ETA-based
  alerts (`at_risk`, `late`, `eta_changed`), and the triggering raw event id for `on_hold`
  and `customs_issue`.
- **BR-AL-05 One alert per change.** If several triggers fire in the same recomputation,
  a single alert is created with the most important type
  (`on_hold` > `customs_issue` > `late` > `at_risk` > `eta_changed`), including the ETA
  impact.

## 13. Perimeter and permissions

- **BR-PM-01 Perimeter.** `customer`: `shipment.accountId = user.accountId`. `ops_agent`:
  `shipment.originSiteId ∈ userSites`. `ops_manager`: all shipments. Exceptions, alerts,
  documents, activity, raw events and AI outputs inherit the perimeter of their shipment.
- **BR-PM-02 Out of perimeter** answers `404`, never `403`, so it doesn't reveal whether the
  resource exists.
- **BR-PM-03 Role permissions.** Endpoints that the role can never use answer `403`:

  | Capability | customer | ops |
  |------------|:--------:|:---:|
  | Shipments list, detail, timeline, documents (read) | ✓ | ✓ |
  | Alerts | ✓ | — |
  | AI summary, predicted ETA | ✓ | ✓ |
  | Raw events, activity, exceptions, actions, document upload | — | ✓ |
  | AI priority, draft message, mapping suggestion, mappings | — | ✓ |
  | Reference data (sites, operators, accounts) for filters | — | ✓ |

- **BR-PM-04 Customer-safe timeline.** The timeline returned to customers carries no raw
  payloads, internal notes or operator contact data.
- **BR-PM-05 Mappings are operator configuration,** visible to every ops user. The
  affected shipments shown next to an unmapped status are limited to the user's perimeter.

## 14. AI features (Phase 1 mock logic)

All outputs use the `AiInsight` envelope (architecture §6.3), use only data present in the
shipment (P1) and set `model: 'mock-v1'`.

- **BR-AI-01 Shipment summary (AI-1).** One or two sentences built from: current position
  (milestone, leg, mode, location), timing against the committed date, ETA with its
  provenance ("estimated by BlueWave", "our estimate"), and the next milestone. If there is
  an open hold or incident, a customer-friendly explanation. Confidence 0.9, or 0.6 if stale.
  Evidence: the facts used.
  > "Your order is on board the vessel to Veracruz, about 1 day behind plan. Expected
  > delivery Thu 14 Nov (estimated by BlueWave). Next: arrival at Veracruz port."
- **BR-AI-02 Priority rationale (AI-2).** BR-PR-01..03. Confidence 0.85, minus 0.2 if the
  shipment is stale.
- **BR-AI-03 Drafted customer message (AI-3).** A template per exception type, in English,
  filled with reference, what happened, old → new ETA and
  what the customer needs to do, if anything. Formal tone. Always editable, never sent
  without the agent's confirmation. Confidence 0.8.
- **BR-AI-04 Mapping suggestion (AI-4).** Normalise the raw label (lowercase, strip accents
  and punctuation), compute token similarity (Jaccard) against a synonym list per
  milestone type, and return the top 3 with their score as
  confidence. If the best score is below 0.4, show "No confident suggestion" and let the
  agent choose.
- **BR-AI-05 Predicted ETA (AI-5).** For each remaining leg,
  `predicted delay += remainingPlannedHours × (delayFactor − 1)`, where
  `remainingPlannedHours` is `plannedArrival − max(now, plannedDeparture)` for the current
  leg and the full planned duration for later legs, and `delayFactor` is the
  operator's historical ratio of actual to planned duration, per vessel for sea legs when
  known (seed: [07-seed-data.md](07-seed-data.md) §3). `predictedEta = ETA + predicted delay`. Confidence `0.85 − 0.1 × remaining sea legs`,
  minus 0.1 if stale, minimum 0.4. If `|predictedEta − ETA| ≤ 2 h`, the UI shows "AI
  prediction agrees with the current ETA".

## 15. Realtime events

- **BR-RT-01** Every mutation publishes thin events (architecture §7):
  `shipment.updated`, `exception.changed`, `alert.created`, `document.changed`,
  `mapping.changed`, `data.reset`. Each carries only IDs.
- **BR-RT-02** Clients invalidate the queries for the IDs received (`data.reset`
  invalidates everything) and raise toasts from the refetched data, never from the event.
