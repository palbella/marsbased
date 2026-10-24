# Specs — Shipment Tracking App

Spec-driven workflow for the shipment tracking product. These documents are the source of
truth for implementation. Code follows the specs, not the other way around: if
implementation reveals a gap, update the spec first.

## Documents

| # | Document | Purpose | Status |
|---|----------|---------|--------|
| 00 | [constitution.md](00-constitution.md) | Non-negotiable principles (quality, reliability, AI usage, mocking) | Draft |
| 01 | [product-spec.md](01-product-spec.md) | What and why: goals, roles, user stories, AI features, scope, assumptions | Draft |
| 02 | [architecture.md](02-architecture.md) | How: stack, layers, API + MSW, mock database, domain model, realtime, ADRs | Draft |
| 03 | [app-shell.md](03-app-shell.md) | Design language, login page, layout, navigation, user menu, profile | Draft |
| 04 | [domain-logic.md](04-domain-logic.md) | Business rules: normalisation, status, ETA, exceptions, priority, alerts, permissions, AI logic | Draft |
| 05 | [customer-portal.md](05-customer-portal.md) | Customer pages and shared shipment components | Draft |
| 06 | [ops-console.md](06-ops-console.md) | Attention queue, exception resolution, portfolio, mappings, simulator | Draft |
| 07 | [seed-data.md](07-seed-data.md) | Synthetic data catalogue and simulator scenarios (acceptance cases) | Draft |
| 08 | [tasks.md](08-tasks.md) | Ordered, estimated implementation tasks traced to requirement IDs | Draft |

## Traceability

```
Goal (G-*) ─► User story (US-*) ─► Rules (BR-*) ─► Screens (UI-*, SC-*, CP-*, OP-*)
                                                ─► Seed + scenarios (SD-*, SIM-*) ─► Tasks (T*)
```

| Prefix | Defined in |
|--------|-----------|
| `G-`, `US-`, `AI-`, `NFR-`, `A-` | 01 |
| `ADR-` | 02 |
| `UI-`, `DS-` | 03 |
| `BR-` | 04 |
| `SC-`, `CP-` | 05 |
| `OP-` | 06 |
| `SD-`, `SIM-` | 07 |
| `T` | 08 |

## Workflow

1. **Constitution** — agree on principles that every later decision must respect.
2. **Spec** — requirements with stable IDs and EARS-style acceptance criteria
   (`WHEN … THE SYSTEM SHALL …`).
3. **Design** — architecture, rules and screens that satisfy the spec; decisions recorded
   as ADRs.
4. **Tasks** — small, independently verifiable steps, each referencing requirement IDs.
5. **Implement** — one task at a time; a task is done when its acceptance criteria pass.

## Conventions

- Requirement IDs are stable: never renumber, deprecate instead.
- Every task, PR and test references the IDs it covers.
- Open questions live at the end of each document until resolved.
