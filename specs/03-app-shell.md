# 03 — Design Language, Login Page, App Shell & Portal UI

Satisfies: US-00 and the navigation needs of every story in
[01-product-spec.md](01-product-spec.md). Built on [02-architecture.md](02-architecture.md).

Scope: the visual language used by every screen (§1), and everything around the feature
pages: login page (§7), layout, navigation, user menu and profile. Feature pages apply the
same language in [05-customer-portal.md](05-customer-portal.md) and
[06-ops-console.md](06-ops-console.md).

## 1. Design language: "bridge and manifest"

The product is a control tower, so the interface borrows from the two objects logistics
people already trust:

- **The bridge** (port control room, departure board): a dark instrument rail, a live
  status strip, dense rows of monospaced data that flip when they change.
- **The manifest** (waybill, bill of lading, CMR): paper ground, hairline-ruled blocks,
  small-caps field labels, references printed in monospace, stamps for states.

Operations use the bridge (dense, fast, keyboard-first); customers use the manifest
(calm, spacious, one clear answer). Same tokens, two densities.

### 1.1 Rules

- Typography and colour only from §1.2; library default fonts and palettes are not used.
- Lists are ruled rows on `--sheet`, never grids of rounded cards with shadows.
- Pages open with their main content (queue, arrivals, timeline); counts appear as
  compact counters in the page header, not as rows of KPI tiles.
- AI is identified by the analyst-note pattern (DS-06) and the `--predicted` colour only:
  no sparkle icons, no gradients.
- Icons are line icons (lucide); no emoji in the UI.

### 1.2 Tokens

| Token | Value | Use |
|-------|-------|-----|
| `--paper` | `#F5F3EE` | App background (warm off-white, like a manifest) |
| `--sheet` | `#FBFAF7` | Raised blocks (tables, panels) |
| `--ink` | `#15171A` | Text, sidebar rail, confirmed data |
| `--ink-muted` | `#4A4F57` | Secondary text, field labels, estimated data |
| `--rule` | `#D9D5CC` | 1 px hairlines between blocks and rows |
| `--signal` | `#FF4F1F` | International orange: primary action, attention, focus ring, active nav |
| `--ok` | `#1F7A4D` | On time |
| `--risk` | `#B07800` | At risk |
| `--late` | `#C2321F` | Late, high severity |
| `--unknown` | `#7B8088` | Unknown, stale |
| `--predicted` | `#2F46C8` | Cobalt: AI notes and predicted values only |

- **Contrast (NFR-04):** `--signal` is used as a fill with `--ink` text (contrast > 6:1),
  or as text only at ≥ 18 px. Status colours always come with an icon and a word.
- **Type:** IBM Plex Sans (UI text), IBM Plex Sans Condensed (headings, large figures,
  nav labels), IBM Plex Mono (references, codes, times, raw payloads). All numbers use
  `tabular-nums`. Loaded with `next/font`, self-hosted.
- **Field labels:** 11 px, uppercase, `letter-spacing: 0.08em`, `--ink-muted` — the
  waybill look.
- **Shape:** radius 2 px, no drop shadows; depth comes from `--sheet` on `--paper` and
  hairline rules. Focus ring 2 px `--signal`.
- **Density:** ops rows 36 px, customer rows 64 px.
- **Icons:** lucide at 16 px, stroke 1.5. Mode glyphs: truck, ship, customs stamp.
- **Light theme only** in Phase 1.

### 1.3 Signature patterns

Reusable patterns with IDs, referenced by 05 and 06.

**DS-01 — Status strip.** The header is an instrument strip: wordmark, a live indicator
(`● LIVE` when the realtime client is connected, `○ OFFLINE` otherwise), the current
time in monospace with the time zone and, in non-production, the simulation offset
(`14:32 CET · SIM +2 h`) and an `NON-PRODUCTION` chip outlined in `--signal`.

**DS-02 — Ink rail.** The sidebar is a dark `--ink` rail: nav labels in condensed
uppercase, counters as monospaced numbers right-aligned (in `--signal` when > 0), active
item marked with a 3 px `--signal` bar on the left.

**DS-03 — Manifest blocks.** Key facts are laid out like a waybill: ruled blocks with
small-caps labels above values (`ORIGIN`, `DESTINATION`, `ETA`, `COMMITTED`,
`OPERATOR`). Used in shipment headers, exception panel and profile.

