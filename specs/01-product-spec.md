# 01 — Product Spec

## 1. Problem

An industrial manufacturer ships from several factories and warehouses to customers and
subsidiaries, domestically and internationally, through several logistics operators, by
road and sea, often combining modes in one shipment. Tracking is fragmented across
operator portals, email and phone. There is no consolidated, reliable view.

Each operator reports in its own format and status vocabulary, and milestones differ by
mode (road vs sea) and, internationally, include customs.

## 2. Goals

| ID | Goal |
|----|------|
| G-1 | One consolidated, end-to-end view of shipment status across sites, operators and modes |
| G-2 | Customers know where a shipment is, whether it's on time and when it arrives, without calling anyone, and hear about problems before they happen |
| G-3 | Operations stop chasing shipments one by one: the system highlights what matters and guides resolution |
| G-4 | AI and product intelligence are a core part of the experience, each use justified |
| G-5 | Data is trustworthy: confirmed vs estimated vs predicted is always distinguishable |

## 3. Delivery phases

| Phase | Scope |
|-------|-------|
| **Phase 1 (this spec)** | Frontend application for both roles, built against service contracts with mock implementations and synthetic seed data. Validated with customer and operations users |
| Phase 2 | Backend, operator integrations (API, EDI, email parsing), real authentication, production AI pipeline. Implements the same service contracts |

### Non-goals (Phase 1)
- Backend, database or operator integrations.
- Real authentication; a development sign-in lists seeded users.
- Booking or creating shipments, billing, carrier rate management.

## 4. Glossary

| Term | Definition |
|------|-----------|
| **Site** | Origin point owned by the manufacturer: factory or warehouse |
| **Account** | A customer or subsidiary receiving shipments |
| **Operator** | Logistics provider (road haulier, shipping line, drayage, last-mile) |
| **Shipment** | A consignment from one site to one account destination |
| **Leg** | A segment of a shipment with a single mode and operator (e.g. road to port) |
| **Milestone** | A normalised, meaningful point in a shipment's life (departed, loaded on vessel, customs cleared, delivered…) |
| **Raw event** | An operator's original status message, in its own format and vocabulary |
| **Normalisation** | Mapping raw events to the canonical milestone and status vocabulary |
| **Provenance** | Where a value comes from: `confirmed`, `estimated` or `predicted` |
| **Exception** | A condition requiring attention: `delay`, `hold`, `stale`, `customs_incident`, `missing_document` |
| **Next action** | Suggested resolution step for an exception: notify customer, contact operator, upload document |
| **Perimeter** | The set of shipments a user is allowed to see |

## 5. Roles and personas

| Role | Persona | Perimeter |
|------|---------|-----------|
| `customer` | Procurement lead at a customer account | Shipments whose destination account is theirs |
| `customer` (subsidiary) | Logistics coordinator at a foreign subsidiary | Shipments to their subsidiary |
| `ops_agent` | Customer-support / logistics agent at one site | Shipments originating at their site(s) |
| `ops_manager` | Logistics manager | All sites and accounts |

The two business roles (customer, internal operations) are modelled as three permission
levels: subsidiaries are customers whose account type is `subsidiary`, and operations is
split by perimeter (one site vs all sites). Agents and managers use the same screens.

## 6. User stories and acceptance criteria

Priority uses MoSCoW: **M**ust (Phase 1 release), **S**hould (Phase 1 if capacity
allows), **C**ould (later phase).

### 6.1 Common

**US-00 — Sign in** (M)
- WHEN a user opens the app without a session THE SYSTEM SHALL show a sign-in form
  (email + password).
- WHEN credentials match a user THE SYSTEM SHALL start a session with that user's role and
  perimeter, as stored for the user; the user never chooses a role.
- WHEN credentials don't match THE SYSTEM SHALL show a generic error, without revealing
  whether the email exists.
- WHEN signed in THE SYSTEM SHALL route to that role's home view; a signed-in user
  opening the other role's area SHALL be redirected to their own.
- WHILE in a non-production environment THE SYSTEM SHALL show, below the form, the test
  accounts and their shared password, with one-click fill, for QA and stakeholder reviews.
- THE SYSTEM SHALL allow signing out from the header.
- THE SYSTEM SHALL keep sessions per browser tab, so different users (e.g. a customer and
  an ops agent) can be signed in at the same time in separate tabs.
- WHEN a user acts in one tab THE SYSTEM SHALL reflect the change in every other open tab
  without a manual reload (see US-R-01).

**US-01 — Perimeter enforcement** (M)
- THE SYSTEM SHALL return only shipments inside the current user's perimeter from every
  API endpoint.
- WHEN a user requests a shipment outside their perimeter THE SYSTEM SHALL respond as
  not found (no information leak).

### 6.2 Customer / subsidiary

**US-C-01 — My shipments overview** (M)
- THE SYSTEM SHALL list the user's active shipments with reference, origin, destination,
  current status, ETA and an on-time indicator (`on_time`, `at_risk`, `late`, `unknown`).
