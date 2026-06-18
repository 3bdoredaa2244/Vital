# VITAL — Frontend Framework & Design Architecture

> **Companion to `DESIGN_HANDOFF.md`.**
> `DESIGN_HANDOFF.md` answers *"what should it look like"* (the warm-paper visual
> language). **This document answers *"how is the frontend built"*** — the
> framework, the navigation map, state & data flow, the component architecture,
> the API contract each screen consumes, and the conventions to follow.
>
> Read both before building. When the two conflict on a visual detail, the
> handoff wins; when they conflict on structure/data, this doc wins.

---

## 0. Mental model (read this first)

VITAL is a **subscription-based preventive-health app** for the Egyptian market.
The user onboards, picks a plan, pays (Paymob), and then reads their biomarker
results against **functional-optimal** ranges (not just lab-normal). An **admin
dashboard** (separate Next.js app) is the control plane: it manages users,
uploads/parses lab PDFs, edits plans, biomarkers, onboarding goals, and app copy.

Two frontends, one shared brain:

```
                    ┌────────────────────────────┐
                    │   packages/shared           │
                    │   • TS types (the contract) │
                    │   • Zod schemas (validation)│
                    │   • classifyBiomarker()     │ ← single source of status truth
                    │   • biomarker seed dataset  │
                    └─────────────┬──────────────┘
                                  │ imported by all
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
┌───────▼────────┐       ┌────────▼────────┐       ┌────────▼────────┐
│  apps/mobile   │       │    apps/api     │       │   apps/admin    │
│ Expo / RN      │◄─────►│ Hono + Drizzle  │◄─────►│ Next.js 14      │
│ (this doc's    │  REST │ Supabase/Paymob │  REST │ (control plane) │
│  main subject) │       │                 │       │                 │
└────────────────┘       └─────────────────┘       └─────────────────┘
```

**The golden rule:** the frontend never re-implements business logic that lives
in `packages/shared`. Status classification, validation, and the type shapes are
imported — never copied. If a screen needs a status color or a status label,
it comes from shared constants, not a local map.

---

## 1. Tech stack & rationale

### Mobile app (`apps/mobile`) — the primary frontend

| Concern | Choice | Why |
|---|---|---|
| Framework | **Expo (React Native)**, Expo Go compatible | Single codebase iOS/Android, fast iteration, no native build step required |
| Navigation | **Expo Router** (file-based) | Routes = files; stacks + a 3-tab bottom bar; deep-linkable |
| Styling | **NativeWind** (Tailwind for RN) | Utility classes in JSX; tokens shared with a Tailwind config |
| Animation | **Reanimated 3** | 60fps native-thread animations (pulse, sheets, transitions) |
| Forms | **React Hook Form + Zod** | RHF for state, the **shared Zod schemas** for validation — same rules as the API |
| Charts | **react-native-svg** (custom) | Hand-built range-bar + range-reference line chart. **No Victory/Skia** — incompatible with Expo Go |
| State | **Zustand** | Tiny global stores (auth, library, subscription, onboarding, biomarker-UI) |
| Icons | **lucide-react-native** | Outline/thin-stroke set, resolved through a single `LucideIcon` wrapper |
| Payments | **react-native-webview** | Hosts the Paymob iframe; app never touches card data |
| Secure storage | **expo-secure-store** | JWT access/refresh tokens |

> ⚠️ **Hard constraints — do not break:**
> - Must run in **Expo Go** → no libraries requiring custom native modules or RN
>   ≥0.78/Skia. (This is why charts are custom SVG.)
> - **Never** hardcode status→color or status→label maps in a screen. Import from
>   `@vital/shared`.
> - All forms validate with the **shared schema**, then POST; never invent a
>   second validation shape on the client.

### Admin app (`apps/admin`) — control plane

Next.js 14 App Router, Tailwind (same token names), a thin `lib/api.ts` Bearer
client, localStorage token (internal tool, trusted devices). Already built; this
doc focuses on mobile but the token system mirrors it.

---

## 2. Monorepo structure