**DS-04 — Transit line.** The route is drawn as a metro line, the product's visual
signature: stops are milestones, segments are legs with their mode glyph, confirmed
segments are solid `--ink`, planned and estimated ones dashed, the current position is a
filled `--signal` square, and customs is a stamp-shaped stop. Two sizes: *compact* (one
line inside list rows) and *full* (shipment detail, with labels and dates).

**DS-05 — Provenance typography.** Provenance is shown with type, not chips, so dates stay
readable in dense tables:

| Provenance | Rendering | Example |
|------------|-----------|---------|
| `confirmed` | regular, `--ink` | `Thu 14 Nov 10:20` |
| `estimated` | `≈` prefix, `--ink-muted` | `≈ Thu 14 Nov` |
| `predicted` | `~` prefix, italic, `--predicted`, dotted underline + `AI 68%` tag | `~ Fri 15 Nov  AI 68%` |

Every date has a tooltip with its source and time ("Estimated by BlueWave · 12 Nov
14:05"). A "How to read dates" popover in the header of each data page explains the three
styles once.

**DS-06 — Analyst note (AI).** AI outputs look like an analyst's margin note, never like
magic: a 2 px `--predicted` rule on the left, a monospaced header `AI NOTE · CONFIDENCE
HIGH`, the text, and the evidence as numbered footnotes `[1] [2]`. Each footnote links to
the milestone or event it comes from: hovering it highlights that stop on the transit
line or that row in the timeline. This makes grounding visible (P1, P3).

**DS-07 — Board flip.** When a value changes through a live update (US-R-01), the cell
flips like a split-flap board (CSS 3D, 300 ms) and keeps a small `--signal` dot for 10 s.
With `prefers-reduced-motion`, it fades instead.

**DS-08 — Triage rows.** Ops lists are boards, not card grids: a 4 px severity bar on the
left edge, a large condensed monospaced priority score, the reason in one line, and the
primary action as a `--signal` button. Keyboard-first: `J`/`K` move, `Enter` opens,
`N` notify customer, `A` acknowledge, `?` shows the shortcuts; hints shown as `kbd` tags.

**DS-09 — Arrivals agenda.** The customer home answers "when does it arrive?" first: shipments
are grouped by arrival day (`TODAY`, `TOMORROW`, `THIS WEEK`, `LATER`), each row led by the
ETA in large condensed type, then the compact transit line and one status sentence.

**DS-10 — Stamps.** States that deserve a pause are shown as a rubber stamp: uppercase
condensed text in a rotated (−2°) bordered box. Used for empty and error states
(`ALL CLEAR`, `NO SIGNAL`, `NOT FOUND`) and for terminal states (`DELIVERED`, `ON HOLD`).
Copy is short and specific: "ALL CLEAR — Nothing needs your attention right now."

### 1.4 Building blocks

- **One shell for both roles.** A single `AppShell` renders strip, rail and content; only
  the navigation config changes per role.
- **shadcn/ui as primitives, restyled with the tokens** (`Sheet`, `DropdownMenu`,
  `Dialog`, `Tooltip`, `Form`).
- **One page template.** Every page uses `PageHeader` (condensed title, field-label
  subtitle, actions) + content, and the shared `LoadingState`, `EmptyState` and
  `ErrorState` (DS-10).
- **Not in Phase 1:** dark mode, collapsible desktop rail, motion beyond DS-04 and DS-07,
  user preferences, editing the profile.

## 2. Routes

```
/sign-in                     public
/                            redirects: no session → /sign-in · customer → /portal · ops → /ops
(authenticated) layout       AppShell + session guard
├─ /portal/…                 customer area (05)
├─ /ops/…                    operations area (06)
└─ /profile                  shared, read-only
```

## 3. Layout

```
┌───────────────────────────────────────────────────────────────────────────┐
│ ☰ CORVANE / CONTROL TOWER     ● LIVE  14:32 CET · SIM +2 h  [NON-PROD] 🔔 LG│ status strip, 56 px (DS-01)
├────────────────┬──────────────────────────────────────────────────────────┤
│▌ATTENTION   7  │ ATTENTION QUEUE                              [actions]    │
│ SHIPMENTS      │ OPS · ZARAGOZA PLANT, VALENCIA WAREHOUSE                  │
│ MAPPINGS    1  │ ───────────────────────────────────────────────────────── │
│                │                                                           │
│  ink rail      │   page content on paper (the only scrolling region)       │
│  (DS-02)       │                                                           │
│ ────────────── │                                                           │
│ SIMULATOR      │                                                           │
└────────────────┴──────────────────────────────────────────────────────────┘
  rail: fixed, 224 px                  main: overflow-y: auto
```

**UI-01 — Fixed shell, scrolling content** (M)
- THE SYSTEM SHALL keep the status strip and rail fixed and make only the content area
  scroll (`h-dvh` grid; `overflow-y: auto` on `main`).
- WHEN navigating between pages THE SYSTEM SHALL reset the content scroll to the top.

**UI-02 — Responsive** (M, NFR-01)
- WHILE the viewport is ≥ 768 px THE SYSTEM SHALL show the rail permanently.
- WHILE the viewport is < 768 px THE SYSTEM SHALL hide the rail and show a menu button (☰)
  in the strip that opens it as a drawer; selecting an item closes it. The strip keeps the
  live indicator and hides the clock.

## 4. Status strip (header)

**UI-03 — Strip content** (M, DS-01)
- THE strip SHALL show, left to right: menu button (mobile only), wordmark (links to the
  role's home), live indicator, clock, non-production chip, notification bell (customer
  only) and the user menu.
- THE live indicator SHALL reflect the realtime connection and the browser's online state
  (02 §5.6, §7).
- WHILE the simulator's network mode is not *Normal* THE strip SHALL show it as a warning
  chip (OP-55).
- WHERE the user is a customer THE bell SHALL show the unread alerts count and link to
  `/portal/alerts` (US-C-04).

**UI-04 — User menu** (M)
- THE strip SHALL show the signed-in user's initials in a square avatar at the right.
- WHEN the avatar is clicked THE SYSTEM SHALL open a menu with the user's name and role as
  a label, and two options: **View profile** and **Sign out**.
- WHEN **View profile** is chosen THE SYSTEM SHALL navigate to `/profile`.
- WHEN **Sign out** is chosen THE SYSTEM SHALL call `POST /api/auth/sign-out`, clear the
  tab's session and its query cache, and navigate to `/sign-in`.
- THE menu SHALL be keyboard accessible (open with Enter/Space, navigate with arrows,
  close with Esc).

## 5. Rail navigation

**UI-05 — Menu per role** (M, DS-02)
- THE rail SHALL show the items of the signed-in user's role, highlighting the current one
  (`aria-current="page"`).

| Role | Item | Route | Counter | Spec |
|------|------|-------|---------|------|
| customer | Arrivals | `/portal` | — | US-C-01 |
| customer | Alerts | `/portal/alerts` | unread | US-C-04 |
| ops_agent, ops_manager | Attention | `/ops` | open exceptions | US-O-01 |
| ops_agent, ops_manager | Shipments | `/ops/shipments` | — | US-O-02 |
| ops_agent, ops_manager | Mappings | `/ops/mappings` | unmapped | US-O-05 (S) |
| all (non-production) | Simulator | opens side panel | — | US-R-02 |

- Counters update live (US-R-01): they read from the same queries the pages use, and flip
  when they change (DS-07).
- Navigation is declared as data per role (`features/shell/navigation.ts`), not hardcoded
  in components.

## 6. Shared page states

**UI-10 — Stamped states** (M, DS-10)
- THE empty, error and not-found states SHALL use the stamp pattern with a short, specific
  message and one action: `ALL CLEAR` (empty queue), `NOTHING IN TRANSIT` (no active
  shipments), `NO SIGNAL` (service unavailable, with *Retry*), `NOT FOUND` (with a link
  back), `OFFLINE` (browser offline).
- Loading states SHALL be skeletons in the shape of the content (rows, transit line), never
  a centred spinner.

## 7. Login page (`/sign-in`)

```
┌──────────────────────────────────┬────────────────────────────────────────┐
│                                  │  SIGN IN                               │
│  CORVANE                         │  EMAIL                                 │
│  CONTROL TOWER                   │  [                                  ]  │
│                                  │  PASSWORD                              │
│  ■━━━━━●━━━━━●┅┅┅┅┅◇┅┅┅┅┅○       │  [                                  ]  │
│  Zaragoza   Valencia  Veracruz   │  [            SIGN IN              ]   │
│                                  │  ⚠ Invalid email or password           │
│  Every shipment, one view.       │                                        │
│                                  │  TEST ACCOUNTS · NON-PRODUCTION        │
│                                  │  Laura Gómez     Customer   Alba    Use│
│  ink panel                       │  Marc Puig       Ops agent  ZGZ+VLC Use│
│                                  │  …          password Tracking2026!     │
└──────────────────────────────────┴────────────────────────────────────────┘
```

**UI-06 — Sign-in form** (M, US-00)
- THE page SHALL be outside the shell, split in two: an `--ink` panel with the wordmark, a
  transit line that draws itself once on load (DS-04, SVG stroke animation, skipped with
  `prefers-reduced-motion`) and the tagline "Every shipment, one view."; and a `--paper`
  panel with the form. Below 768 px only the form panel is shown, with the wordmark on top.
- THE SYSTEM SHALL validate required fields and email format on the client before
  submitting.
- WHILE the request is in progress THE submit button SHALL be disabled and show progress.
- WHEN credentials are invalid THE SYSTEM SHALL show "Invalid email or password" and keep
  the email filled in.
- WHEN sign-in succeeds THE SYSTEM SHALL redirect to the role's home (or to the originally
  requested page, if it belongs to that role).
