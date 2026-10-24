# 05 — Customer Portal & Shared Shipment Components

Satisfies: US-C-01..05, AI-1, AI-5 and US-R-01 for customers
([01-product-spec.md](01-product-spec.md)). Rules: [04-domain-logic.md](04-domain-logic.md).
Shell: [03-app-shell.md](03-app-shell.md).

Customer goal: *without calling anyone, know where the shipment is, whether it's on time and
when it arrives, and hear about problems before they happen.* Every screen answers those
questions first, in plain language.

## 1. Shared shipment components

Used by both the customer portal and the ops console (06), in `features/shipments` and
`features/ai`. All of them follow the design language in
[03-app-shell.md](03-app-shell.md) §1.

**SC-01 — `ShipmentStatus`.** Status as condensed uppercase text with its icon
(`IN TRANSIT`, `AT PORT`, `IN CUSTOMS`…). Terminal and blocking states (`DELIVERED`,
`ON HOLD`) use the stamp (DS-10) in the detail header.

**SC-02 — `OnTimeIndicator`.** A small square marker + word: `on_time` (`--ok`, "On time"),
`at_risk` (`--risk`, "At risk"), `late` (`--late`, "Late"), `unknown` (`--unknown`,
"Unknown"). Tooltip with the reason ("ETA 18 h after the committed date"). Never colour
alone (NFR-04).

**SC-03 — `SourcedDate`.** Renders a `Sourced<string>` date with provenance typography
(DS-05) and its source tooltip. Flagged as outdated (BR-ETA-05), it adds "may be outdated"
and the last update time. Tooltip copy by source:

| Source | Tooltip |
|--------|---------|
| operator, `confirmed` | "Confirmed by {operator} · {observedAt}" |
| operator, `estimated` | "Estimated by {operator} · {observedAt}" |
| `booking` | "Planned at booking" |
| `system` | "Our estimate, based on {eta.basis}" (or just "Our estimate" when `basis` is null) |
| `ai` | "AI prediction · {confidence}% confidence" |

Milestone labels are the sentence case of the type ("Vessel departed", "Customs hold"),
defined once in `domain/rules/labels.ts`. The on-time tooltip reason comes from a pure
`onTimeReason()` that rephrases the BR-OT-01 case that applied.

**SC-04 — `TransitLine`.** The route as a metro line (DS-04): legs as segments with their
mode glyph and operator, milestones as stops, solid for confirmed, dashed for planned and
estimated, the current position (BR-MS-06) as a `--signal` square, customs as a stamp-shaped
stop when it applies (BR-MS-02). *Compact* variant: one stop per **place** (origin, ports,
customs, destination), one line, no labels, used in list rows; built from the shipment
alone (`legs`, `hasCustoms`, `lastDoneMilestone`): sections before the latest done
milestone are solid, the marker sits mid-section while moving or on the place when that
milestone ends its section (`arrived_port`, `discharged`, `customs_cleared`, `delivered`). *Full* variant: one stop
per **milestone**, grouped by leg, with place labels at leg boundaries and leg operator and
mode above each segment, plus `SourcedDate`s; customs is a single stamp-shaped stop
covering both customs milestones; scrolls horizontally on mobile. Current-position marker:
none for booked shipments (all dashed), on the final stop when delivered, otherwise on
the latest done milestone. While a customs hold is open, the customs stop is outlined in
`--late` and labelled "Customs · on hold", in addition to the marker (never colour
alone).

**SC-05 — `ShipmentTimeline`.** Vertical detail of the transit line: milestones grouped by
leg (header: mode glyph, operator, tracking number in mono), in plan order. Each stop shows
the label, planned and actual `SourcedDate`, and its state (BR-MS-04): done (filled square),
not reported (hollow square, "Not reported by operator"), overdue (`--late` outline),
pending (`--rule`). Customs holds appear as a stamp on the customs block. Hovering a stop
highlights it on the transit line and vice versa. Variant `ops` adds the raw event column
(06 §4).

**SC-06 — `AnalystNote`.** Every AI output, rendered as the analyst note (DS-06):
monospaced header with the kind and confidence (low under 0.6 · medium under 0.8 · high),
the content, evidence as numbered footnotes linked to the stops or events they cite, and
the generation time. Actionable variant adds *Use* / *Edit* / *Dismiss* (used in 06).
A skeleton while loading; if the AI endpoint fails, the note is hidden and the rest of the
page is not affected.

**SC-07 — `LastUpdated`.** "Updated 2 h ago" in mono from `lastEventAt`. If stale
(BR-SL-02), a ruled `--risk` notice under the header: "No update from the operator for
14 h. Information may be outdated."

**SC-08 — `DocumentList`.** Document type, status (`available` / `pending`), date, and a
download button when available. Ops variant adds upload (06).

## 2. Arrivals — `/portal` (US-C-01)

Customer density (03 §1.2): spacious rows, one answer per row.

```
ARRIVALS                                   12 active · 8 on time · 3 at risk · 1 late
ALBA RETAIL S.L.                     [Search reference…]  [Active | Delivered 7 days]

NEEDS ATTENTION ─────────────────────────────────────────────────────────────────
▌≈ THU 14 NOV   SH-10436  Valencia WH → Querétaro, MX            ■ Late   ● alert
                ■━━━━●━━━━━━━●┅┅┅┅◇┅┅┅┅○   About 1 day behind the committed Wed 13 Nov
TODAY ───────────────────────────────────────────────────────────────────────────
 ≈ 18:00        SH-10402  Barcelona WH → Sevilla                ■ On time
                ■━━━━━━━━━━━━━━━━━━●┅┅○   Out for delivery
THIS WEEK ───────────────────────────────────────────────────────────────────────
 …
```

