# 02 — Architecture

Satisfies: [01-product-spec.md](01-product-spec.md). Governed by: [00-constitution.md](00-constitution.md).
Business rules: [04-domain-logic.md](04-domain-logic.md). Seed data: [07-seed-data.md](07-seed-data.md).

## 1. Stack

| Concern | Choice | Why |
|---------|--------|-----|
| Framework | **Next.js 15 (App Router)** | File-based routing and nested layouts map one-to-one to the two role areas; first-class on Vercel |
| Language | **TypeScript** (`strict`, `noUncheckedIndexedAccess`) | Domain model is the backbone; types are the contract between layers |
| Styling | **Tailwind CSS** | Fast iteration with a consistent token-based design |
| UI primitives | **shadcn/ui** (Radix) | Accessible primitives (dialog, popover, tabs) copied into the repo, no lock-in |
| Server state | **TanStack Query** | Caching, loading/error states, invalidation on live events |
| API mocking | **MSW 2** (Mock Service Worker) | Real `fetch` calls intercepted in the browser; the same handlers run in tests |
| Validation | **Zod** | API response schemas, shared by client and mock handlers; types inferred from them |
| Dates | **date-fns** | Small, tree-shakeable, relative formatting ("in 2 days") |
| Error boundaries | **react-error-boundary** | Section-level fallbacks with reset, on top of Next.js `error.tsx` (§5.6) |
| Icons | **lucide-react** | Consistent, tree-shakeable |
| Tests | **Vitest** + Testing Library + `msw/node` | Unit tests for engine; integration tests of services against the real handlers |
| Lint/format | ESLint (`next/core-web-vitals`) + Prettier | Plus import boundary rules (§3.3) |

Intentionally **not** used: global state libraries (Zustand/Redux): server state lives in
TanStack Query, session in a small context, UI state in components or URL params. Also no
map library: a schematic route bar shows the legs well enough for Phase 1.

## 2. Key decision: how the backend is simulated

Phase 1 ships without a backend (it arrives in Phase 2). The frontend must still behave
exactly as it will against a real API.

**Decision (ADR-001, ADR-002):** the frontend talks to a real REST API over `fetch`. In
Phase 1 that API is served by **MSW handlers running in the browser**: the service worker
intercepts requests to `/api/*` and answers from an in-memory database.

```
features ─► services (fetch) ─► /api/* ─┬─► Phase 1: MSW worker ─► mocks/handlers ─► mocks/db
                                        └─► Phase 2: real backend
```

Why not Next.js Route Handlers: they would be a server-side component, and Vercel
serverless instances don't share memory, so mutable state (resolve exception, upload
document, simulated events) would be lost or inconsistent across requests.

Consequences:
- Requests are real and visible in DevTools → Network; status codes, serialisation and
  error handling are exercised from day one.
- Switching to the real backend is configuration (§5.7). No feature or service code changes.
- The handlers double as an executable specification of the API for the backend team.

## 3. Layers

```
┌──────────────────────────────────────────────────────────┐
│ app/            Routes, layouts, role guards (thin)      │
├──────────────────────────────────────────────────────────┤
│ features/       UI + hooks per feature                   │
├──────────────────────────────────────────────────────────┤
│ services/       API client, one module per resource      │◄── features use ONLY this
├─────────────────────────── HTTP ─────────────────────────┤
│ mocks/          MSW handlers + db + simulated backend    │◄── Phase 1 only, replaceable
├──────────────────────────────────────────────────────────┤
│ domain/         Types, Zod schemas, pure UI rules        │◄── no React, no IO
└──────────────────────────────────────────────────────────┘
        components/ui (design system) · lib (generic utils)
```

### 3.1 Responsibilities

| Layer | Owns | Must not |
|-------|------|----------|
| `app/` | URL structure, layouts, metadata, role guards | Fetch data directly, contain business logic |
| `features/` | Feature components, query hooks, view models | Call `fetch` directly, import from `mocks/` |
| `services/` | HTTP client, one module per API resource, errors, query keys, realtime client | Contain React components or business rules |
| `mocks/` | Everything the real backend will own: handlers, database and seeds, auth and perimeter, normalisation, exception detection, ETA prediction, AI outputs, event publishing | Be imported by app code other than the mock bootstrap |
| `domain/` | Canonical types, API Zod schemas, pure UI-side derivations (labels, provenance badges) | Depend on any other layer |

**Rule of thumb:** if the real backend will compute it, it lives in `mocks/`. When the
mock is switched off, that logic moves to the backend and nothing in the frontend breaks.

### 3.2 Dependency direction

`app → features → services → domain`, and `mocks → domain`.
`services` and `mocks` never import each other: they only meet over HTTP.

### 3.3 Enforced with ESLint

```js
// eslint.config.mjs (excerpt)
'no-restricted-imports': ['error', {
  patterns: [
    { group: ['@/mocks', '@/mocks/*'],
      message: 'Mocks are only reachable over HTTP. Use "@/services".' },
  ],
}],
// overrides: allowed in src/mocks/** and src/app/mock-provider.tsx
```

