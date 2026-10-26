# Shipment Tracking — Write-up

## 1. AI in the product

**Approach.** AI is embedded in the two workflows the client struggles with, not offered as
a separate chatbot. It is used only where plain rules fall short: turning complex data into
clarity for customers, and turning a pile of exceptions into a prioritised, guided to-do
list for operations. Three principles apply everywhere:

1. **AI never replaces data.** Predictions are shown next to confirmed and estimated
   values, never instead of them. Every date carries its provenance: *confirmed*
   (operator), *estimated* (operator or system) or *predicted* (AI).
2. **AI is always explainable.** Every output is labelled, shows a confidence level and a
   "Why?" with the facts it used.
3. **AI proposes, people decide.** No AI output changes state on its own: drafts are sent
   by an agent, mapping suggestions are accepted by an agent.

**Where it is used.**

- **Shipment summary (customer).** A multi-leg timeline is hard to read for someone outside
  logistics. One or two sentences say where the shipment is, whether it is on time, when it
  arrives and how sure we are.
- **Predicted ETA (customer and ops).** Operator ETAs tend to be optimistic. The prediction
  uses historical performance per operator, lane and vessel, and flags a shipment *at risk*
  before the operator reports a delay.
- **Exception prioritisation (ops).** There are too many issues and no obvious order.
  Exceptions are ranked by severity, customer impact, urgency and age, and each position
  is explained.
- **Next action and drafted message (ops).** Writing updates takes time. The system suggests
  the next step and drafts the customer message for the agent to edit and send.
- **Status mapping assist (ops).** Operators keep adding new status codes. The system
  suggests the canonical milestone for an unknown code, with its confidence; once an agent
  accepts it, past events are reprocessed.

All outputs share one envelope (`AiInsight`: content, confidence, evidence, model) and one
UI component, so AI looks and behaves the same everywhere. If an AI call fails, the card is
hidden and the page keeps working.

**Deliberately left out:** a natural-language assistant. It demos well, but the portal and
the attention queue already answer the key questions without asking. It is the first AI
item on the roadmap.

**In the prototype** the AI is deterministic mock logic that only uses the shipment's own
data (templates, a scoring function, historical delay factors, text similarity), so every
sentence is traceable and the demo is reproducible.

**In production** the API contract stays the same; what answers it changes:
- Summaries and drafts: an LLM grounded on the normalised shipment data only, with outputs
  checked against those facts before display.
- Predicted ETA: a regression model on historical leg durations per operator, lane and
  season, with confidence intervals.
- Prioritisation: a model trained on past exceptions and their outcomes; the LLM only writes
  the rationale from the scoring features.
- Status mapping: an embedding classifier or LLM over the canonical vocabulary; every
  accepted suggestion feeds the mapping table.
- Evaluation and safety: offline test sets per feature, monitoring of acceptance and
  edit rates of drafts and suggestions, and no customer-facing output without grounding.

## 2. System approach, technology choices and planned integrations

- **Stack.** Next.js, TypeScript, Tailwind + shadcn/ui, TanStack Query and Zod, deployed
  on Vercel. Common, well-supported choices that a team can pick up quickly.
- **API-first frontend.** The UI only talks to a REST API, mocked in the browser with MSW.
  The mock holds what the backend will own: operator event normalisation, the exception
  engine, priorities, alerts and AI. Moving to a real backend means changing environment
  variables, not features.
- **Normalisation.** Each operator sends its own format; events are mapped to one
  canonical set of milestones, and every date keeps its source.
- **Realtime.** Thin events invalidate what they affect; tabs sync over BroadcastChannel
  today, server-sent events in production.
- **Planned integrations.** ERP/TMS for shipments, operator APIs/EDI/email parsing for
  events, OIDC for sign-in, email/SMS for alerts, Sentry for monitoring.

## 3. Assumptions, limitations and next steps

### Core assumptions

- **Synthetic scenario.** A fictional manufacturer, Corvane Industrial, ships from two
  factories (Zaragoza, Bilbao) and two warehouses (Valencia, Barcelona) in Spain to four
  customers (three in Spain, one in France) and a subsidiary in Mexico, through five
  operators (road, drayage, sea, last mile). 22 shipments cover every status and exception
  type.
- **Shipments are created upstream, not in this tool.** They are created in the
  manufacturer's ERP/TMS when a booking with the operators is confirmed (legs, operators,
  planned dates, committed delivery date, tracking numbers). The tracking app ingests them;
  creating shipments here would duplicate the source of truth. The app only adds
  information on top of existing shipments: exceptions, alerts, documents and activity.
- **Two business roles, three permission levels.** The brief's two roles are modelled as
  `customer` (subsidiaries are customers whose account type is *subsidiary*), `ops_agent`
  (sees the shipments of their sites) and `ops_manager` (sees everything). This covers
  "the internal team sees what corresponds to their site, account and role" without extra
  screens: agents and managers share the same console, only their perimeter differs.
- **English only.** UI, alerts, AI outputs and operator messages; i18n is out of scope.
- **Simplified shipments.** One origin site and one destination account per shipment;
  "no news" is judged by an expected update interval per mode (road 12 h, sea 48 h).

### Known limitations

- The backend runs in the browser: data lives per browser and resets with *Reset data*.
- The AI is deterministic mock logic, not a model.
- Sign-in is a mock token; no real authentication.
- Alerts are shown in the app only; no email or SMS.

### Prioritised next steps

1. Real backend implementing the same API, with OIDC sign-in.
2. Operator integrations (APIs, EDI, email parsing) and ERP/TMS import.
3. Production AI: ETA model and LLM summaries and drafts, grounded on shipment data.
4. Email/SMS alerts and Sentry monitoring.
5. Natural-language questions, map view and analytics.

## Resilience and monitoring

- **Timeouts and retries.** Every request times out (10 s, 30 s for uploads). Queries
  retry transient failures twice with back-off; actions never retry on their own, so a
  side effect is never repeated without the user.
- **Errors where they happen.** A failing block shows its own error with *Retry* while the
  rest of the page keeps working; route and root error boundaries catch render errors; the
  app says when the service is unavailable or the browser is offline.
- **Simulated Sentry.** Unexpected errors go through one `Monitoring` interface with user
  id, role, route and request id, and no personal data. The prototype logs them to the
  console; production plugs in Sentry without touching the call sites.
- **Testable failures.** The simulator can switch the mock API to slow, timeout, flaky or
  down, to verify every error state.