```
V-/  (pnpm workspace)
├── packages/shared/         # types + zod + classifyBiomarker + biomarker seed
│   └── src/
│       ├── types/index.ts        # THE contract — every interface the UI renders
│       ├── schemas/index.ts      # zod schemas (signup, goals, results, …)
│       ├── biomarker-status.ts   # classifyBiomarker(), STATUS_COLORS, STATUS_LABELS
│       └── data/biomarkers.ts    # 89-marker, 8-category seed dataset
│
├── apps/api/                # Hono backend (REST, /api/v1/*)
│
├── apps/mobile/             # ← the frontend this doc specifies
│   ├── app/                 # Expo Router route tree (see §3)
│   ├── components/
│   │   ├── ui/              # design-system primitives (Button, RangeBar, …)
│   │   └── biomarker/       # feature components (ManualResultSheet, FilterPills)
│   ├── constants/
│   │   ├── theme.ts         # design tokens for non-Tailwind code (SVG, inline)
│   │   ├── categories.ts    # category identity colors/icons
│   │   └── biomarkers.ts    # re-exports shared seed + offline fallbacks
│   └── lib/
│       ├── api.ts           # typed REST client (authApi, userApi, biomarkerApi…)
│       ├── auth.ts          # token storage helpers
│       ├── format.ts        # formatNumber / formatDate
│       └── store/           # zustand stores
│
└── apps/admin/              # Next.js admin dashboard
```

**Path aliases:** `@/*` → app-local (e.g. `@/components/ui`), `@vital/shared` →
the shared package. Never reach into another app's files.

---

## 3. Information architecture (navigation map)

Expo Router file tree → runtime navigation. Three route groups, one stack each,
plus a tab group.

```
app/
├── index.tsx                  → boot/redirect: decides auth vs tabs vs onboarding
│
├── (auth)/                    ─ onboarding stack (no tab bar)
│   ├── welcome.tsx            1. Welcome — wordmark + tagline (tagline from API)
│   ├── signup.tsx             2. Sign Up
│   ├── login.tsx              3. Login
│   ├── health-profile.tsx     4. Health Profile — one-question-per-screen wizard
│   └── goals.tsx              5. Goals — pick up to 3 (options from API)
│
├── subscription/             ─ purchase stack (no tab bar)
│   ├── plans.tsx              6. Plans — monthly/annual, Basic/Premium
│   ├── checkout.tsx          7. Checkout — VAT, terms → Paymob WebView
│   └── confirmation.tsx      8. Confirmation — success, subscription detail
│
├── (tabs)/                   ─ MAIN APP (light bottom bar, accent active item)
│   ├── dashboard.tsx          9. Dashboard — count-bar hero, category preview
│   ├── biomarkers.tsx        10. Biomarkers — category bars + filterable list
│   └── profile.tsx           11. Profile — profile rows, goals, subscription
│
└── biomarker/                ─ detail stack (pushed over tabs)
    ├── [id].tsx              12. Biomarker Detail — chart, ranges, long-form
    └── category/[slug].tsx   13. Category Detail — count bar + category list
```

### Routing decision logic (`app/index.tsx` + layouts)

```
on launch → hydrate auth store (load token, fetch /users/me)
  ├─ no session                      → (auth)/welcome
  ├─ session, profile incomplete     → (auth)/health-profile  (resume onboarding)
  ├─ session, no active subscription → subscription/plans     (gate)
  └─ session + active subscription   → (tabs)/dashboard
```