## 4. Folder structure

```
public/
└─ mockServiceWorker.js             # generated by `msw init`, served statically

src/
├─ app/
│  ├─ layout.tsx                    # Providers (Mock, Query, Session), fonts
│  ├─ mock-provider.tsx             # Starts MSW before rendering when mocking is enabled
│  ├─ page.tsx                      # Redirects by session/role (03-app-shell §2)
│  ├─ sign-in/page.tsx              # Sign-in (US-00, UI-06/07)
│  └─ (authenticated)/
│     ├─ layout.tsx                 # Session guard + AppShell (UI-01..05, UI-09)
│     ├─ profile/page.tsx           # Read-only profile (UI-08)
│     ├─ portal/                    # Customer area
│     │  ├─ layout.tsx              # Role guard
│     │  ├─ page.tsx                # My shipments (US-C-01)
│     │  ├─ shipments/[id]/page.tsx # Detail (US-C-02..05)
│     │  └─ alerts/page.tsx         # Notification centre (US-C-04)
│     └─ ops/                       # Operations area
│        ├─ layout.tsx              # Role guard
│        ├─ page.tsx                # Attention queue (US-O-01)
│        ├─ shipments/page.tsx      # Portfolio (US-O-02)
│        ├─ shipments/[id]/page.tsx # Detail + raw events (US-O-04)
│        └─ mappings/page.tsx       # Unmapped statuses (US-O-05)
│
├─ features/
│  ├─ shell/          AppShell, header, sidebar, user menu, navigation per role
│  ├─ session/        sign-in form, test accounts hint, profile, SessionProvider, useSession
│  ├─ shipments/      list, filters, card, timeline, route bar, provenance badge
│  ├─ exceptions/     attention queue, exception panel, action dialogs
│  ├─ alerts/         notification centre, alert toast
│  ├─ documents/      document list, upload dialog
│  ├─ ai/             AiInsight card (label + confidence + evidence), summary, ETA prediction
│  ├─ realtime/       useLiveUpdates (subscribes and invalidates queries)
│  └─ simulator/      event simulator panel (non-production only)
│     each feature:  components/  hooks/  index.ts (public API)
│
├─ services/                        # API client, one module per resource
│  ├─ api-client.ts       fetch wrapper: base URL, auth header, JSON, errors, Zod parsing
│  ├─ errors.ts           ApiError hierarchy
│  ├─ query-keys.ts       central TanStack Query keys
│  ├─ auth.service.ts
│  ├─ shipments.service.ts
│  ├─ exceptions.service.ts
│  ├─ alerts.service.ts
│  ├─ documents.service.ts
│  ├─ ai.service.ts
│  ├─ mappings.service.ts
│  ├─ reference.service.ts
│  ├─ simulator.service.ts
│  ├─ realtime/
│  │  ├─ realtime-client.ts      interface + factory (by env)
│  │  ├─ broadcast-channel.ts    Phase 1 transport
│  │  └─ event-source.ts         Phase 2 transport (SSE)
│  └─ index.ts
│
├─ mocks/                           # Phase 1 mock backend. Delete-able as a whole.
│  ├─ browser.ts          setupWorker(...handlers)
│  ├─ node.ts             setupServer(...handlers) for Vitest
│  ├─ handlers/           one file per API resource
│  │  ├─ auth.handlers.ts
│  │  ├─ shipments.handlers.ts
│  │  ├─ exceptions.handlers.ts
│  │  ├─ alerts.handlers.ts
│  │  ├─ documents.handlers.ts
│  │  ├─ ai.handlers.ts
│  │  ├─ mappings.handlers.ts
│  │  ├─ reference.handlers.ts
│  │  ├─ simulator.handlers.ts
│  │  └─ index.ts
│  ├─ db/                 mock database (see §5.5)
│  │  ├─ tables/          one file per table: row type + seed
│  │  │  ├─ users.ts
│  │  │  ├─ sessions.ts
│  │  │  ├─ user-sites.ts
│  │  │  ├─ accounts.ts
│  │  │  ├─ sites.ts
│  │  │  ├─ operators.ts
│  │  │  ├─ shipments.ts
│  │  │  ├─ legs.ts
│  │  │  ├─ raw-events.ts
│  │  │  ├─ status-mappings.ts
│  │  │  ├─ exceptions.ts
│  │  │  ├─ activity.ts
│  │  │  ├─ alerts.ts
│  │  │  ├─ documents.ts
│  │  │  └─ simulator.ts
│  │  ├─ table.ts         generic Table<Row> helper
│  │  └─ database.ts      creates, persists and resets the db
│  ├─ mappers/            row → API response, one per resource
│  ├─ operators/          raw formats + normaliser per operator
│  ├─ engine/             exception detection, ETA, staleness, priority scoring
│  ├─ ai/                 mock AI generators (summary, rationale, drafts, mapping)
│  ├─ realtime/           event publisher + scenario engine
│  ├─ auth.ts             token → user, perimeter helpers
│  ├─ http.ts             handler helpers: latency, failure injection, error responses
│  └─ clock.ts            simulation clock (relative dates)
│
├─ domain/
│  ├─ shipment.ts     Shipment, Leg, Milestone, enums + Zod schemas
│  ├─ exception.ts    Exception, ExceptionType, NextAction
│  ├─ provenance.ts   Provenance, Sourced<T>
│  ├─ ai.ts           AiInsight<T>
│  ├─ org.ts          Site, Account, Operator, User, Role, Perimeter
│  └─ rules/          pure derivations used by UI (on-time indicator, labels)
│
├─ components/ui/     shadcn primitives + shared building blocks (EmptyState, ErrorState)
└─ lib/               cn(), date formatting, generic helpers
   └─ monitoring/     Monitoring interface + console reporter (Phase 2: sentry reporter)
```

