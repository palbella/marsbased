# 08 — Tasks

Implementation plan for Phase 1. Each task is small, verifiable and references the
requirement IDs it covers. A task is done when its **Done when** criteria pass.

Budget: **8 h** for the Must tasks (estimates assume AI-assisted coding). Should tasks are
only started if the Must line finishes early.

## Order and budget

| # | Task | Covers | Estimate |
|---|------|--------|----------|
| | **A. Foundations** | | |
| T01 | Project setup | NFR-01, 02 §1, §3.3 | 20 min |
| T02 | Domain types and API schemas | 02 §6 | 25 min |
| T03 | Mock database and seed data | 02 §5.5, 07 | 40 min |
| T04 | Domain engine and unit tests | 04 §1–12, §14 | 60 min |
| T05 | Mock API, API client and services | 02 §5, 04 §13, NFR-08, NFR-09 | 45 min |
| | **B. UI** | | |
| T06 | Design tokens, app shell, sign-in, profile, error boundaries | 03, 02 §5.6 | 60 min |
| T07 | Shared shipment components | 05 §1, DS-03..06 | 55 min |
| T08 | Customer portal | 05 §2–5 | 35 min |
| T09 | Attention queue and exception panel | 06 §1–2 | 45 min |
| T10 | Portfolio and ops shipment detail | 06 §3–4 | 25 min |
| T11 | Realtime and simulator | 02 §7, 04 §15, 06 §6, 07 §6 | 35 min |
| | **C. Delivery** | | |
| T12 | Polish pass and failure-mode check | NFR-03, NFR-04, NFR-01, NFR-08 | 10 min |
| T13 | Deploy, README and review run | NFR-01, 07 §5–6 | 10 min |
| T14 | Write-up | `docs/write-up.md` | 15 min |
| | **Must total** | | **8 h 00 min** |
| | ───── cut line ───── | | |
| T15 | Status mappings page (Should) | US-O-05, AI-4, SIM-04 | 25 min |
| T16 | Component and smoke tests (Should) | 02 §10 | 30 min |
| T17 | Extras (Should) | CP-22, DS-07 board flip, OP-07 keyboard, OP-56 monitoring log | 30 min |

**If behind schedule**, cut in this order: T17 → T16 → T15 → Activity tab in T10 →
T12 reduced to a 360 px check.

## A. Foundations

### T01 — Project setup
- Next.js 15 (App Router), TypeScript `strict` + `noUncheckedIndexedAccess`, Tailwind,
  shadcn/ui init, ESLint with the import boundary rule (02 §3.3), Prettier, Vitest.
- MSW 2: `npx msw init public`, `src/mocks/browser.ts`, `src/mocks/node.ts`,
  `app/mock-provider.tsx`; env vars from 02 §5.7.
- `.env.example` with every variable from 02 §5.7 and its Phase 1 value, commented.
- `package.json` scripts used by `CLAUDE.md`: `lint`, `typecheck` (`tsc --noEmit`) and
  `test` (`vitest run`).
- **Done when:** `dev`, `build`, `lint` and `test` pass on an empty app; a request to
  `/api/health` is answered by MSW in the browser; importing `@/mocks` from a feature fails
  lint; copying `.env.example` to `.env.local` is enough to run the app.

### T02 — Domain types and API schemas
- Zod schemas and inferred types in `src/domain`: org, shipment, leg, milestone, provenance
  (`Sourced<T>`), exception, alert, document, activity, `AiInsight<T>`, filters.
- **Done when:** every endpoint in 02 §5.2 has a response schema; types compile with no
  `any`.

### T03 — Mock database and seed data
- `Table<Row>`, `createDatabase(clock)`, `refresh()`, `persistIfChanged()` with revision,
  `reset()` keeping sessions (02 §5.5); `clock.ts` with offset (BR-TM-01).
- One file per table in `mocks/db/tables/` with the seed from 07 (relative dates, SD-01).
- **Done when:** a unit test creates the db, checks the counts in 07 (22 shipments,
  8 users…), mutates it in one instance and reads the change from a second instance after
  `refresh()`.

