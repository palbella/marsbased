# Corvane Control Tower

Shipment tracking for a manufacturer and its customers. Customers see where their orders
are and when they arrive; the operations team manages shipments by exception, helped by AI.
Phase 1 is a frontend prototype with the backend mocked in the browser (MSW).

**Live:** https://corvane-control-tower.vercel.app

## Run locally

```bash
cp .env.example .env.local
npm install
npm run dev        # http://localhost:3000
```

Checks: `npm run lint`, `npm run typecheck`, `npm test`.

## Test accounts

Password for all: `Tracking2026!` (also listed on the sign-in page).

| User | Role |
|------|------|
| marc.puig@corvane.test | Ops agent (Zaragoza, Valencia) |
| nuria.vidal@corvane.test | Ops agent (Bilbao, Barcelona) |
| elena.martin@corvane.test | Ops manager (all sites) |
| diego.hernandez@corvane-mx.test | Customer (Mexico subsidiary) |
| laura.gomez@albaretail.test | Customer |

## Simulator

*Simulator* at the bottom of the left rail. Run scenarios (new delay, customs hold,
silent operator…), advance the clock, switch the network to failure modes or reset the
data. Open two tabs (ops and customer) to see live updates.

## Structure

`src/app` routes · `src/features` UI by feature · `src/services` API client ·
`src/domain` schemas and types · `src/mocks` mock backend (engine, AI, seed data).

Specs: [`specs/`](specs/) · Write-up: [`docs/write-up.md`](docs/write-up.md)
