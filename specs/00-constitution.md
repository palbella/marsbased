# 00 — Constitution

Principles that govern every product, design and code decision. When two options conflict,
the one that better respects these principles wins.

## P1. Never invent data
- A status, ETA or milestone shown to a user must trace back to a source event
  (operator, system estimate or AI prediction).
- Every time-sensitive value carries its **provenance**: `confirmed` (operator reported),
  `estimated` (operator or system planned) or `predicted` (AI). The UI always makes the
  difference visible.
- When data is missing or stale, say so. "Unknown" is a valid, honest state.

## P2. Manage by exception
- Operations users should not have to inspect shipments one by one. The default view
  surfaces what needs attention and proposes the next action.
- Customers see clarity first: *is it on time, and when does it arrive?*

## P3. AI assists, humans decide
- AI is used where it reduces effort or anticipates problems, not as decoration.
- Every AI output is labelled as such, shows its confidence and the evidence behind it.
- AI never mutates state on its own: it proposes, a user confirms.

## P4. Mocks are a replaceable layer
- All mocked behaviour (data, simulated backend logic, real-time, AI) lives in a single
  folder (`src/mocks`) and is reached only over HTTP, like a real backend.
- UI and domain code depend on the API client (`src/services`), never on mocks.
- Swapping to a real backend is configuration, not editing features or services.

## P5. Least privilege by default
- Each user only sees their perimeter (customer account, or ops site/account/role).
- Perimeter is enforced in the service layer (as a backend would), never only in the UI.

## P6. Clean, maintainable code
- TypeScript `strict`, no `any`, explicit types at module boundaries.
- Small modules with a single responsibility; feature-based folders.
- Pure functions for business rules, covered by unit tests.
- Names from the domain glossary (see product spec) used consistently in code and UI.
- No premature abstraction: abstractions exist only where the spec needs a seam
  (services, operator normalisers, AI providers).