Naming: files `kebab-case`, components `PascalCase`, hooks `useX`, named exports only,
each feature exposes its public API through `index.ts`. A resource uses the same name in
`services/<resource>.service.ts` and `mocks/handlers/<resource>.handlers.ts`.

## 5. API layer

### 5.1 Principles
1. **The API is the contract.** Endpoints (§5.2) and their Zod schemas in `domain/` are
   the single source of truth. Services parse every response with them; handlers build
   responses that satisfy them. A drift fails loudly in development and tests.
2. **One module per resource** on both sides of the wire, with matching names.
3. **Authenticated like production.** Services send `Authorization: Bearer <token>`.
   Handlers resolve the user from the token and enforce the perimeter (US-01, P5).
   Callers never pass the user.
4. **HTTP semantics.** Proper methods and status codes (`401`, `404`, `422`, `503`);
   out-of-perimeter resources answer `404` (no information leak).
5. **No mock knowledge outside `mocks/`.** Services only know a base URL.

### 5.2 Endpoints

| Resource | Endpoint | Spec |
|----------|----------|------|
| auth | `POST /api/auth/sign-in` `{ email, password }` → `{ token, user }`, `POST /api/auth/sign-out`, `GET /api/auth/me` | US-00 |
| shipments | `GET /api/shipments?view&status&onTime&site&operator&mode&scope&q`, `GET /api/shipments/:id`, `GET /api/shipments/:id/timeline`, `GET /api/shipments/:id/raw-events`, `GET /api/shipments/:id/activity` | US-C-01/02, US-O-02/04 |
| exceptions | `GET /api/exceptions?status&type&site&operator&mode&shipmentId`, `GET /api/exceptions/:id`, `POST /api/exceptions/:id/actions` | US-O-01/03 |
| alerts | `GET /api/alerts?shipmentId`, `POST /api/alerts/:id/read`, `POST /api/alerts/read-all` | US-C-04 |
| reference | `GET /api/reference` → sites, operators, accounts within the perimeter (filter options) | US-O-01/02 |
| documents | `GET /api/shipments/:id/documents`, `POST /api/shipments/:id/documents` (multipart), `GET /api/documents/:id/file` | US-C-05, US-O-03 |
| ai | `GET /api/ai/shipments/:id/summary`, `GET /api/ai/shipments/:id/eta-prediction`, `GET /api/ai/exceptions/:id/priority`, `POST /api/ai/exceptions/:id/draft-message`, `GET /api/ai/raw-events/:id/mapping-suggestion` | AI-1..5 |
| mappings | `GET /api/mappings/unmapped`, `POST /api/mappings` | US-O-05 |
| simulator | `GET /api/simulator/scenarios`, `POST /api/simulator/scenarios/:id/run`, `GET /api/simulator/clock`, `POST /api/simulator/clock` `{ hours }`, `POST /api/simulator/reset` | US-R-02 (non-production only) |

Role permissions per endpoint follow BR-PM-03 in [04-domain-logic.md](04-domain-logic.md):
endpoints a role can never use answer `403`; resources outside the perimeter answer `404`.

`POST /api/exceptions/:id/actions` takes `{ type: 'notify_customer' | 'contact_operator' |
'upload_document' | 'acknowledge' | 'resolve', payload }`, so every action goes through one
audited endpoint and lands in the activity log.

### 5.3 Client side (`services/`)

```ts
// services/api-client.ts — the only place that calls fetch
export async function apiGet<T>(path: string, schema: z.ZodType<T>): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, { headers: authHeaders() })
  if (!response.ok) throw await toApiError(response)
  return schema.parse(await response.json())
}
// apiPost, apiUpload follow the same shape
```

```ts
// services/shipments.service.ts — one module per resource
import { shipmentSchema, shipmentListSchema, type ShipmentFilters } from '@/domain'

export const shipmentsService = {
  list: (filters: ShipmentFilters = {}) =>
    apiGet(`/shipments${toQueryString(filters)}`, shipmentListSchema),
  getById: (id: string) => apiGet(`/shipments/${id}`, shipmentSchema),
  getTimeline: (id: string) => apiGet(`/shipments/${id}/timeline`, timelineSchema),
  getRawEvents: (id: string) => apiGet(`/shipments/${id}/raw-events`, rawEventListSchema),
}
```