Subscription gating: the **Biomarkers** list and **detail** screens render a
locked/subscribe state for users without an active subscription (checked via the
subscription store's `hasActive()`), rather than blocking navigation outright.

---

## 4. State & data-flow architecture

Two layers of state. Keep them separate.

### 4.1 Server state → fetched per screen via `lib/api.ts`

Each screen owns its async fetch with local `useState` (`data`, `loading`,
`error`) and a `load()` in `useEffect`. This is deliberate — no global cache
library. Use the standard triad on every fetch:

```
loading → <Skeleton/>      (never a bare spinner on first paint where a skeleton fits)
error   → <EmptyState/>    (with retry)
data    → render
```

### 4.2 Global client state → Zustand stores (`lib/store/`)

| Store | Holds | Key actions | Consumed by |
|---|---|---|---|
| `auth` | `user`, token-derived session | `hydrate`, `refreshUser`, `applySession`, `signOut` | root layout, profile, every gated screen |
| `library` | biomarker catalog + categories (cached) | `fetch(force?)` | biomarkers list, detail (related markers) |
| `subscription` | current `SubscriptionWithPlan \| null` | `fetch`, `hasActive()`, `clear` | gating, dashboard strip, profile |
| `onboarding` | wizard answers + step | `setField`, `next/back`, `progress()`, `toHealthProfile()`, `reset` | health-profile, goals |
| `biomarkers` (UI) | list filters: category, status, sort, search, view | `setCategory/Status/Sort/Search`, `toggleView`, `reset` | biomarkers list + filter pills |

Rules:
- **Server data that's user-specific and changes often** (results, a single
  biomarker) → fetch locally per screen, don't cram into a store.
- **Catalog data that's stable** (biomarker library, categories) → `library`
  store, fetched once, `force` to refresh.
- **Onboarding** is pure client state until the final submit, which calls the
  API and then `reset()`s.

### 4.3 The status-classification flow (the most important data path)

```
raw result value ──► classifyBiomarker(value, biomarker ranges)  [in @vital/shared]
                          │
                          ▼
                 BiomarkerStatus ('optimal'|'suboptimal'|'alert'|'untested')
                          │
          ┌───────────────┼────────────────┐
          ▼               ▼                ▼
   STATUS_COLORS[s]  STATUS_LABELS[s]   statusColors[s]  (theme mirror for SVG)
```

The API computes status server-side **and** the client can recompute with the
same function — they will always agree because it's one function. **A screen must
never decide "is this optimal" with its own thresholds.**

---

## 5. The data contract (API the frontend consumes)

Base URL: `EXPO_PUBLIC_API_URL` (default `http://localhost:3000/api/v1`).
Auth: `Authorization: Bearer <access_token>` on authed calls.
Errors: every failure is `{ error: { code, message, details? } }` → the client
throws `ApiError`. Screens catch and surface `err.message`.

Frontend-facing endpoints (admin-only routes omitted — see admin app):

| Domain | Method & path | Client helper | Returns |
|---|---|---|---|
| Auth | `POST /auth/signup` | `authApi.signup` | user + tokens |
| | `POST /auth/login` | `authApi.login` | tokens + user_id |
| | `POST /auth/logout` | `authApi.logout` | ok |
| | `POST /auth/reset-password` | `authApi.resetPassword` | ok |
| User | `GET /users/me` | `userApi.me` | `{ user }` |
| | `PUT /users/me/health-profile` | `userApi.updateHealthProfile` | `{ user }` |
| | `PUT /users/me/goals` | `userApi.updateGoals` | `{ user }` |
| Subscriptions | `GET /subscription-plans` (public) | `subscriptionApi.plans` | `{ plans }` |
| | `GET /subscriptions/me` | `subscriptionApi.mine` | `{ subscription \| null }` |
| Payments | `POST /payments/initiate` | `subscriptionApi.initiatePayment` | iframe_url + ids + amount |
| Biomarkers | `GET /biomarkers` (filter/search) | `biomarkerApi.list` | list + categories |
| | `GET /biomarkers/:id` | `biomarkerApi.get` | `{ biomarker }` (with result) |
| | `GET /biomarker-categories` | `biomarkerApi.categories` | `{ categories }` |
| Results | `GET /results/me` | `resultApi.all` | all user results |
| | `GET /results/me/:biomarkerId` | `resultApi.forBiomarker` | history for one marker |
| | `POST /results` | `resultApi.create` | created result |
| | `DELETE /results/:id` | `resultApi.remove` | ok |
| Content | `GET /app-content` (public) | `contentApi.get` | tagline, lab partner, support |
| | `GET /health-goals` (public) | `contentApi.goals` | onboarding goal options |