- WHEN a signed-in user opens `/sign-in` THE SYSTEM SHALL redirect to their home.

**UI-07 — Test accounts** (M, non-production only)
- THE page SHALL list the seeded users as a crew list (name, role, perimeter, *Use*) under
  the form, with the shared password shown once.
- WHEN *Use* is clicked THE SYSTEM SHALL fill email and password; the user still submits.
- THE list SHALL be hidden when `NEXT_PUBLIC_API_MOCKING` is not `enabled`.

## 8. Profile page

**UI-08 — Read-only profile** (M, DS-03)
- THE `/profile` page SHALL show, read-only, from `GET /api/auth/me`: name, email, role,
  and perimeter (account name for customers; sites, or "All sites" for managers), as
  manifest blocks.
- THE page SHALL NOT offer any edit control; a note explains that profile data is managed
  by the organisation's administrator.
- THE page SHALL render inside the shell for both roles.

```
PROFILE
─────────────────────────────────────────────
NAME                     EMAIL
Laura Gómez              laura.gomez@albaretail.test
─────────────────────────────────────────────
ROLE                     ACCOUNT
Customer                 Alba Retail S.L.
─────────────────────────────────────────────
ⓘ Profile details are managed by your organisation's administrator.
```

## 9. Session handling in the shell

**UI-09 — Guard and expiry** (M)
- WHEN an unauthenticated user opens any route in the authenticated area THE SYSTEM SHALL
  redirect to `/sign-in?next=<path>`.