### T04 — Domain engine and unit tests
- `mocks/operators/`: one parser per format + mapping (BR-NM-01..05).
- `mocks/engine/`: milestone plan (BR-MS), status (BR-ST), ETA (BR-ETA), on-time (BR-OT),
  staleness (BR-SL), exceptions (BR-EX), next action (BR-NA), priority (BR-PR), alerts
  (BR-AL).
- `mocks/ai/`: summary, priority rationale, draft message, mapping suggestion, predicted
  ETA (BR-AI-01..05).
- Seeding runs the engine and replays past actions (SD-02, SD-03).
- **Done when:** unit tests cover at least one case per rule ID in 04; after seeding, the
  state of every shipment matches the "Shows" column of 07 §4.

### T05 — Mock API, API client and services
- `mocks/http.ts` (latency, failure injection, refresh/persist), `mocks/auth.ts`
  (sign-in, sessions, `requireUser`, `inPerimeter`, role checks BR-PM-03).
- One handler file per resource (02 §5.2) and the actions endpoint (BR-AC-*).
- `services/api-client.ts` (auth header from `sessionStorage`, Zod parsing, error classes,
  timeouts, `x-request-id`; 02 §5.6), one service module per resource, `query-keys.ts`,
  QueryClient retry policy.
- `lib/monitoring` with the console reporter (02 §5.8), wired to the query and mutation
  caches and to `api-client`.
- Failure modes in `withMockLatency` (02 §5.6), selectable per tab.
- **Done when:** integration tests with `msw/node` prove that each test user only gets
  their perimeter (US-01), that out-of-perimeter returns `404` and forbidden endpoints
  `403`, that each action changes the exception as in BR-AC, that a slow handler ends in
  `TimeoutError`, that queries retry twice and mutations never, and that a malformed
  response raises `ContractError` and is reported to monitoring.

## B. UI

### T06 — Design tokens, app shell, sign-in, profile
- Tokens and fonts from 03 §1.2 as CSS variables mapped to the Tailwind theme; shadcn/ui
  primitives restyled with them (03 §1.4).
- Status strip (DS-01), ink rail with counters (DS-02), mobile drawer, user menu, profile
  as manifest blocks (DS-03), split sign-in with the self-drawing transit line and test
  accounts, stamped states (UI-10), session guard, `401` handling.
- `app/(authenticated)/error.tsx`, `app/global-error.tsx`, `not-found.tsx`, a
  `SectionErrorBoundary` component, `ServiceUnavailable` in `MockProvider`, offline banner
  (02 §5.6).
- **Done when:** UI-01..UI-10 pass manually and every rule in 03 §1.1 holds; customer and
  ops can be signed in at the same
  time in two tabs (ADR-009); a component that throws on purpose shows the section
  fallback with the shell still visible, and the error appears in the console monitoring
  output.

### T07 — Shared shipment components
- SC-01..SC-08 (`ShipmentStatus`, `OnTimeIndicator`, `SourcedDate`, `TransitLine` compact
  and full, `ShipmentTimeline` with `ops` variant, `AnalystNote`, `LastUpdated`,
  `DocumentList`), plus `PageHeader`, `FieldBlock`, `Stamp`, `LoadingState`, `EmptyState`,
  `ErrorState`.
- **Done when:** the three provenance styles (DS-05) are clearly distinguishable; status
  never relies on colour alone; the transit line renders every route in 07 §4 (road only,
  multimodal with customs, booked, delivered); analyst-note footnotes highlight their
  source stop.

### T08 — Customer portal
- Arrivals agenda (CP-01..06, DS-09), shipment detail (CP-10..16), alerts (CP-20..23),
  toast on new alert (CP-31).
- **Done when:** each customer test account lands on what 07 §5 describes; no internal data
  is visible (CP-16).

### T09 — Attention queue and exception panel
- Triage rows (DS-08) with counters, filters, priority and primary action (OP-01..06); exception panel
  with AI explanation and history (OP-10); dialogs: notify customer with AI draft,
  contact operator, upload document (metadata only), acknowledge, resolve
  (OP-11..16).
- **Done when:** Marc Puig's queue matches 07 §5; notifying the customer on SH-10436 creates
  an alert that Diego Hernández sees; uploading the commercial invoice on SH-10438
  resolves `missing_document` automatically.