- THE SYSTEM SHALL sort shipments needing attention first, then by ETA (BR-OT-03).
- THE SYSTEM SHALL allow filtering by status and searching by reference.
- Indicator rules: BR-OT-01..02. Screen: 05 §2.

**US-C-02 — Shipment detail** (M)
- THE SYSTEM SHALL show a timeline of milestones grouped by leg, with mode and operator
  for each leg (multimodal: road → port → vessel → port → road).
- THE SYSTEM SHALL mark each milestone and the ETA with its provenance; estimated and
  predicted values SHALL be visually distinct from confirmed ones.
- WHERE the shipment requires customs (destination outside the EU, BR-MS-02) THE SYSTEM
  SHALL show the customs milestones.
- THE SYSTEM SHALL show when data was last updated and flag it if stale.
- Rules: BR-MS-*, BR-ETA-*. Screen: 05 §3.

**US-C-03 — Plain-language status summary** (M, AI-1)
- THE SYSTEM SHALL show a short, AI-generated summary on top of the detail
  ("Your order is on the vessel, ~1 day behind plan, expected Thu 12").
- THE SUMMARY SHALL only reference facts present in the shipment data (BR-AI-01).

**US-C-04 — Proactive alerts** (M)
- WHEN a shipment in the perimeter becomes `at_risk`, `late` or affected by an
  incident THE SYSTEM SHALL raise an alert in the notification centre and on the
  shipment card.
- Each alert SHALL explain what happened, the impact on ETA and whether action is
  required from the customer.
- Triggers and deduplication: BR-AL-*. Screen: 05 §4.

**US-C-05 — Documents** (S)
- THE SYSTEM SHALL list available documents per shipment (CMR, bill of lading,
  commercial invoice, packing list, customs declaration, proof of delivery) with status
  `available` / `pending`, and allow downloading them.

**US-C-06 — Ask about my shipments** (C, AI-6)
- Natural-language questions ("which orders arrive late this week?") answered with
  references to the matching shipments.

### 6.3 Internal operations

**US-O-01 — Attention queue** (M, AI-2)
- THE SYSTEM SHALL open on a queue of open exceptions in the perimeter, ranked by
  priority (severity × customer impact × urgency × age, BR-PR-01).
- Each item SHALL show the exception type, shipment, account, operator, why it was
  raised and the suggested next action.
- THE SYSTEM SHALL show counters per exception type and allow filtering by site,
  operator, mode and type.
- Detection rules: BR-EX-*. Next action: BR-NA-*. Screen: 06 §1.

**US-O-02 — Portfolio view** (M)
- THE SYSTEM SHALL list all shipments in the perimeter with filters by site, operator,
  mode, destination type (domestic/international), status and on-time indicator.

**US-O-03 — Resolve an exception** (M, AI-3)
- WHEN an agent opens an exception THE SYSTEM SHALL present the suggested next action
  and allow executing it: notify customer, contact operator, upload document,
  acknowledge or resolve.
- WHEN "notify customer" is chosen THE SYSTEM SHALL pre-fill an AI-drafted message that
  the agent can edit before sending.
- WHEN an action is executed THE SYSTEM SHALL record it in the shipment activity log and
  update the exception status.
- Rules: BR-AC-*, BR-AI-03. Screen: 06 §2.

**US-O-04 — Shipment detail (ops)** (M)
- Same as US-C-02 plus: raw operator events next to their normalised milestone,
  activity log, and the open exceptions of the shipment.

**US-O-05 — Unmapped operator statuses** (S, AI-4)
- WHEN a raw event cannot be normalised with the known mapping THE SYSTEM SHALL flag it
  and propose a mapping with confidence, which an agent accepts or corrects.
- Rules: BR-NM-03, BR-AI-04. Screen: 06 §5.

### 6.4 Freshness (cross-role)

**US-R-01 — Live updates** (M)
- WHEN a new tracking event arrives for a visible shipment THE SYSTEM SHALL update
  views without a manual reload and highlight what changed.
- THE SYSTEM SHALL mark a shipment `stale` when no event has been received within the
  expected interval for its current leg (road: 12 h, sea: 48 h, in customs: 24 h; BR-SL-*).

**US-R-02 — Event simulator** (M)
- WHILE in a non-production environment THE SYSTEM SHALL provide a simulator panel to
  inject scripted operator events (vessel delay, customs hold, operator silence, unknown
  status code, delivery), advance the clock and reset the seed data, for QA and
  stakeholder reviews. Scenarios: 07 §6. Screen: 06 §6.
- THE simulator SHALL NOT be available in production.

## 7. AI features

Each feature is justified against a goal and rendered with the same pattern: AI label,
confidence, "why" (evidence), and a human confirmation step if it leads to an action.

