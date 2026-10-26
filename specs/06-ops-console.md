# 06 — Operations Console & Simulator

Satisfies: US-O-01..05, AI-2, AI-3, AI-4, US-R-01 and US-R-02
([01-product-spec.md](01-product-spec.md)). Rules: [04-domain-logic.md](04-domain-logic.md).
Shared components: [05-customer-portal.md](05-customer-portal.md) §1.

Ops goal: *stop chasing shipments one by one; the system highlights what matters and guides
the resolution.* The home page is the attention queue, not a list of shipments.

Ops density (03 §1.2): compact rows, monospaced data, keyboard-first.

## 1. Attention queue — `/ops` (US-O-01, AI-2)

```
ATTENTION QUEUE   DELAY 3 · HOLD 1 · STALE 0 · CUSTOMS INCIDENT 1 · MISSING DOCUMENT 1
OPS · ZARAGOZA PLANT, VALENCIA WAREHOUSE    [Site ▾] [Operator ▾] [Mode ▾] [Open+Ack ▾]

▌ 90  HOLD · HIGH      SH-10441  Corvane México  BlueWave ⛴   open 5 h   [Upload document]
▌     Customs hold at Veracruz: documentation discrepancy.
▌     key account · international · ETA in 20 h                       J/K move · ↵ open
▌ 60  CUSTOMS INCIDENT · HIGH  SH-10444  …  waiting on operator   [Contact operator]
▌     …
▌ 60  DELAY · HIGH     SH-10436  Corvane México  BlueWave ⛴   open 2 h   [Notify customer] N
▌     Vessel ETA moved +30 h. Customer not yet notified.
  …
```

The order and scores for Marc Puig are those of [07-seed-data.md](07-seed-data.md) §5.

**OP-01** THE page SHALL list exceptions from `GET /api/exceptions` (status open or
acknowledged by default), ordered by priority (BR-PR-02), as triage rows (DS-08).

**OP-02** Each row SHALL show: severity bar, priority score in large condensed mono, type
and severity, shipment reference, account, operator and mode, a one-line reason, the time
open, state (`acknowledged`, `waiting on operator`) and the **primary action as a button**
(BR-NA-01).

**OP-03** A third line SHALL show the top priority factors (BR-PR-03) in field-label style;
the full AI explanation opens in the exception panel.

**OP-04** Counters per exception type in the page header, clickable as filters. They count the
queue under every filter except the type filter, so they don't drop to zero while a type is
selected. Filters: site, operator, mode, type, status. All filters live in the URL.

**OP-05** Empty state: `ALL CLEAR` stamp (UI-10) with a link to the portfolio.

**OP-06** WHEN a realtime event creates or changes an exception (BR-RT-01) THE queue SHALL
refetch and re-sort; the affected row flips (DS-07) and keeps the update dot.

**OP-07 — Keyboard** (S). `J`/`K` move the selection, `Enter` opens the panel, `N` notify
customer, `A` acknowledge, `Esc` closes, `?` lists the shortcuts. The selected row has a
`--signal` focus outline. Shortcuts are disabled while typing in a field.

## 2. Exception panel (US-O-03, AI-2, AI-3)

Opens as a side panel (`Sheet`) from a queue row, or from the Exceptions tab of the
shipment detail; the URL keeps `?exception=<id>` so it can be shared and survives a reload.

```
[OPEN]  HIGH · OPEN 5 h                                    [Acknowledge] A
SH-10441
ACCOUNT            OPERATOR          ETA               COMMITTED
Corvane México     BlueWave          ≈ Thu 21 Nov      Wed 20 Nov
■━━━━●━━━━━━━━━━━━●━━━━━━◆┅┅┅┅┅○
┃ AI NOTE · PRIORITY 90 · CONFIDENCE HIGH
┃ Ranked first: high-severity hold [1] on a key account [2], international,
┃ ETA in 20 h [3].
┃ [1] CHLD from BlueWave, 5 h ago  [2] Account tier: key  [3] ≈ ETA Thu 21 Nov
NEXT ACTION
[Upload document]   Contact operator   Notify customer
HISTORY
10:02  Raised automatically: customs hold reported by BlueWave
[Resolve…]                                               [Open shipment →]
```