### T10 — Portfolio and ops shipment detail
- Portfolio board with filters from `/api/reference` and two-line mobile rows (OP-20..23);
  ops detail with Timeline (raw vs normalised), Exceptions, Documents, Activity tabs
  (OP-30).
- **Done when:** filters and sort are reflected in the URL; the raw BlueWave event is visible
  next to its normalised milestone on SH-10433; delivered shipments are listed last by
  default (OP-22).

### T11 — Realtime and simulator
- `RealtimeClient` with `BroadcastChannel` + local dispatch (02 §7), `useLiveUpdates`
  invalidating queries (BR-RT-*), simulator handlers and panel (OP-50..55), clock advance,
  network conditions selector with header warning chip.
- Relative times in the UI ("2 h ago", `LastUpdated`, strip clock offset) read the
  simulation clock (`GET /api/simulator/clock`) instead of the browser's `Date.now()`.
- **Done when:** SIM-01, 02, 03 and 05 produce exactly the outcomes in 07 §6, verified with
  customer and ops in two tabs; the scenario outcomes also run as integration tests.

## C. Delivery

### T12 — Polish pass
- Loading/empty/error states on every view (NFR-03), keyboard pass on menus and dialogs
  (NFR-04), 360 px check (NFR-01).
- Run every failure mode of 02 §5.6 from the simulator on the main views (NFR-08).
- **Done when:** no view breaks at 360 px, every view has its three states, and with
  *API down* every view shows a recoverable error instead of a blank or broken page.

### T13 — Deploy, README and review run
- Deploy to Vercel with `NEXT_PUBLIC_API_MOCKING=enabled`.
- Root `README.md`: what the product is (one paragraph), live URL, how to run locally
  (`.env.example`, scripts), test accounts and password (07 §2), how to use the simulator,
  project structure in short, links to `specs/` and `docs/write-up.md`.
- Run the review script below on the deployed URL.
- **Done when:** the script runs end to end without errors in the console, and someone new
  to the repo can run it locally following only the README.

### T14 — Write-up
- Complete `docs/write-up.md` (max 4 pages) from 01 §7, 02 §2/§5.7/§6.4, 01 §10–11 and the
  cut decisions actually taken.
- **Done when:** the three requested sections are complete and it fits in 4 pages.

## Should

### T15 — Status mappings page
- OP-40..42 with AI suggestion (BR-AI-04) and reprocessing (BR-NM-03); enables SIM-04.
- **Done when:** SIM-04 produces the outcome in 07 §6.

### T16 — Component and smoke tests
- Testing Library for `AnalystNote`, `TransitLine`, `ShipmentTimeline`, triage row;
  Playwright smoke of the review script.

### T17 — Extras
- "Mark all as read" (CP-22), board flip on live updates (DS-07, CP-30, OP-06, OP-24),
  queue keyboard shortcuts (OP-07) and the monitoring log in the simulator panel (OP-56).
- Until then, live changes are shown with the update dot only.
- OP-07 `Esc`: a confirmation toast is the topmost Radix layer, so today the first `Esc`
  after an action dismisses the toast and the second closes the exception panel (accepted
  in T09). Decide here whether `Esc` should close the panel directly.

## Review script (T13)

1. Tab 1: sign in as **Marc Puig** → attention queue with priorities and "Why #1?".
2. Open **SH-10436** (delay) → AI explanation → *Notify customer* → edit the AI draft → send.
3. Tab 2: sign in as **Diego Hernández** → the alert is there; open SH-10436: AI summary,
   ETA with provenance, AI prediction, multimodal timeline with customs.
4. Simulator → **SIM-01** → both tabs update: new `delay` in the queue, `late` alert for the
   customer.
5. Simulator → **SIM-02** → SH-10447 on hold in both tabs.
6. Tab 1: SH-10438 → *Upload document* (commercial invoice) → exception resolved
   automatically.
7. Tab 1: sign out, sign in as **Núria Vidal** → stale SH-10406; Simulator → **SIM-03** →
   SH-10421 becomes stale.
8. (If T15) Simulator → **SIM-04** → Status mappings → *Accept* → SH-10450 delivered.
9. Simulator → network *API down* → each view shows a recoverable error; back to *Normal*
   → *Retry* recovers.
10. Profile page for each role; sign out.