**CP-01** THE page SHALL call `GET /api/shipments` (the perimeter applies in the API) and
show the counts of active, on time, at risk and late shipments as compact counters in the
page header; each counter filters the list.

**CP-02** THE list SHALL be an arrivals agenda (DS-09): a pinned *Needs attention* group
(`late`, `at_risk`, `on_hold`, `unknown`, ordered by BR-OT-03), then the rest grouped by
ETA day: *Today*, *Tomorrow*, *This week*, *Later*.

**CP-03** Each row SHALL lead with the ETA in large condensed type (SC-03), then: reference
in mono, origin site → destination city and country, on-time indicator (SC-02), unread
alert marker, the compact transit line (SC-04) and one status sentence ("Out for
delivery", "About 1 day behind the committed Wed 13 Nov").

**CP-04** Search by reference (contains, case-insensitive), filter by status, and switch
between *Active* and *Delivered (last 7 days)*. Filters live in the URL
(`?q=&status=&view=`).

**CP-05** Clicking a row opens its detail page.

**CP-06** Empty state: `NOTHING IN TRANSIT` stamp (UI-10) with a link to *Delivered*.
Error state with *Retry*.

## 3. Shipment detail — `/portal/shipments/[id]` (US-C-02, US-C-03, US-C-05)

```
← ARRIVALS
SH-10436                                                   IN TRANSIT  ■ Late
ARRIVING ≈ THU 14 NOV                                      Updated 2 h ago

ORIGIN               DESTINATION          COMMITTED          PREDICTED
Valencia Warehouse   Querétaro, MX        Wed 13 Nov         ~ Fri 15 Nov  AI 68%
─────────────────────────────────────────────────────────────────────────────
■━━━━━━━━●━━━━━━━━━━━━━━━━━━━●┅┅┅┅┅┅┅┅◇┅┅┅┅┅┅┅○
Valencia WH   Valencia port        at sea        Veracruz   customs   Querétaro
─────────────────────────────────────────────────────────────────────────────
┃ AI NOTE · SUMMARY · CONFIDENCE HIGH
┃ Your order is on board the vessel to Veracruz, about 1 day behind plan [1].
┃ Expected delivery Thu 14 Nov, estimated by BlueWave [2].
┃ [1] Vessel departed Valencia 18 h late  [2] BlueWave ETA update, 2 h ago
─────────────────────────────────────────────────────────────────────────────
TIMELINE (SC-05)                              DOCUMENTS (SC-08)
                                              ALERTS FOR THIS SHIPMENT
```

**CP-10** THE page SHALL load `GET /api/shipments/:id` and
`GET /api/shipments/:id/timeline`; the AI summary (`/api/ai/shipments/:id/summary`) and the
prediction (`/eta-prediction`) load in parallel, without blocking the page.

**CP-11** Order of content: header with the answer first ("ARRIVING ≈ THU 14 NOV",
status, on-time, last update) → manifest blocks (DS-03: origin, destination, committed,
predicted AI-5) → full transit line (SC-04) → AI summary note (AI-1, SC-06) → timeline →
documents → related alerts. On mobile everything stacks in that order.

**CP-12** If there is an open hold or customs incident, a ruled notice under the header
SHALL explain it in plain language and say whether the customer needs to do anything (from
the latest related alert, BR-AL-03).

**CP-13** Stale notice per SC-07.

**CP-14** Documents (US-C-05): list from `GET /api/shipments/:id/documents`; download via
`GET /api/documents/:id/file`.

**CP-15** A shipment outside the perimeter or non-existent (`404`) SHALL show the
`NOT FOUND` stamp (UI-10) with a link back, revealing nothing else.

**CP-16** Raw operator events, exceptions, priority scores, internal activity and operator
contact data SHALL NOT appear in the customer view (BR-PM-04).

## 4. Alerts — `/portal/alerts` (US-C-04)

```
ALERTS                                                   [Mark all as read]
TODAY ──────────────────────────────────────────────────────────────────
● 10:42  SH-10436  Delivery delayed by ~1 day
         New ETA ≈ Thu 14 Nov (estimated by BlueWave). No action needed.
EARLIER ────────────────────────────────────────────────────────────────
  Mon 08:15  SH-10403  [DELIVERED]
```

**CP-20** THE page SHALL list alerts from `GET /api/alerts`, newest first, grouped *Today* /
*Earlier*, unread ones highlighted with a dot.

**CP-21** Each alert SHALL show: shipment reference, title, what happened, ETA impact and
"Action needed" when `requiresAction` (BR-AL-03). Clicking it marks it as read
(`POST /api/alerts/:id/read`) and opens the shipment.

**CP-22** "Mark all as read" marks all visible unread alerts as read.

**CP-23** The strip bell and the rail counter show the unread count (03 UI-03, UI-05).

## 5. Live behaviour (US-R-01)

**CP-30** WHEN a realtime event affects a shipment in view THE page SHALL refetch it
(BR-RT-02); values that changed (status, ETA, on-time) flip (DS-07) and the transit line
marker moves to its new position.

**CP-31** WHEN a new alert arrives for the user THE SYSTEM SHALL show a toast with the
title and a link to the shipment, on any portal page.

## 6. Out of scope (customer)

Replying to alerts (Q-1), notification preferences, email/SMS, natural-language questions
(AI-6), map view, exporting lists.