```ts
// features/shipments/hooks/use-shipment.ts — features only see services
export function useShipment(id: string) {
  return useQuery({
    queryKey: queryKeys.shipments.detail(id),
    queryFn: () => shipmentsService.getById(id),
  })
}
```

Data fetching happens in client components through TanStack Query, so every request
goes through the browser where the worker intercepts it.

### 5.4 Mock side (`mocks/`)

```ts
// mocks/handlers/shipments.handlers.ts — reads like a controller
export const shipmentsHandlers = [
  http.get('/api/shipments', withMockLatency(({ request }) => {
    const user = requireUser(request)                  // 401 if no/invalid token
    const filters = parseFilters(new URL(request.url))
    const rows = db.shipments.where(inPerimeter(user))
    return HttpResponse.json(rows.map(toShipmentResponse).filter(matches(filters)))
  })),

  http.get('/api/shipments/:id', withMockLatency(({ request, params }) => {
    const user = requireUser(request)
    const row = db.shipments.findById(String(params.id))
    if (!row || !inPerimeter(user)(row)) return notFound()   // US-01
    return HttpResponse.json(toShipmentResponse(row))
  })),
]
```

```ts
// mocks/http.ts — every handler behaves like a real network call
export function withMockLatency<R extends HttpResponseResolver>(resolver: R): R {
  return (async (info) => {
    await delay(randomBetween(150, 400))   // NFR-05
    if (shouldFail(info.request)) return serviceUnavailable()
    database.refresh()                     // pick up writes from other tabs (§5.5)
    const response = resolver(info)        // synchronous: no await between refresh and persist
    database.persistIfChanged()            // snapshot + revision bump after mutations
    return response
  }) as R
}
```

```tsx
// app/mock-provider.tsx — start the worker before the first request
export function MockProvider({ children }: PropsWithChildren) {
  const [ready, setReady] = useState(!MOCKING_ENABLED)
  useEffect(() => {
    if (!MOCKING_ENABLED) return
    import('@/mocks/browser')                // dynamic: excluded from the bundle when off
      .then(({ worker }) => worker.start({ onUnhandledRequest: 'bypass' }))
      .then(() => setReady(true))
      .catch(error => {                       // e.g. service workers blocked by the browser
        monitoring.captureException(error, { tags: { area: 'mock-api' } })
        setFailed(true)
      })
  }, [])
  if (failed) return <ServiceUnavailable onRetry={() => location.reload()} />
  return ready ? children : <AppSplash />
}
```

Other mock modules:
- **Clock** (`clock.ts`): seeds define dates as offsets from "now"
  (`hoursAgo(6)`, `daysFromNow(3)`), so seeded environments always look current (NFR-02).
- **Auth** (`auth.ts`): `sign-in` looks the email up in `users` and checks the password;
  on success it issues an opaque token, on failure answers `401` with a generic message.
  `requireUser(request)` resolves the token; `inPerimeter(user)` filters by account or
  sites. Seeded users share one non-production password (`MOCK_USER_PASSWORD` in
  `mocks/auth.ts`); there is no password column, because in Phase 2 credentials live in
  the identity provider (OIDC), never in the app's database.
- **Operators** (`operators/`): each operator has a raw payload type and a normaliser
  `(raw) => Milestone | Unmapped`. Shipments are built from raw events, not hand-written
  milestones, which demonstrates the normalisation value (G-1) and enables the "raw vs
  normalised" ops view.
- **Engine** (`engine/`): pure functions, unit tested:
  `detectExceptions(shipment, now)`, `computeStaleness(shipment, now)`,
  `predictEta(shipment, history)`, `scorePriority(exception, context)`.
- **AI** (`ai/`): deterministic generators built from shipment data only (P1). Each
  returns an `AiInsight` envelope (§6.3) with confidence and evidence.
- **Realtime** (`realtime/`): the scenario engine inserts raw events, re-runs the engine
  and publishes `ShipmentUpdated`, `ExceptionRaised` and `AlertCreated` (§7).

### 5.5 Mock database

The mock behaves like a backend with a relational database: tables are typed arrays,
handlers act as API controllers on top of them.

```
tables/*.ts (seeds) ──(createDatabase)──► db (in-memory tables) ◄──► localStorage snapshot
                                               ▲
   handlers/*.ts: latency → auth/perimeter → query/join → mapper → HttpResponse.json
```

#### Rules
1. **Normalised tables, one per entity.** Relations by foreign key (`accountId`,
   `shipmentId`), never nested objects. Role is a column of `users`, not one array per role.
2. **One file per table.** `db/tables/<table>.ts` holds the row type and its seed, so an
   entity's storage shape and data are reviewed together.
3. **Row types ≠ API types.** Row types define what is *stored*; `domain/` defines what
   the *API returns*. Mappers translate rows into responses (joins, derived fields).
   When the backend arrives, rows and mappers disappear; the domain types stay.
4. **Store facts, derive the rest.** Persist what a backend would persist (raw events,
   legs, exceptions with their lifecycle). Compute milestones, status, ETA and on-time
   indicator on read through `engine/`, as a backend view would.