> **Admin-controlled, app-rendered:** `app-content` (welcome tagline, "Book a
> Test" lab-partner name/URL/phone, support email) and `health-goals` (onboarding
> options) are edited in the admin dashboard and fetched by the app at runtime.
> **Design these screens to read from the API with the bundled constants as an
> offline fallback** — never hardcode the tagline or goal list as the only source.

---

## 6. Component architecture

Three layers. Build bottom-up; screens compose, they don't reinvent.

```
constants/theme.ts ─┐
@vital/shared ───────┼──► components/ui/* (primitives) ──► components/<feature>/* ──► app/**/screen.tsx
(tokens + status)   ┘     design system                    feature blocks            routes
```

### 6.1 Design-system primitives — `components/ui/` (the kit)

These already exist as files; the redesign **restyles them to warm-paper**, it
does not rename or re-architect them. Exported via `components/ui/index.ts`.

| Component | Role | Redesign note (per handoff) |
|---|---|---|
| `Screen` | safe-area page wrapper, optional scroll | canvas background `#FBF6EC` |
| `Button` | primary / secondary / ghost, loading, icon | **primary = ink fill + cream text**; secondary = outline; ghost = accent text |
| `StatusBadge` → status line | status pill / inline `● word · value` | prefer **inline status line** on headers/detail; keep compact pill for dense rows |
| `RangeBar` | 5-zone optimal/normal range bar with marker | light zones (green/amber/rust, lower sat); marker = ink + cream ring |
| `HistoryChart` | result history over time | upgrade to **range-reference style**: left range band, status-colored points, current-value label, dashed projection |
| `ProgressBar` | thin progress (onboarding) | accent on cream |
| `ProgressRing` | circular progress | status/category color, `line` track |
| `SectionHeader` | long-form section title | **bold sentence-case ink** (drop uppercase-mono) |
| `BiomarkerCard` / row | a marker in a list | default to **cream row + hairline divider**, not a boxed card |
| `CategoryCard` | a category tile/row | NEW primary: **proportional green/amber/rust ratio bar with counts** |
| `PlanCard` | a subscription plan | big bold price, green-check features, accent "Most Popular" |
| `FormField` | labeled input + error | inkSoft label, `line` border, accent focus ring |
| `BottomSheet` | modal sheet (manual entry) | cream sheet, hairline handle |
| `SkeletonLoader` | loading placeholder | warm-tinted shimmer |
| `EmptyState` | empty/error with retry | editorial, optional retry CTA |
| `Toast` | transient messages | light, accent/status tinted |
| `LucideIcon` | icon-by-name wrapper (string → component, falls back to `Circle`) | outline / thin-stroke |

### 6.2 Feature components — `components/<feature>/`

| Component | Screen | Role |
|---|---|---|
| `biomarker/ManualResultSheet` | Biomarker Detail | bottom-sheet form to add a result (RHF + shared `createResultSchema`) |
| `biomarker/FilterPills` | Biomarkers list | category + status filter chips, bound to the `biomarkers` UI store |
| *(NEW)* `CountBarHero` | Dashboard | the 4-up big-number + proportional bar block (§ handoff 4.1) |

### 6.3 Signature data-viz (VITAL's identity — design these carefully)

1. **Count-bar hero** (Dashboard): four big status-colored numerals, each over a
   proportional bar, with a quiet *"42 of 60 markers optimal"* count beneath.
   It's a **count, not a score** — no biological-age / composite score (Phase 2).
2. **Category ratio bars** (Biomarkers): each category row carries a horizontal
   green/amber/rust segmented bar with counts at the segment ends.
3. **Range-reference line chart** (Detail): left vertical reference band (optimal
   green zone, alert zones), status-colored points across test dates, the current
   value labeled, a dashed segment to a hollow "next test" point.

---

## 7. Design-token system — the override contract (READ THIS)

**The theme is fully overridable from one file.** Claude design re-skins the
entire app by editing **`apps/mobile/constants/tokens.js`** — nothing else is
required to change colors or fonts.