| ID | Feature | Role | Goal | Why AI (vs plain rules) | Phase 1 implementation |
|----|---------|------|------|------------------------|------------------------|
| AI-1 | Plain-language shipment summary | Customer | G-2 | Turns a dense multi-leg timeline into one sentence a non-logistics user trusts | Template-driven mock from real shipment fields |
| AI-2 | Exception prioritisation & explanation | Ops | G-3 | Ranking needs to weigh many signals (customer, value, ETA slack, operator history); explanation builds trust | Scoring function + generated rationale |
| AI-3 | Next best action + drafted message | Ops | G-3 | Saves writing time; adapts tone and content to the customer and incident | Templates per exception type |
| AI-4 | Status normalisation assist | Ops | G-1 | Operators keep adding codes; suggesting mappings scales better than hand-maintained tables | String similarity over known vocabulary |
| AI-5 | Predicted ETA with confidence | Both | G-2, G-5 | Operator ETAs are often optimistic; a prediction from history anticipates delays | Heuristic on leg delays, labelled `predicted` |
| AI-6 | Natural-language Q&A / filters | Both | G-2, G-3 | Natural access to the portfolio without learning filters | Later phase |

AI-1, AI-2, AI-3 and AI-5 are **Must** for Phase 1. AI-4 is **Should**. AI-6 is
**Could**. The Phase 2 approach for each one is in
[02-architecture.md §6.4](02-architecture.md#64-ai-in-phase-2).

## 8. Non-functional requirements

| ID | Requirement |
|----|-------------|
| NFR-01 | Deployed on Vercel; works on the latest Chrome, Firefox and Safari; usable from 360 px width up |
| NFR-02 | Seed data is synthetic (no real or personal data); seed dates are relative to the current time so non-production environments stay realistic |
| NFR-03 | Loading, empty and error states exist for every data-driven view |
| NFR-04 | Accessibility: semantic HTML, keyboard navigable, WCAG AA contrast, status not conveyed by colour alone |
| NFR-05 | Mock services simulate network latency (150–400 ms) so loading states behave as with a real API |
| NFR-06 | Lighthouse performance ≥ 90 on the main views |
| NFR-07 | Unit tests cover normalisation, exception detection and perimeter filtering; the simulator scenarios (07 §6) run as integration tests |
| NFR-08 | Resilience: every request times out (10 s, uploads 30 s); transient query failures retry twice with back-off; mutations never retry automatically; a failing block never breaks the whole page; the app tells the user when the service is unavailable or the browser is offline (02 §5.6) |
| NFR-09 | Monitoring: unexpected errors (render errors, unavailable API after retries, contract violations, unhandled rejections) are reported through a monitoring layer with user id, role, route and request id, and no personal data; console in Phase 1, Sentry in Phase 2 (02 §5.8) |

## 9. Seed data

- **Sites (4):** Zaragoza Plant, Bilbao Plant, Valencia Warehouse, Barcelona Warehouse.
- **Accounts (5):** 3 domestic customers, 1 French customer, 1 Mexican subsidiary.
- **Operators (5):** 2 road hauliers, 1 shipping line, 1 port drayage, 1 last-mile courier.
  Each has its own raw format and status vocabulary.
- **Shipments (22):** domestic road, EU road, and multimodal sea (Valencia → Veracruz)
  with customs. Seeded to cover every exception type and on-time indicator.
- **Users (8):** 5 customers (one per account), 2 ops agents, 1 ops manager.

Full catalogue and scenarios: [07-seed-data.md](07-seed-data.md).

## 10. Scope decision (Phase 1)

| In (go deep) | In (light) | Out (later phases) |
|--------------|-----------|---------------------|
| Ops attention queue + resolution flow | Customer documents | Real auth / SSO |
| Shipment detail with multimodal timeline & provenance | Portfolio filters | Operator integrations (EDI, APIs, email parsing) |
| Customer overview + alerts + AI summary | Unmapped status assist | Email/SMS delivery of alerts |
| Live updates + event simulator | | NL Q&A (AI-6), map view, analytics |

Rationale: the two flows that carry the product's core value are *ops manages by
exception* and *customer trusts the ETA*. Both rely on the same normalised timeline, so
it gets the most care.

## 11. Assumptions

- A-1: Operators expose events in different formats; in Phase 2 these arrive via API,
  EDI or parsed email. Phase 1 models them as raw payloads per operator.
- A-2: A shipment has exactly one origin site and one destination account.
- A-3: Expected update intervals per mode define staleness (see US-R-01).
- A-4: All content is in English: UI, alerts, AI outputs and operator messages. i18n is
  out of scope.
- A-5: Shipments are created upstream, in the manufacturer's ERP/TMS, when a booking with
  the operators is confirmed (legs, operators, planned dates, committed delivery date,
  tracking numbers). The tracking app ingests them and never creates them: doing so would
  duplicate the source of truth. In Phase 1 they come from seed data; in Phase 2 from an
  ERP/TMS integration. The app only adds information on top of existing shipments
  (exceptions, alerts, documents, activity).

## 12. Open questions

None. Resolved:
- Q-1: Customers replying to alerts (e.g. confirming a new delivery slot) → out of Phase 1.
- Q-2: Languages → English only (A-4).