- WHILE the session is being resolved (`GET /api/auth/me`) THE shell SHALL show a skeleton,
  never a flash of the wrong role's content.
- WHEN any request returns `401` THE SYSTEM SHALL sign the tab out and redirect to
  `/sign-in` with the message "Your session has expired".

## 10. Components

| Component | Location | Notes |
|-----------|----------|-------|
| Design tokens | `app/globals.css` + `tailwind.config.ts` | §1.2 as CSS variables mapped to Tailwind theme |
| `AppShell` | `features/shell` | Grid layout: strip, rail, scrolling main |
| `StatusStrip` | `features/shell` | DS-01: wordmark, live indicator, clock, chips, bell, user menu |
| `InkRail` | `features/shell` | DS-02: renders `navigation[role]`, counters |
| `UserMenu` | `features/shell` | Square avatar + dropdown (profile, sign out) |
| `PageHeader` | `components/ui` | Condensed title, field-label subtitle, actions slot |
| `FieldBlock` | `components/ui` | DS-03: label + value, ruled |
| `Stamp` | `components/ui` | DS-10 |
| `FlipValue` | `components/ui` | DS-07 |
| `SignInForm`, `TestAccounts`, `SignInHero` | `features/session` | |
| `ProfileBlocks` | `features/session` | |

`TransitLine` (DS-04), `SourcedDate` (DS-05) and `AnalystNote` (DS-06) are shipment
components, specified in 05 §1.

## 11. Effort guide

| Item | Estimate |
|------|----------|
| Tokens, fonts, restyled primitives | 10 min |
| Shell (strip, rail, responsive drawer, scroll) | 20 min |
| Sign-in (split layout, hero line) + test accounts + guard | 20 min |
| User menu + profile + stamped states | 10 min |
| **Total** | **~1 h** (task T06 in [08-tasks.md](08-tasks.md)) |

## 12. Open questions

None. Resolved:
- Q-S1: Product name → **Corvane Control Tower**. "Control tower" is the logistics term for
  a single, end-to-end visibility layer over many operators and sites; it is the
  manufacturer's own in-house tool, so it carries the manufacturer's name.