**OP-10** THE panel SHALL show: the exception's lifecycle state (BR-EX-09, not the
shipment status) — `OPEN` and `ACKNOWLEDGED` as condensed text chips, `RESOLVED` as a stamp
(DS-10), with "Waiting on operator" as a chip next to it — severity, time open, manifest blocks
(account, operator, ETA with SC-03, committed date), the compact transit line, the AI
priority explanation as an analyst note (SC-06), suggested actions in order (primary as a
`--signal` button), and the exception history from activity.

**OP-11 Notify customer (AI-3).** A dialog with subject and message pre-filled from
`POST /api/ai/exceptions/:id/draft-message`, framed as an analyst note (DS-06) that turns
into a normal editable field once the agent edits it. The
agent can edit everything, tick "Customer action required" and send. Sending calls
`POST /api/exceptions/:id/actions` with `notify_customer` (BR-AC-01). The draft is never
sent without the agent pressing *Send*.

**OP-12 Contact operator.** A dialog with the operator pre-selected and a template message
(editable). Sending records the action (BR-AC-02); the row shows "Waiting on operator".

**OP-13 Upload document.** A dialog with the document type (pre-selected with the missing
one) and a file picker (PDF, max 10 MB). Only metadata is stored in Phase 1 (BR-AC-03).
It sends the `upload_document` action, so the upload lands in the exception's history. On
success the panel shows whether the exception was resolved by the upload.

**OP-14 Acknowledge / Resolve.** Acknowledge assigns it to the user (BR-AC-04). Resolve asks
for a required note (BR-AC-05).

**OP-15** After any action THE SYSTEM SHALL show a confirmation toast, update the panel and
the queue, and record the action in the shipment's activity.

**OP-16** API errors (`409`, `422`, `5xx`) SHALL show an inline error in the dialog without
losing what the agent typed.

## 3. Portfolio — `/ops/shipments` (US-O-02)

```
SHIPMENTS                                                   [Search reference…]
[Site ▾] [Operator ▾] [Mode ▾] [Domestic / International ▾] [Status ▾] [On-time ▾]
REF       ACCOUNT          ORIGIN    DESTINATION     ROUTE              STATUS      ON-TIME  ETA            EXC
SH-10433  Corvane México   Zaragoza  Querétaro, MX   ■━━●━━━●┅┅◇┅┅○     IN TRANSIT  ■ On time ≈ Thu 21 Nov  —
SH-10436  Corvane México   Valencia  Querétaro, MX   ■━━━●━━━━●┅◇┅┅○    IN TRANSIT  ■ Late    ≈ Thu 14 Nov  1
```

**OP-20** THE page SHALL show a dense board of all shipments in the perimeter
(`GET /api/shipments`) with the columns above: references and dates in mono, the compact
transit line as the route column (SC-04), open exceptions as a mono count.

**OP-21** Filters: site, operator, mode, destination type, status, on-time indicator and
search by reference. Filter options come from `GET /api/reference` (only what's in the
perimeter). Filters live in the URL.

**OP-22** Sortable by ETA, status and on-time through clickable column headers; the sort lives
in the URL (`?sort=eta|status|onTime`) and a second click on the same header reverses it.
Orders: ETA ascending with unknown last; status in journey order (`booked` → `delivered`);
on-time `late` → `at_risk` → `unknown` → `on_time`. Default sort (no `sort`) is the API order:
active shipments attention-first (BR-OT-03), delivered shipments last.

**OP-23** On mobile, each row becomes a two-line ruled row (reference, ETA and on-time on
the first line; compact transit line and status on the second).

**OP-24** Live changes flip the affected cells (DS-07).

## 4. Shipment detail (ops) — `/ops/shipments/[id]` (US-O-04)

Same header, manifest blocks, transit line and AI summary note as the customer detail
(05 §3), in ops density, plus tabs:

| Tab | Content | Endpoint |
|-----|---------|----------|
| Timeline | SC-05 `ops` variant: each milestone with the raw operator event it came from (code, label, original payload on expand, received time); unmapped events in place, marked "Unmapped" with a link to Status mappings; mapped events that produce no milestone (ETA and position updates) in place as event-only rows labelled with their target ("ETA update", "Position update") | `/timeline`, `/raw-events` |
| Exceptions | Open and resolved exceptions of the shipment; opening one shows the panel (§2) | `/api/exceptions?shipmentId=` |
| Documents | SC-08 with upload | `/documents` |
| Activity | Chronological log: actions, automatic resolutions, messages sent, operator contacts | `/activity` |

**OP-30** The raw/normalised side-by-side view SHALL make the normalisation visible: e.g.
`BWS · "VD" · Vessel departed Valencia` → **Vessel departed** (confirmed).

## 5. Status mappings — `/ops/mappings` (US-O-05, AI-4) — Should

```
Status mappings                                            2 unmapped
Operator          Raw status                           Seen  Last seen    AI suggestion
LastMile Exp. MX  "Parcel handed to recipient"         1     10 min ago   Delivered · 75%  [Accept] [Choose…]
EuroRoad          "RET-PLAT"                           2     3 h ago      No confident suggestion   [Choose…]
```

**OP-40** THE page SHALL list unmapped `(operator, code)` pairs from
`GET /api/mappings/unmapped`, with occurrences, last seen, affected shipments and the AI
suggestion (`/api/ai/raw-events/:id/mapping-suggestion`, BR-AI-04) with its confidence and
evidence.

**OP-41** *Accept* confirms the top suggestion; *Choose…* opens a select with every
mapping target (milestones, `eta_update`, `position_update`, `ignore`). Both call
`POST /api/mappings`, which reprocesses past events (BR-NM-03) and updates affected
shipments live.

**OP-42** The sidebar badge shows the number of unmapped pairs (03 UI-05). The item and its
badge ship with this page (T15).

## 6. Simulator (US-R-02) — non-production only

Opens as a side panel from the sidebar item *Simulator*, for any role (so a reviewer can
trigger events from either tab).

```
Simulator                          Clock: now + 0 h   [+2 h] [+6 h]
SIM-01 Vessel delay           SH-10433 · BlueWave ETA +36 h          [Run]
SIM-02 Customs hold           SH-10447 · hold at Veracruz            [Run]
SIM-03 Operator goes silent   SH-10421 · EuroRoad silent, clock +2 h [Run]
SIM-04 Unknown status code    SH-10450 · new last-mile status        [Run]
SIM-05 Delivery               SH-10401 · proof of delivery           [Run]
Network: (•) Normal ( ) Slow ( ) Timeouts ( ) Flaky ( ) API down
Monitoring log (3)                                              [Clear]
  10:42  error  TimeoutError GET /api/shipments  /ops  req 7f3a…
                                                        [Reset data]
```

**OP-50** THE panel SHALL list the scenarios from `GET /api/simulator/scenarios`, each with
its target shipment and a one-line description; *Run* calls
`POST /api/simulator/scenarios/:id/run`. Expected outcomes are in
[07-seed-data.md](07-seed-data.md) §6.

**OP-51** A scenario that has already run is marked "Done" and disabled until the next reset.

**OP-52** THE panel SHALL show the clock offset and allow advancing it
(`POST /api/simulator/clock` `{ hours }`), which re-runs the engine for every shipment
(BR-EX-10).

**OP-53** *Reset data* asks for confirmation, calls `POST /api/simulator/reset` and every
open tab reloads its data (`data.reset`, BR-RT-01). Sessions are kept.

**OP-54** The sidebar item and the panel SHALL not exist when `NEXT_PUBLIC_API_MOCKING` is
not `enabled`.

**OP-55 — Network conditions.** THE panel SHALL offer a selector with the failure modes
of 02 §5.6 (Normal, Slow network, Timeouts, Flaky, API down), applied to the current tab
and shown as a warning chip in the header while not *Normal*, so nobody forgets it is on.

**OP-56 — Monitoring log.** THE panel SHALL show the last events captured by the console
monitoring reporter (02 §5.8): time, level, message, route and request id, newest first,
with *Clear*.

## 7. Out of scope (ops)

Bulk actions, assignment to other agents, SLAs per account, editing shipments, real e-mail
or operator messaging, dashboards and analytics, natural-language queries (AI-6).