```
            apps/mobile/constants/tokens.js   ◄── EDIT HERE (single source of truth)
                   │            │
        ┌──────────┘            └───────────┐
        ▼                                   ▼
 constants/theme.ts                  tailwind.config.js
 (inline styles, SVG/chart,          (NativeWind classes:
  Reanimated — `colors.*`)            bg-* / text-* / border-* / font-*)
        │                                   │
        └──────────────┬────────────────────┘
                       ▼
              every screen & ui/ primitive re-skins
```

Both the inline-style path and the Tailwind-class path now `require`/`import`
from `tokens.js`, so they can never drift. `@vital/shared` `STATUS_COLORS` is the
cross-app status palette (API + admin + mobile agree) and is kept in sync with
the warm tokens.

### How to override (three options, all one-file edits)

```js
// apps/mobile/constants/tokens.js
const themes = {
  warmPaper: { canvas:'#FBF6EC', ink:'#20201C', accent:'#C2603C', /* …roles… */ },
  legacyDark: { /* original v1 */ },
};
const ACTIVE_THEME = 'warmPaper';   // ② flip this to swap palettes wholesale
```

1. **Tweak values** — edit the active theme object (e.g. change `accent`).
2. **Swap palette** — change `ACTIVE_THEME` to another key in `themes`.
3. **New direction** — add a theme object (same role keys) and point
   `ACTIVE_THEME` at it.

### Why existing screens don't break when you override

Screens were written against the **old vocabulary** (`colors.obsidian`,
`colors.gold`, `colors.white`, … — ~330 call sites) and old Tailwind names
(`bg-obsidian`, `text-gold`, …). `tokens.js` includes a **legacy-alias layer**
that maps each old name onto a **semantic role** in the active theme:

| Old name | Role it maps to | Old name | Role it maps to |
|---|---|---|---|
| `obsidian` | `canvas` (app bg) | `text` | `ink` (primary text) |
| `deep` | `card` (raised bg) | `textDim` | `inkSoft` |
| `surface` | `panelWarm` (inset) | `textMuted` | `inkMuted` |
| `border`/`borderLight` | `line` | `white` | `ink` (foreground/emphasis) |
| `gold`/`goldLight`/`goldDim` | `accent`/`accentSoft` | `red` | `rust` (alert) |
| `cyan` | `panelSlate` | `green` | `green` (optimal) |

Because the mapping preserves **roles** (background→background,
primary-text→primary-text, accent→accent), the light/dark relationship and
contrast stay correct through a palette swap — a dark-era screen written as
"`colors.white` heading on `colors.obsidian` background" automatically becomes
"ink heading on cream canvas." **New code should prefer the semantic role names**
(`canvas`, `ink`, `inkSoft`, `accent`, `line`, `green/amber/rust/untested`).

### Current state & remaining redesign work

- ✅ Theme is now single-source and **defaults to warm-paper** (`ACTIVE_THEME`),
  so the app already renders on the new palette via the alias layer.