5. **Seeds are immutable.** `createDatabase(clock)` deep-copies seeds into tables. Handlers
   only touch the db, never the seed arrays. `reset()` rebuilds from seeds.
6. **Responses are copies by construction.** Responses are serialised to JSON over the
   (intercepted) wire, so UI code can never mutate the db by reference.
7. **Readable, stable IDs.** Prefixed per table (`usr_001`, `shp_014`), so data is easy to
   follow in logs and tests.

#### Tables

| Table | Key columns | Notes |
|-------|-------------|-------|
| `users` | id, name, email, role, accountId? | `accountId` only for `customer` |
| `sessions` | id (token), userId, createdAt | Issued by sign-in; survives reloads and reset |
| `userSites` | userId, siteId | Perimeter of `ops_agent`; `ops_manager` sees all |
| `accounts` | id, name, type (`customer` \| `subsidiary`), country, tier (`key` \| `standard`) | tier feeds BR-PR-01 |
| `sites` | id, name, type (`factory` \| `warehouse`), city, country | |
| `operators` | id, name, mode, format, delayFactors | `format` selects the normaliser; `delayFactors` feeds BR-AI-05 |
| `shipments` | id, reference, accountId, originSiteId, destination, plannedEta | `plannedEta` = committed delivery date |
| `legs` | id, shipmentId, sequence, mode, operatorId, from, to, plannedDeparture, plannedArrival, trackingNumber, vessel? | |
| `rawEvents` | id, legId, operatorId, payload, receivedAt, mappingStatus (`mapped` \| `unmapped`) | `payload` in the operator's own format |
| `statusMappings` | id, operatorId, rawCode, target | target: milestone, `eta_update`, `position_update`, `ignore` (BR-NM-01) |
| `exceptions` | id, shipmentId, type, severity, status, waitingOn?, assigneeId?, detectedAt, resolvedAt?, resolutionNote? | Upserted by `engine/` (BR-EX-06) |
| `activity` | id, shipmentId, exceptionId?, userId?, type, payload, at | Actions and automatic resolutions |
| `alerts` | id, shipmentId, accountId, type, title, message, etaImpact?, requiresAction, createdAt, readAt? | BR-AL-* |
| `documents` | id, shipmentId, type, status, fileName?, size?, uploadedBy?, uploadedAt? | |
| `simulator` | id, clockOffsetHours, scenariosRun | Single row; non-production |

#### Sketch

```ts
// mocks/db/tables/users.ts — stored shape + seed, plain typed array
export interface UserRow {
  id: string
  name: string
  email: string
  role: Role
  accountId: string | null
}

export const usersSeed: UserRow[] = [
  { id: 'usr_001', name: 'Laura Gómez', email: 'laura.gomez@albaretail.test', role: 'customer', accountId: 'acc_001' },
  { id: 'usr_010', name: 'Marc Puig', email: 'marc.puig@corvane.test', role: 'ops_agent', accountId: null },
]
```

```ts
// mocks/db/table.ts — tiny generic helper, no query language
export class Table<Row extends { id: string }> {
  constructor(private rows: Row[]) {}
  all(): Row[] { return this.rows }
  findById(id: string): Row | undefined { return this.rows.find(r => r.id === id) }
  where(predicate: (row: Row) => boolean): Row[] { return this.rows.filter(predicate) }
  insert(row: Row): Row { this.rows.push(row); return row }
  update(id: string, patch: Partial<Row>): Row { /* merge or throw */ }
}
```

#### Persistence and multiple tabs
One service worker serves every tab, but MSW runs the handlers in each tab's page context,
so each tab holds its own in-memory copy of the db. To behave like one shared database:

- The snapshot lives in `localStorage` under a versioned key (`shipment-db:v1`) with a
  `revision` counter; a missing or older schema version reseeds.
- Before handling a request, `database.refresh()` reloads the snapshot if its revision is
  newer than the tab's copy. After a mutation, `persistIfChanged()` writes it back with
  `revision + 1`.
- Handlers are synchronous between refresh and persist, so a tab never writes on top of
  a stale copy (no lost updates when customer and ops act at the same time).
- `reset()` reseeds every table except `sessions`, so nobody is signed out by a reset.

### 5.6 Errors, timeouts and resilience

#### Error classes

```ts
class ApiError extends Error { constructor(readonly status: number, readonly code: string) {} }
class UnauthorizedError extends ApiError {}   // 401 → back to sign-in
class ForbiddenError extends ApiError {}      // 403, role can't use this endpoint (BR-PM-03)
class NotFoundError extends ApiError {}       // 404, also out-of-perimeter (US-01)
class ConflictError extends ApiError {}       // 409, e.g. action on a resolved exception
class ValidationError extends ApiError {}     // 422
class UnavailableError extends ApiError {}    // 5xx, network error, injected failures
class TimeoutError extends UnavailableError {} // no response within the timeout
class ContractError extends ApiError {}       // response doesn't match its Zod schema
```

