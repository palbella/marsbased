# Corvane Control Tower — instructions for AI coding agents

Shipment tracking frontend (Next.js 15 App Router, TypeScript, Tailwind, shadcn/ui,
TanStack Query, Zod, MSW). The backend is mocked in the browser with MSW.

## Specs are the source of truth

Development is spec-driven. Before writing code, read:

1. `specs/00-constitution.md` — principles that always apply.
2. The task you are working on in `specs/08-tasks.md`.
3. Every spec section and requirement ID that task references (`US-*`, `BR-*`, `UI-*`,
   `SC-*`, `CP-*`, `OP-*`, `SIM-*`, `ADR-*`).

If the code needs something the specs don't define, or contradict, stop and ask. Update
the spec first, then the code. Never invent behaviour.

## Workflow per task

1. Work on one task from `specs/08-tasks.md` at a time.
2. Implement only what the task and its referenced IDs require.
3. When the task is done, run all checks and fix every error and warning before
   reporting it as done:
   ```bash
   npm run lint        # ESLint, including import boundaries
   npm run typecheck   # tsc --noEmit
   npm test            # Vitest
   ```
4. Verify the task's **Done when** criteria and report which IDs it covers.
5. Do not commit or push unless asked. When asked, reference the task and IDs:
   `feat(engine): exception detection (T04, BR-EX-01..11)`.

## Code rules

- **Size limits:** files and components ≤ 200 lines; functions ≤ 40 lines. If something
  grows beyond that, split it by responsibility (sub-components, hooks, pure helpers).
- **One responsibility per module.** Prefer small pure functions over classes; use a class
  only when it holds state with behaviour (e.g. `Table<Row>`).
- **TypeScript strict:** no `any`, no non-null assertions (`!`), no `@ts-ignore`. Types are
  inferred from the Zod schemas in `src/domain`.
- **Layer boundaries** (`specs/02-architecture.md` §3): features call `src/services` only;
  `src/mocks` is reached only over HTTP; `src/domain` imports nothing from other layers.
- **Names from the glossary** (`specs/01-product-spec.md` §4), the same in code and UI.
- **Readable over clever:** descriptive names, early returns, no nested ternaries, no magic
  numbers (name thresholds after their rule, e.g. `DELAY_THRESHOLD_HOURS` for BR-EX-01).
- **Comments explain why, not what.** Reference rule IDs where a rule is implemented.
- **No dead code, no commented-out code, no `console.log`.** Report errors through
  `lib/monitoring`.
- **No premature abstraction** and no new dependencies without a reason in the specs.
- **Tests** for every business rule (`src/mocks/{operators,engine,ai}`), named after the
  rule ID they cover.
- **English everywhere:** code, comments, UI copy, seed data.

## Conventions

- Files `kebab-case`, components `PascalCase`, hooks `useX`, named exports only.
- Each feature exposes its public API through `index.ts`.
- A resource has the same name in `services/<resource>.service.ts` and
  `mocks/handlers/<resource>.handlers.ts`.