- ✅ `@vital/shared` `STATUS_COLORS` updated to the warm status palette.
- ☐ **Fonts:** `tokens.js` names `BricolageGrotesque` / `Inter`, but **no fonts
  are loaded yet** (no `expo-font`/`assets/fonts`). The app currently falls back
  to system fonts. Add the font files + `useFonts` in `app/_layout.tsx` to get the
  branded type. (This is safe to defer — it degrades, it doesn't crash.)
- ☐ **Screen polish:** the alias layer makes screens *coherent*, not *finished*.
  Migrate hot screens to semantic role names and apply the editorial layout from
  `DESIGN_HANDOFF.md` (hairline rows over boxed cards, big numbers, etc.).
- ☐ **The three data-viz patterns** (count-bar hero, category ratio bars,
  range-reference chart) — build these per §6.3.

Token *values & type* are authoritative in `DESIGN_HANDOFF.md §2–3`; `tokens.js`
is where they live in code.

---

## 8. Per-screen spec (data in → components → API out)

For each screen: what it fetches, what it renders, what it writes. Use this as
the build checklist.

| # | Screen | Reads (API/store) | Key components | Writes (API) |
|---|---|---|---|---|
| 1 | Welcome | `contentApi.get` → tagline | wordmark, `Button` ×2 | — |
| 2 | Sign Up | — | `FormField`, `Button` | `authApi.signup` (schema: `signupSchema`) |
| 3 | Login | — | `FormField`, `Button` | `authApi.login` |
| 4 | Health Profile | `onboarding` store | wizard, `ProgressBar`, choice rows | `userApi.updateHealthProfile` (`healthProfileSchema`) on finish |
| 5 | Goals | `contentApi.goals` (fallback const) | goal card grid, `LucideIcon` | `userApi.updateGoals` (`goalsSchema`) |
| 6 | Plans | `subscriptionApi.plans` | `PlanCard`, segmented toggle | — (selects plan) |
| 7 | Checkout | selected plan + VAT calc | order rows, terms checkbox, `WebView` | `subscriptionApi.initiatePayment` → Paymob iframe |
| 8 | Confirmation | `subscriptionApi.mine` | success check, detail rows | — |
| 9 | Dashboard | results + library + `subscription` | **CountBarHero**, sub strip, category preview | — |
| 10 | Biomarkers | `library` store + `biomarkers` UI store | category **ratio bars**, `FilterPills`, search, rows | — (filters are client-side) |
| 11 | Profile | `auth` + `subscription` stores | profile rows, goals, sub card, sign out | `authApi.logout` / `signOut` |
| 12 | Biomarker Detail | `biomarkerApi.get`, `resultApi.forBiomarker`, `contentApi.get` (lab partner) | status line, **range-reference chart**, `RangeBar`, long-form, `ManualResultSheet`, sticky actions | `resultApi.create` (`createResultSchema`); "Book a Test" → `Linking.openURL(lab_partner.url)` |
| 13 | Category Detail | `biomarkerApi.list({category})` | count bar, category list, related chips | — |

---

## 9. Cross-cutting patterns (apply everywhere)

- **Async triad:** every fetch renders `Skeleton` → `EmptyState(retry)` → data.
- **Errors:** catch `ApiError`, show `err.message` via `Toast`; never swallow.
- **Auth gating:** root layout hydrates auth and redirects (see §3). Authed
  endpoints assume a token; on 401 the client should trigger `signOut`.
- **Subscription gating:** Biomarkers/detail show a **locked/subscribe** state
  (via `subscription.hasActive()`) rather than a hard navigation block.
- **Forms:** RHF + the **shared Zod schema** for that action; map field errors to
  `FormField`. Submit → API → on success advance/`reset`.
- **Admin-controlled content:** tagline, goals, lab-partner info come from the API
  with bundled constants as fallback — design for both states.
- **Lists:** prefer cream rows + hairline `line` dividers over boxed cards
  (cards only for true elevation: the slate feature panel, bottom sheets).
- **Numbers are heroes:** big, bold, status-colored where it adds meaning, ink
  where neutral; small inkSoft units beside them.
- **Accessibility:** min 44pt touch targets; status is **never color-only** —
  always pair the dot/color with the status word or value.

---

## 10. Scope guardrails (do NOT build — Phase 2+)

From the handoff, restated because they're easy to accidentally add when copying
the Function Health references:

- ❌ Biological Age / any composite **health score** — VITAL's hero is a **count**.
- ❌ AI Clinician Notes / Chat / Protocols.
- ❌ MRI / imaging.
- Adopt the **look** of the references, not those features.

---

## 11. Definition of done for the redesign

1. Theme is single-source via `constants/tokens.js` (✅ done); `ACTIVE_THEME` =
   warm-paper; brand fonts loaded via `expo-font` (☐ pending).
2. All `components/ui/` primitives restyled per §6.1; no dark/gold/serif tokens
   remain referenced.
3. The three signature data-viz patterns implemented (count-bar hero, category
   ratio bars, range-reference chart).
4. All 13 screens re-skinned and wired to the §8 data contract (incl. the
   admin-controlled content fetches with fallbacks).
5. `pnpm -r typecheck` passes; app boots in **Expo Go**; no native-only deps added.
6. No business logic duplicated out of `@vital/shared`.

---

*Pair this with `DESIGN_HANDOFF.md` (visual language) and the Function Health
reference screens (tone + the three data visuals). This doc is the structural
contract; the handoff is the skin.*