`api-client.ts` is the only place that creates them: it maps status codes, aborted
requests and schema parse failures to these classes.

#### Timeouts

- Every request carries `AbortSignal.timeout(ms)`: **10 s** by default, **30 s** for
  uploads. An expired request becomes a `TimeoutError`.
- Requests are also aborted when the component that started them unmounts (TanStack Query
  passes its `signal` to `fetch`), so navigating away never leaves requests hanging.

#### Retries

| Kind | Retries | Why |
|------|---------|-----|
| Queries with `UnavailableError` / `TimeoutError` | 2, exponential back-off (1 s, 2 s) | Transient failures recover on their own |
| Queries with any other error | none | A 401/403/404/409/422 won't change by retrying |
| Mutations (actions, uploads, sign-in) | none, automatically | Never repeat a side effect without the user; the dialog shows the error and a *Try again* button |

#### Where errors are shown

| Failure | Handled by | User sees |
|---------|-----------|-----------|
| A query fails (data can't load) | the component, via `ErrorState` | Inline message with *Retry*; the rest of the page keeps working |
| A mutation fails | the dialog or form | Inline error, input preserved (OP-16) + toast |
| An AI request fails | `AnalystNote` | The note is hidden (SC-06) |
| A badge or counter fails | sidebar / header | The badge is hidden, never an error |
| A render error in a page | `app/(authenticated)/error.tsx` | Shell stays visible; the content area shows "Something went wrong" with *Try again* and *Go home* |
| A render error in the root layout | `app/global-error.tsx` | Full-page fallback with *Reload* |
| Unknown route or `NotFoundError` on a detail page | `not-found.tsx` / CP-15 | "Not found" with a link back |
| `UnauthorizedError` anywhere | `api-client` | Session cleared, redirect to sign-in (UI-09) |
| The mock API can't start (MSW worker fails) | `MockProvider` | Splash with "The service is unavailable" and *Retry*, instead of a blank page |
| The browser goes offline | `useOnlineStatus` in the shell | Banner "You are offline. Data may be outdated." Queries pause and resume when back online |

Section-level error boundaries (`react-error-boundary`) wrap independent blocks of a
page (AI card, timeline, documents), so one broken block never takes the page down.

#### Simulating failures

The simulator panel (OP-55) can switch the mock API into failure modes, persisted per
tab, to verify every row of the table above:

| Mode | Effect in `withMockLatency` |
|------|-----------------------------|
| Normal | 150–400 ms latency |
| Slow network | 3–8 s latency |
| Timeouts | 15 s latency → client `TimeoutError` |
| Flaky | 30 % of requests answer `503` |
| API down | every request answers `503` |

### 5.7 Configuration and path to production

| Variable | Phase 1 | Phase 2 |
|----------|---------|---------|
| `NEXT_PUBLIC_API_MOCKING` | `enabled` (also on the Vercel deployment) | `disabled` |
| `NEXT_PUBLIC_API_URL` | `/api` | backend URL |
| `NEXT_PUBLIC_REALTIME` | `broadcast-channel` | `sse` |
| `NEXT_PUBLIC_MONITORING` | `console` (see §5.8) | `sentry` |
| `NEXT_PUBLIC_SENTRY_DSN` | — | project DSN |

Steps:
1. Backend implements the endpoints in §5.2 using `domain/` schemas as the contract
   (optionally exported as OpenAPI with `zod-to-openapi`).
2. Flip the variables above. No changes in `features/` or `services/`.
3. Replace the mock token with real auth (OIDC); perimeter is enforced by the backend.
4. Move `mocks/{operators,engine,ai}` logic to the backend ingestion and AI pipelines.
5. Keep `mocks/` for local development, tests and Storybook; the simulator endpoints are
   never exposed in production.
6. Switch monitoring to Sentry (§5.8): install `@sentry/nextjs` and implement the
   `sentry` reporter. No other code changes.

### 5.8 Monitoring (simulated Sentry)

All error reporting goes through one small interface, so Phase 1 logs locally and
Phase 2 sends the same events to Sentry.

```ts
// lib/monitoring/monitoring.ts
export interface Monitoring {
  captureException(error: unknown, context?: MonitoringContext): void
  captureMessage(message: string, level: 'info' | 'warning' | 'error', context?: MonitoringContext): void
  addBreadcrumb(breadcrumb: { category: string; message: string; data?: Record<string, unknown> }): void
  setUser(user: { id: string; role: Role } | null): void
}
export const monitoring: Monitoring = createMonitoring(process.env.NEXT_PUBLIC_MONITORING)
```

| Reporter | Phase | Behaviour |
|----------|-------|-----------|
| `console` | 1 | Structured `console.error` / `console.info` with a `[monitoring]` prefix, plus an in-memory ring buffer of the last 100 events, viewable in the simulator panel (OP-56) |
| `sentry` | 2 | Forwards to `@sentry/nextjs` (`captureException`, breadcrumbs, user, release) |

**What is reported:**

| Event | Level | Where it is captured |
|-------|-------|----------------------|
| Render errors | error | `error.tsx`, `global-error.tsx`, section error boundaries |
| `UnavailableError`, `TimeoutError` after the last retry | error | TanStack Query `QueryCache` / `MutationCache` `onError` |
| `ContractError` (response breaks its schema) | error | `api-client` — always a bug, never expected |
| MSW worker failing to start | error | `MockProvider` |
| Unhandled promise rejections | error | `window.onunhandledrejection` in the root provider |
| Expected API errors (`401`, `403`, `404`, `409`, `422`) | breadcrumb only | `api-client` — they are business outcomes, not incidents |
| Navigation, sign-in/out, actions executed | breadcrumb | router, session, action hooks |

**Context attached to every event:** user id and role (never name or e-mail, no PII),
route, request method + path + status, request id (`x-request-id` header generated by
`api-client` and echoed by the handlers), app version.

`monitoring` lives in `lib/` because it is client infrastructure, not part of the mock
backend: it stays in Phase 2 with a different reporter.

## 6. Domain model

### 6.1 Entities

```
Account 1─* Shipment *─1 Site (origin)
Shipment 1─* Leg *─1 Operator
Leg 1─* Milestone ◄── normalised from ── RawEvent (per operator format)
Shipment 1─* Exception 1─* NextAction
Shipment 1─* Document
Shipment 1─* ActivityEntry
User ─ Role + Perimeter (accountIds | siteIds | all)
```

### 6.2 Core types (sketch)

Types are inferred from Zod schemas (`type Shipment = z.infer<typeof shipmentSchema>`);
shown here as plain TypeScript for readability.

```ts
type Mode = 'road' | 'sea'
type ShipmentStatus =
  | 'booked' | 'in_transit' | 'at_port' | 'in_customs'
  | 'on_hold' | 'out_for_delivery' | 'delivered'
type OnTimeIndicator = 'on_time' | 'at_risk' | 'late' | 'unknown'

type MilestoneType =
  | 'picked_up' | 'departed_site' | 'arrived_port' | 'loaded_on_vessel'
  | 'vessel_departed' | 'vessel_arrived' | 'discharged'
  | 'customs_submitted' | 'customs_cleared' | 'customs_hold'
  | 'out_for_delivery' | 'delivered'

type Provenance = 'confirmed' | 'estimated' | 'predicted'

interface Sourced<T> {
  value: T
  provenance: Provenance
  source: string        // operator id, 'system' or 'ai'
  observedAt: string    // ISO
}

interface Milestone {
  id: string
  legId: string
  type: MilestoneType
  planned?: Sourced<string>
  actual?: Sourced<string>
  rawEventId?: string   // traceability to operator data (P1)
}

interface Shipment {
  id: string
  reference: string
  accountId: string
  originSiteId: string
  destination: { city: string; country: string; international: boolean }
  legs: Leg[]
  status: ShipmentStatus
  eta: Sourced<string> | null   // null = unknown, never invented
  plannedEta: string
  lastEventAt: string
}

type ExceptionType = 'delay' | 'hold' | 'stale' | 'customs_incident' | 'missing_document'
type NextActionType = 'notify_customer' | 'contact_operator' | 'upload_document'
```

### 6.3 AI output envelope

Every AI result shares one shape so the UI renders them consistently (P3):

```ts
interface AiInsight<T> {
  kind: 'summary' | 'eta_prediction' | 'priority' | 'draft' | 'mapping'
  content: T
  confidence: number          // 0..1, rendered as low / medium / high
  evidence: string[]          // facts used, e.g. "Vessel departed 18 h late"
  generatedAt: string
  model: string               // 'mock-v1' in Phase 1
}
```

UI component `AnalystNote` (SC-06, DS-06) always shows: kind, confidence, the evidence as
footnotes linked to their source, and for actionable insights, explicit use / edit /
dismiss buttons.

### 6.4 AI in Phase 2

| Feature | Phase 2 approach |
|---------|------------------|
| AI-1 Summary | LLM with a grounded prompt built only from normalised shipment data; output checked against source facts before display |
| AI-2 Prioritisation | Scoring model trained on historical exceptions and resolution outcomes; LLM writes the rationale from the scoring features |
| AI-3 Drafted message | LLM with per-account tone, from incident data; always human-approved before sending |
| AI-4 Normalisation assist | LLM / embedding classifier over the canonical vocabulary; accepted suggestions feed the mapping table |
| AI-5 Predicted ETA | Regression on historical leg durations per operator, lane and season, with confidence intervals |

The `/api/ai/*` endpoints stay the same; only what answers them moves server-side.

## 7. Real-time & freshness (US-R-01)

Live updates are push, not request/response, so they use their own small client with
two transports behind one interface:

```ts
// services/realtime/realtime-client.ts
export interface RealtimeClient {
  subscribe(handler: (event: DomainEvent) => void): () => void
}
// Phase 1: BroadcastChannel('shipment-events') · Phase 2: EventSource('/api/events')
```

```
Any mutation (action, upload, simulator) ─► handler writes db ─► engine.recompute()
          ─► publish(event) ─┬─► local dispatch        (the tab that made the change)
                             └─► BroadcastChannel      (every other tab)
                                          │
           useLiveUpdates() ◄── RealtimeClient.subscribe
                 │
  queryClient.invalidateQueries(affected keys) ─► refetch through the API (perimeter applies)
```

- Views don't poll; they react to events (same model as SSE in production).
- `BroadcastChannel` does not deliver to the sender, so `publish()` also dispatches
  locally. Every tab, including the one that made the change, gets each event exactly once.
- **Events are thin:** `{ type, shipmentId, exceptionId?, alertId? }`, with no business
  data. Every tab receives every event, but a customer tab only *refetches*, and the API
  returns only what its user may see. Toasts are raised from the refetched data (e.g. a
  new unread alert), never from the event itself, so nothing leaks across perimeters.
  In Phase 2 the SSE stream is filtered by the backend; the client code is the same.
- Staleness is computed against the simulation clock, so "operator silence" scenarios
  show the `stale` exception without waiting real hours.

## 8. Routing & access

- Shell, sign-in and profile behaviour is specified in [03-app-shell.md](03-app-shell.md).
- `portal/layout.tsx` and `ops/layout.tsx` are client guards that redirect to the
  user's own area if the session role doesn't match. This is a UX guard only; the
  perimeter check lives behind the API (P5).
- **Sessions are per tab.** The token is kept in `sessionStorage`, so a customer and an
  ops user can be signed in side by side in two tabs of the same browser. Signing in or
  out in one tab doesn't affect the other; a reload keeps the tab's session. (In Phase 2
  the token storage follows the identity provider's guidance; the client only reads it
  through `services/api-client.ts`.)
- A `401` from any request clears the tab's session and redirects to sign-in.
- Filters live in URL search params so views are shareable and back-button friendly.

## 9. UI guidelines

- Design language, tokens and signature patterns (DS-01..DS-10): [03-app-shell.md](03-app-shell.md) §1.
- Status always shown as icon + text + colour (NFR-04).
- Provenance uses typography (DS-05): confirmed regular, estimated `≈`, predicted `~`
  italic in cobalt with its AI tag. Applied to timeline stops, ETAs and tables.
- One shared `TransitLine` and `ShipmentTimeline` for both roles; ops adds a raw events
  column.
- Every data view has skeleton, empty and error states (NFR-03, UI-10).

## 10. Testing strategy

| Level | Scope | Tool |
|-------|-------|------|
| Unit | `domain/rules`, `mocks/{operators,engine,ai}` | Vitest |
| Integration | `services/*` against the real handlers: perimeter (US-01), actions, error mapping, timeouts and retries (failure modes from §5.6) | Vitest + `msw/node` |
| Component | `AnalystNote`, `TransitLine`, `ShipmentTimeline`, triage row | Testing Library |
| Smoke (optional) | Sign in → queue → resolve exception | Playwright |

## 11. Decision log (ADRs)

| ID | Decision | Alternatives | Reason |
|----|----------|--------------|--------|
| ADR-001 | Mock backend runs in the browser | Next.js Route Handlers with in-memory state | Phase 1 has no server-side component; serverless instances don't share memory, so state would be inconsistent |
| ADR-002 | Real HTTP client + MSW handlers as the mock seam | Service interfaces with mock implementations and a registry | Exercises real `fetch`, status codes and serialisation; handlers document the API for the backend; same handlers in tests; switching to the backend is configuration |
| ADR-003 | Build shipments from raw operator events | Hand-written normalised fixtures | Demonstrates normalisation (core value) and enables raw vs normalised view |
| ADR-004 | TanStack Query for server state | SWR, plain context | Invalidation-by-key fits the real-time event model |
| ADR-005 | Relative-date fixtures with a simulation clock | Static dates | Seeded environments never look stale |
| ADR-006 | Uniform `AiInsight` envelope | Ad-hoc shapes per feature | Consistent, honest presentation of AI |
| ADR-007 | Mock db as normalised typed arrays + `Table` helper, rows separate from API types | In-browser databases (PGlite, sql.js, Dexie), `@mswjs/data` | ~22 shipments need no query engine; zero dependencies and bundle cost; row/API split keeps the contract independent from storage |
| ADR-008 | Realtime behind `RealtimeClient`: `BroadcastChannel` now, SSE later | Polling, mocking SSE through MSW | Push model identical to production; syncs tabs for free; trivial transport swap |
| ADR-009 | Per-tab sessions (`sessionStorage`), shared db (`localStorage` + revision) | Shared session in `localStorage`; cookie | Both roles can be used side by side in one browser while seeing the same data |
| ADR-010 | Errors shown where they happen (inline, section boundaries, route `error.tsx`) + timeouts and query-only retries | One global error page; retrying mutations | A failing block never takes the page down; side effects are never repeated without the user |
| ADR-011 | `Monitoring` interface with a console reporter now, Sentry later | Installing Sentry in Phase 1; plain `console.error` | Same call sites in both phases; no account or DSN needed now; no PII by design |

## 12. Open questions

None at the moment.
