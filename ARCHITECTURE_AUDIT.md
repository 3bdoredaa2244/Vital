# VITAL — Complete Technical Architecture Audit

> **Preventive Health Intelligence Platform**
> Prepared as a senior-engineer onboarding & architecture reference.
> Scope: full repository at `e:\work\vital` — every app, package, migration, and config file was read.
> Conventions: file references are given as `path:line`. Anything not directly evidenced in code is marked **[INFERENCE]**.

---

## Table of Contents

1. High-Level Overview
2. Repository Structure
3. Mobile Application
4. iOS Support
5. Android Support
6. Backend
7. Database
8. Supabase
9. Authentication
10. Payments
11. Admin Dashboard (+ Lab Partner Portal)
12. Shared Package
13. API Documentation
14. State Management
15. Data Flow
16. Environment Variables
17. Dependencies
18. Security
19. Performance
20. Code Quality
21. Known Issues
22. Improvements
23. Final Project Report

---

# SECTION 1 — HIGH LEVEL OVERVIEW

## What this application does

VITAL is a **subscription-based preventive-health platform for the Egyptian market**. Users subscribe to an annual plan, a lab partner draws blood at home, results are uploaded and parsed, and the mobile app stores, classifies, visualizes, and explains the user's biomarkers over time. The platform computes a **VITAL Score** (overall health, cardiometabolic, longevity, and a Levine **PhenoAge** biological age), surfaces **recommendations** (supplements/lifestyle/retests), sends **notifications**, and offers an optional **AI health assistant** (Anthropic Claude).

The README (`README.md:5-11`) describes this as "Phase 1," but the code has grown well past that scope. The repository now contains **four applications** and a shared domain package, with database migrations `0000`→`0014` showing a clear Phase 1 → Phase 2 expansion (scores, AI, interventions, notifications, home-visit booking, à-la-carte add-ons, and a lab-partner portal).

## Business purpose

- Sell annual preventive-health subscriptions (Paymob payments, EGP, 14% VAT).
- Deliver comprehensive biomarker testing through partner labs (home blood draws scheduled via the app).
- Provide a mobile-first experience that interprets lab data using a **functional-medicine "optimal" range** model (tighter than standard lab-normal), so users see actionable status, not just "in range."
- Upsell à-la-carte extra biomarkers ("add-ons") at booking time.

## Target users

| Persona | App | Role |
|---|---|---|
| **End user / patient** | `apps/mobile` (Expo) | `user` — subscribes, views biomarkers, books tests, adds manual results, chats with AI |
| **Internal operator / clinician** | `apps/admin` (Next.js, port 3001) | `admin` — full CRUD, lab-PDF review, subscription grants, content & AI config |
| **Lab partner / visiting phlebotomist** | `apps/partner` (Next.js, port 3002) | `lab_partner` — sees appointments in assigned areas, uploads results, notifies patients |

## Main workflows & user journey

1. **Onboarding** — signup → multi-step health profile (DOB, gender, measurements, conditions, family history) → client info (activity level + map location) → goals (pick up to 3).
2. **Subscription** — browse plans → checkout (Paymob iframe in WebView) → HMAC-verified webhook activates the subscription.
3. **Dashboard** — status count hero ("X of Y optimal"), category summaries, links to Score / AI / Recommendations / Booking.
4. **Booking** — pick service area → date → capacity-aware time slot; optionally select paid add-on markers (separate Paymob checkout).
5. **Lab fulfilment** — partner sees the appointment, draws blood, uploads the lab PDF; the API parses it heuristically into draft rows; partner/admin reviews and confirms; results are imported and the patient is notified.
6. **Insight loop** — confirmed results recompute the VITAL Score + recommendations; notifications fire for out-of-range markers, retest cadence, and score drops; the user can ask the AI assistant grounded questions.

## Project goals, current phase, roadmap

- **Phase 1 (README, complete):** onboarding, subscriptions/payments, biomarker library, categorization, biomarker detail. README explicitly lists out-of-scope items "AI coaching, composite health scores, lab API import, push notifications…" (`README.md:144-146`).
- **Phase 2 (in the code, not in the README):** VITAL Score + PhenoAge (migrations `0003`/`0004`), AI intelligence (`0005`/`0010`/`0011`), interventions (`0006`), notifications + device tokens (`0007`), home-visit booking (`0008`), lab-partner portal (`0009`), notification templates (`0012`), add-ons (`0013`), lab reference-range capture (`0014`).
- **Quality gate:** `pnpm -r typecheck` (`tsc --noEmit`) is the only automated check; **no tests, no ESLint, no CI** (see §20).

## System architecture (ASCII)

```
        ┌──────────────────────┐        ┌──────────────────────┐        ┌──────────────────────┐
        │   MOBILE (Expo RN)    │        │  ADMIN (Next.js:3001) │        │ PARTNER (Next.js:3002)│
        │   user role           │        │  admin role           │        │  lab_partner role     │
        │  Zustand · NativeWind │        │  localStorage token   │        │  localStorage token   │
        └──────────┬───────────┘        └───────────┬──────────┘        └───────────┬──────────┘
                   │  EXPO_PUBLIC_API_URL             │ NEXT_PUBLIC_API_URL            │ NEXT_PUBLIC_API_URL
                   │  Bearer JWT                      │ Bearer JWT                     │ Bearer JWT
                   └──────────────┬───────────────────┴────────────────┬───────────────┘
                                  ▼                                      ▼
                       ┌───────────────────────────────────────────────────────┐
                       │            BACKEND API  (Hono on Node, :3000)           │
                       │  /api/v1   logger → cors → router mw → validate → hdlr  │
                       │  requireAuth · requireActiveSubscription · requireAdmin │
                       │  requireLabPartner                                      │
                       └───┬───────────────┬──────────────┬──────────────┬──────┘
                           │               │              │              │
              getUser(JWT) │   Drizzle ORM │   signedURL  │  Paymob REST  │ Expo Push / Anthropic
        admin.createUser   │  (postgres.js)│   upload     │  + HMAC hook  │
                           ▼               ▼              ▼              ▼
                 ┌──────────────────┐ ┌──────────┐ ┌────────────┐ ┌───────────────────────┐
                 │  Supabase Auth   │ │ Supabase │ │ Supabase   │ │  Paymob (payments)     │
                 │  (identity, JWT) │ │ Postgres │ │ Storage    │ │  Expo push / Claude API│
                 │                  │ │ (25 tbls)│ │ lab-results│ │                        │
                 └──────────────────┘ └──────────┘ └────────────┘ └───────────────────────┘
```

**Key architectural facts:**
- All clients are **thin REST consumers**; only the API holds secrets.
- Auth is **Supabase Auth**, but JWTs are verified server-side via `supabaseAdmin.auth.getUser(token)` (a network call), not local HMAC (`apps/api/src/middleware/auth.ts:27`).
- The API uses the **Supabase service-role key** and connects to Postgres directly via `postgres.js` (not the Supabase JS data client), so **RLS is bypassed and all authorization lives in API middleware** (`apps/api/src/db/client.ts:13`, `apps/api/src/lib/supabase.ts:9`).

---

# SECTION 2 — REPOSITORY STRUCTURE

## Monorepo architecture

- **pnpm workspaces** (`pnpm-workspace.yaml`): members are `apps/*` and `packages/*` → `apps/api`, `apps/mobile`, `apps/admin`, `apps/partner`, `packages/shared`.
- **Package manager:** pinned `pnpm@10.33.0`; Node `>=20` (`package.json:6-9`).
- **`.npmrc`:** `node-linker=hoisted` — required because React Native's Metro bundler cannot resolve pnpm's default symlinked/isolated `node_modules`. Expo's monorepo guide mandates a flat layout.
- **pnpm override:** `react-native-css-interop` pinned to exactly `0.1.22` (`package.json:23-27`) — the styling runtime behind NativeWind 4; pinned to avoid Metro/NativeWind resolution breakage.
- **TypeScript base** (`tsconfig.base.json`): `strict`, plus `noUncheckedIndexedAccess` and `noImplicitOverride`; `moduleResolution: Bundler`; `isolatedModules`. Each package has its own `tsconfig.json` extending the base. The root `tsconfig.json` instead extends `expo/tsconfig.base` (editor convenience).
- **Root scripts:** `build`/`typecheck`/`lint` are recursive (`pnpm -r …`); `dev:api`, `dev:mobile`, and the `db:*` scripts are filtered to `@vital/api`.

## Directory purpose map

```
vital/
├── apps/
│   ├── api/        Hono backend — REST API, Drizzle schema+migrations+seeds, Paymob, Supabase, AI, scoring
│   ├── mobile/     Expo (React Native) app — Expo Router, NativeWind, Zustand, the end-user product
│   ├── admin/      Next.js 14 App Router dashboard (port 3001) — internal operations console
│   └── partner/    Next.js 14 App Router portal (port 3002) — lab partner appointments & uploads
├── packages/
│   └── shared/     @vital/shared — types, Zod schemas, biomarker dataset, classification + scoring logic
├── docs/           frontend-wireframes.md (design handoff for booking + partner work)
├── design/         mockup.html (static visual mockup)
├── README.md, DESIGN_HANDOFF.md, FRONTEND_ARCHITECTURE.md, TRIAL.md
├── package.json, pnpm-workspace.yaml, .npmrc, tsconfig.base.json, tsconfig.json
└── pnpm-lock.yaml
```

## Dependency relationships

```
@vital/shared  ◄──────────────┬───────────────┬───────────────┬──────────────┐
 (types, schemas,             │               │               │              │
  dataset, classify,      apps/api        apps/mobile      apps/admin     apps/partner
  score, recommend)        (workspace:*)   (workspace:*)    (workspace:*)  (workspace:*)
```

- Every app imports `@vital/shared` as `workspace:*`. The shared package **ships raw TypeScript source** (`main`/`types` → `src/index.ts`) — consumers transpile it directly through their bundlers; there is no compiled-artifact dependency.
- No app imports another app. The API is the only integration point between clients.

---

# SECTION 3 — MOBILE APPLICATION

App root: `apps/mobile`. **Expo SDK 54 / React Native 0.81.5 / React 19.1**, Expo Router v6 (file-based, typed routes), New Architecture enabled. Workspace package `@vital/mobile`, consuming `@vital/shared`.

## Folder structure

```
apps/mobile/
├── app/                    Expo Router routes (file = route)
│   ├── _layout.tsx         root Stack; fonts, hydrate(), providers, ToastHost
│   ├── index.tsx           entry redirect (auth status → tabs or welcome)
│   ├── (auth)/             onboarding stack (welcome, login, signup, health-profile, client-info, goals)
│   ├── (tabs)/             main app tabs (dashboard, biomarkers, profile)
│   ├── biomarker/          detail [id] + category/[slug]
│   ├── subscription/       plans, checkout, confirmation
│   ├── booking/            index, addons, addon-checkout
│   ├── insights/           AI assistant
│   ├── notifications/      in-app feed
│   ├── recommendations/    interventions
│   └── score/              VITAL Score page
├── components/             ui/* primitives, biomarker/* feature parts, Logo, LocationPicker
├── constants/              biomarkers.ts, categories.ts, theme.ts, tokens.js/.d.ts
├── lib/                    api.ts, auth.ts, format.ts, library-select.ts, push.ts, store/*
├── assets/                 fonts (Inter, BricolageGrotesque), icons, splash, logo
├── app.json, babel.config.js, metro.config.js, tailwind.config.js, global.css, tsconfig.json
```

## Expo configuration (`app.json`)

- name `VITAL`, slug `vital`, scheme `vital` (deep links `vital://`), version `0.1.0`, orientation portrait, `userInterfaceStyle: light`, **`newArchEnabled: true`** (Fabric/TurboModules).
- splash `#FBF6EC` warm cream; iOS `supportsTablet: true`, `bundleIdentifier app.vital.mobile`; Android `package app.vital.mobile`, adaptive icon.
- **plugins:** `expo-router`, `expo-secure-store`, `expo-notifications`, `expo-font` (bundles BricolageGrotesque.ttf + Inter.ttf).
- `experiments.typedRoutes: true`.
- **No EAS config** (no `extra.eas.projectId`, no `eas.json`, no `runtimeVersion`/`updates`). **[INFERENCE]** EAS Build is not wired; `lib/push.ts` reads `Constants.expoConfig?.extra?.eas?.projectId` which is `undefined`, so Expo push-token minting fails outside a configured build.

## Routing, navigation, layouts

- **Root `_layout.tsx`**: a Stack (`headerShown:false`, content bg `colors.obsidian`, `slide_from_right`). Mounts `GestureHandlerRootView` + `SafeAreaProvider`, loads fonts via `useFonts`, calls `hydrate()` once, holds the splash until fonts load, mounts `ToastHost`.
- **`index.tsx`** reads `useAuthStore(s => s.status)`: `idle`/`loading` → spinner; `authenticated` → `Redirect /(tabs)/dashboard`; else → `/(auth)/welcome`.
- **Three gating layers:** (1) authenticated? (index + `(tabs)/_layout` re-guard); (2) active subscription? (dashboard/biomarkers/score via `useSubscriptionStore.hasActive()`); (3) feature flags (AI via `aiApi.status`).
- `(tabs)/_layout.tsx` is a Tabs navigator (dashboard/biomarkers/profile); on auth it fires `useSubscriptionStore.fetch()`. **Note:** tab label font `DMMonoLight` is not loaded → system-font fallback **[INFERENCE: legacy leftover]**.

## Authentication flow (mobile)

- **Token storage — `lib/auth.ts`** (expo-secure-store): keys `vital.access_token`, `vital.refresh_token`; `setSession/getAccessToken/getRefreshToken/clearSession/isAuthenticated`. **No expiry check, no auto-refresh** — token is used verbatim until a 401.
- **Auth store — `lib/store/auth.ts`**: `{ user, status }`.
  - `hydrate()` (on launch): reads token → if none, `unauthenticated`; else `userApi.me()` → success sets user + `registerForPushNotifications()`; failure clears session. This is the de-facto token-validity check.
  - `applySession(access, refresh?, user?)`: persists tokens, fetches/uses user, registers push.
  - `signOut()`: best-effort `authApi.logout()`, clears session, resets push, clears score store.
- **Login** (`(auth)/login.tsx`): RHF + `zodResolver(loginSchema)` → `authApi.login` → `applySession` → `router.replace('/(tabs)/dashboard')`. Forgot-password uses a neutral message (no enumeration). Google button is a placeholder toast.
- **Signup** (`(auth)/signup.tsx`): `signupSchema`; on success applies session (if a token is returned) then `router.replace('/(auth)/health-profile')`.

## Zustand stores (7, in `lib/store/`)

All vanilla `create`, **none use `persist`** (in-memory only):
1. **auth** — `{user, status}`; hydrate/applySession/refreshUser/signOut. Cross-store: clears score on sign-out, triggers push.
2. **onboarding** — multi-step form (`step`, dob, gender, measurements, conditions, family history, goals); `next/back/goTo/progress()/toHealthProfile()/reset()`.
3. **biomarkers** — library **UI** filters `{category, status, sort, search, view}`.
4. **subscription** — `{subscription, loaded, loading}`; `fetch()`, and the central paywall predicate **`hasActive()`** = active && `expires_at > now`.
5. **score** — `{score, history, loaded, loading}`; `fetch(force?)` runs `scoreApi.get()`+`history()` in parallel with a dedupe guard.
6. **addons** — `{selected: string[]}`; `toggle/isSelected/clear`. Cleared after add-on payment.
7. **library** — biomarker **data** `{biomarkers, categories, …}`; `fetch(force?)` loads `biomarkerApi.list({limit:200})` then enriches each marker with its category via a Map.

## API layer (`lib/api.ts`)

- Base URL `EXPO_PUBLIC_API_URL ?? http://localhost:3000/api/v1`.
- `request<T>()` builds URL + query, sets JSON content-type, injects `Authorization: Bearer <token>` from SecureStore (unless `auth:false`), parses the `{error:{code,message,details}}` envelope into an `ApiError`. **No timeout, no retry, no refresh-on-401.**
- Endpoint groups: `authApi`, `userApi`, `bookingApi`, `subscriptionApi`, `biomarkerApi`, `contentApi`, `scoreApi`, `aiApi`, `recommendationApi`, `notificationApi`, `addonApi`, `resultApi`. Public (no auth): plans, app-content, health-goals, ai-status, auth signup/login/reset.

## Screens (purpose · nav · API · state · interactions)

**Auth group**
- `welcome` — branded splash, Reanimated glow, tagline from `contentApi.get()`; CTAs → signup/login.
- `login` / `signup` — see Auth flow above.
- `health-profile` — multi-step from `useOnboardingStore`; DOB regex, live age/BMI; finish → `healthProfileSchema.safeParse` → `userApi.updateHealthProfile` → `refreshUser` → `client-info`.
- `client-info` — activity level + `LocationPicker` (WebView Google Map) → `userApi.updateClientInfo` → `goals`.
- `goals` — pick ≤3; options from `contentApi.goals()`; `goalsSchema.safeParse` → `userApi.updateGoals` → `subscription/plans`.

**Tabs**
- `dashboard` — greeting, notification bell (unread badge), AI flag; if `!hasActive()` → subscribe empty state; else status count-bar hero, DashCard links (Score, AI, Recommendations, Book a Test), subscription summary, category row. Uses library + score + subscription stores.
- `biomarkers` ("Labs Summary") — richest screen; `StatusDial` hero, status breakdown filters, data-derived insight callout deep-linking `/insights?ask=…`, search, FilterPills, sort, status-grouped marker list with compact `RangeBar`, test-history table. Loads library + `resultApi.all()`.
- `profile` — health profile rows, goals, subscription card, Sign Out (clears auth+subscription+library stores).

**Biomarker**
- `biomarker/[id]` — `biomarkerApi.get(id)` + `resultApi.forBiomarker(id)`; header value/status, lab reference range, `RangeBar` with optimal/normal toggle, `HistoryChart`, prose sections, related markers, sticky "Book a Test" + "Add Result" (`ManualResultSheet`). Save → reload + `refreshLibrary(true)`.
- `biomarker/category/[slug]` — `ProgressRing` for optimal share, marker list, related categories.

**Subscription**
- `plans` — `subscriptionApi.plans()`, billing toggle, `PlanCard`s, comparison table → `checkout?planId=`.
- `checkout` — order summary with **14% VAT**, payment-method list (display only), `initiatePayment` → Paymob `iframe_url` in WebView; `onNavigationStateChange` watches success/approved → refresh subscription → `confirmation`. (Server webhook is source of truth.)
- `confirmation` — Reanimated success animation, subscription detail, CTAs.

**Booking**
- `booking/index` — area chips, 14-day capacity-aware date strip, time-window slots; book or reschedule; if add-ons selected → `addon-checkout`. "Your bookings" with Edit/Cancel.
- `booking/addons` — markers grouped by category; toggle into `useAddonStore`; subtotal+VAT footer (no payment here).
- `booking/addon-checkout` — `addonApi.initiatePayment(bookingId, selected)` → server line items → Paymob WebView; success clears addon store → `/booking`.

**Other**
- `insights` — VITAL AI; gated by `aiApi.status()`; published insights/protocols, chat thread (optimistic), optional Generate; accepts `?ask=` seed; always shows disclaimer.
- `notifications` — `notificationApi.feed()`, marks all read on open; severity/type icon maps; tappable deep links.
- `recommendations` — `recommendationApi.me()`; cards per `RecommendedIntervention` with evidence pill, matched-marker chips.
- `score` — `ScoreHero`, sub-score grid (biological age + delta, cardiometabolic, longevity, confidence), coverage, driver lists, "How your score works" modal.

## Components, theme, fonts, charts

- **UI primitives** (`components/ui/*`): Button, RangeBar (View-based 5-zone bar), HistoryChart (SVG line chart), ProgressRing (SVG), ScoreHero (+Sparkline), StatusDial (SVG segmented gauge), BottomSheet, BiomarkerCard, CategoryCard, PlanCard, FormField (RHF Controller), EmptyState, ProgressBar, SkeletonLoader, StatusBadge, Toast/ToastHost, LucideIcon, Screen, SectionHeader, FilterPills. `LocationPicker` runs Google Maps in a WebView (Expo Go compatible).
- **Theming** — single source of truth `constants/tokens.js` (CommonJS; consumed by both Tailwind config and TS). Two palettes `warmPaper` (active) + `legacyDark`; `ACTIVE_THEME='warmPaper'`. A **legacy alias layer** maps old dark-theme names (`obsidian→canvas`, `gold→accent`, `white→ink`, `red→rust`) onto the active palette — which is why "obsidian" backgrounds render cream. NativeWind 4 via `withNativeWind` + `nativewind/babel`.
- **Fonts** — Inter (body) + BricolageGrotesque (display), bundled via expo-font.
- **Charts** — all hand-rolled on `react-native-svg` (no Victory/Skia, by design for Expo Go). Reanimated v4 for motion.
- **Forms & validation** — RHF + `@hookform/resolvers/zod` against `@vital/shared` schemas; non-RHF screens use `safeParse` gates.
- **Push** (`lib/push.ts`) — sets a notification handler, idempotent registration, Android channel, mints Expo token (needs EAS projectId — absent), registers device; all failures swallowed.

---

# SECTION 4 — iOS SUPPORT

- **Current support:** Configured for iOS via Expo managed workflow. `app.json` sets `ios.supportsTablet: true`, `ios.bundleIdentifier: app.vital.mobile`. Runs in **Expo Go** for development (per `TRIAL.md`).
- **Expo config / native modules:** New Architecture enabled. Native capabilities come exclusively from Expo config plugins — `expo-secure-store` (Keychain), `expo-notifications` (APNs), `expo-font`, `expo-router`, plus transitive native deps (`react-native-svg`, `react-native-webview`, `react-native-gesture-handler`, `react-native-screens`, `react-native-safe-area-context`, Reanimated). **No custom native modules** and no `ios/` directory committed (managed workflow; would be generated by `expo prebuild`).
- **Permissions:** No iOS `infoPlist` usage strings are declared in `app.json`. Notifications permission is requested at runtime in `lib/push.ts`. Location is handled in-WebView (Google Maps JS), so **no native `NSLocationWhenInUseUsageDescription` is needed today**. **[INFERENCE]** If native location/camera are added later, usage strings must be added.
- **Build process:** No `eas.json`. For a real iOS build you would add EAS config and run `eas build -p ios`, or `expo run:ios` for a local dev client (script present in `package.json`).
- **Potential issues:** (1) Push tokens won't mint without an EAS `projectId` (`lib/push.ts`); (2) APNs key/Push capability must be configured in the Apple Developer account; (3) Paymob iframe + Google Maps run in `react-native-webview` — fine on iOS but require network reachability (localhost won't work from a device; use a tunnel per `TRIAL.md`).
- **Deployment steps (to ship):** create Apple Developer account + App ID `app.vital.mobile`; configure APNs auth key; add `eas.json` + `extra.eas.projectId`; `eas build -p ios`; submit via `eas submit` / App Store Connect; provide privacy nutrition labels (health data!).
- **Required Apple Developer settings:** App ID with Push Notifications capability, APNs key, distribution certificate/provisioning (managed by EAS), App Store Connect listing. **Health-data apps face extra App Review scrutiny** — the AI disclaimer and "no diagnosis" guardrails (see §12) are relevant here.

---

# SECTION 5 — ANDROID SUPPORT

- **Architecture:** Same managed Expo workflow; New Architecture on. `app.json` sets `android.package: app.vital.mobile` and an adaptive icon (foreground + `#FBF6EC` background).
- **Gradle / Kotlin:** No `android/` directory is committed — Gradle/Kotlin projects are generated by `expo prebuild` / EAS at build time. There is no custom native Kotlin/Java code.
- **Permissions:** No explicit `android.permissions` array in `app.json`. `expo-notifications` adds `POST_NOTIFICATIONS` (Android 13+) by default; the app creates a `default` notification channel at runtime (`lib/push.ts`). Location is WebView-based, so no native `ACCESS_FINE_LOCATION` is required today.
- **Native modules / prebuild:** Native deps identical to iOS (SVG, WebView, gesture-handler, screens, safe-area, Reanimated, secure-store, notifications). `expo prebuild` would materialize the Android project from the config plugins.
- **Build process / APK:** `package.json` has an `android` script (`expo run:android`) for local dev builds. For distributable artifacts you'd add `eas.json` and run `eas build -p android` (AAB for Play, or `--profile preview` for an APK). No EAS config is committed yet.
- **Known issues:** push tokens require EAS projectId; the `react-native-css-interop@0.1.22` pin + `node-linker=hoisted` are mandatory for Metro to resolve NativeWind under pnpm — removing either will break Android Metro builds.
- **Compatibility:** RN 0.81.5 / Expo SDK 54 require recent Android tooling; minSdk follows Expo SDK 54 defaults (Android 7+ typically). **[INFERENCE]** since no overrides are present.

---

# SECTION 6 — BACKEND

Backend root: `apps/api`. **Hono v4.6.12** on Node via `@hono/node-server`, TypeScript ESM, run with `tsx` (dev `tsx watch src/index.ts`, prod `tsx src/index.ts` — **no compiled build**). ORM: Drizzle (`postgres-js`). Path alias `@vital/shared` → `packages/shared/src`. Internal imports use `.js` specifiers (ESM/tsx convention).

## Architecture & folder structure

```
apps/api/src/
├── index.ts            app bootstrap, middleware, route mounting, error handling, serve()
├── routes/             14 routers: admin, ai, auth, biomarkers, bookings, content,
│                       lab-partner, notifications, payments, recommendations, results,
│                       score, subscriptions, users
├── middleware/         auth, admin, subscription, lab-partner, validate
├── lib/                paymob, supabase, storage, env, http, serialize, ai, ai-config,
│                       score, recommendations, notifications, notification-config, push,
│                       booking, addons, content, lab-pdf, lab-upload, lab-partner, pdf-parse.d.ts
└── db/                 client, schema, migrate, make-admin, migrations/*, seeds/*
```

There is **no separate "controllers" layer** — Hono route handlers are the controllers; business logic lives in `lib/*` services. Validation is centralized via `@hono/zod-validator` and the shared Zod schemas.

## Bootstrap & middleware stack (`index.ts`)

1. `app.use('*', logger())` — request logging.
2. `app.use('*', cors())` — **called with no arguments → fully permissive CORS** (reflects any origin). (Security finding, §18.)
3. `GET /health` (unversioned, unauthenticated).
4. A `v1` sub-app mounts all routers, then `app.route('/api/v1', v1)`.
   - **Prefix-mounted:** `/auth`, `/users`, `/results`, `/payments`, `/admin`, `/lab-partner`.
   - **Root-mounted** (routers declare their own full paths): subscriptions, biomarkers, content, score, ai, recommendations, notifications, bookings.
5. `app.onError` converts `ApiException` (thrown by `fail()` in `lib/http.ts`) into the `{error:{code,message,details?}}` envelope; otherwise logs and returns `server_error`. `app.notFound` returns a `not_found` envelope.
6. `serve({ fetch: app.fetch, port: env.PORT })`. `env` is validated at import (fail-fast).

## Request lifecycle (ASCII)

```
HTTP request
  → @hono/node-server (serve)
  → logger()                         (every request)
  → cors()                           (permissive)
  → /health  → c.json(ok)            (no auth, short-circuit)
  → /api/v1 → feature router
       → router middleware:
           requireAuth        → Authorization: Bearer <jwt>
                                 supabaseAdmin.auth.getUser(token)  (verify)
                                 db.select(users).where(id=user.id) (load app row)
                                 c.set('userId'), c.set('user')
           requireActiveSubscription (gated routers)
                                 active, non-expired sub? else 403
                                 c.set('subscriptionId')
           requireAdmin / requireLabPartner  (role check on c.get('user'))
       → validate('json'|'query', zodSchema)   → 400 {field,message}[] on fail
       → handler: reads c.get(...), c.req.valid(...), Drizzle queries, lib calls
                  → serializeX(row) → c.json(payload, status?)
       → (lib threw fail()? → app.onError → errorResponse)
  → Response: payload | { error: { code, message, details? } }
```

`ErrorCode → HTTP` map (`lib/http.ts`): validation_error 400, unauthorized 401, forbidden 403, not_found 404, conflict 409, unprocessable 422, payment_error 402, server_error 500.

## Middleware

- **`auth.ts` — `requireAuth`**: reject missing/non-Bearer (401); `supabaseAdmin.auth.getUser(token)`; load app `users` row by Supabase id (401 "User profile not found" if absent); attach `userId` + `user`. Note: `SUPABASE_JWT_SECRET` is declared but **never used** — verification is `getUser()`-based.
- **`subscription.ts` — `requireActiveSubscription`**: query active, non-expired sub; 403 if none; set `subscriptionId`.
- **`admin.ts` — `requireAdmin`** and **`lab-partner.ts` — `requireLabPartner`**: `user.role !== 'admin' | 'lab_partner'` → 403.
- **`validate.ts`**: wraps `zValidator`; on failure returns `validation_error` with `details=[{field,message}]`.

## Services & utilities (`lib/`)

- **paymob.ts** — 3-step Paymob flow + HMAC-SHA512 webhook verification (§10).
- **supabase.ts** — single service-role admin client (auth verify, admin user create, sign-in, reset, storage).
- **storage.ts** — `uploadLabFile` (sanitized path `userId/<ts>_<name>`, `upsert:false`) and `signLabFile` (1h signed URL).
- **env.ts** — Zod-validated env, fail-fast at boot (§16).
- **http.ts** — `ApiException`, `fail()`, `errorResponse()`, `STATUS_BY_CODE`.
- **serialize.ts** — DB row → API shape (decimals are strings in Drizzle → `Number()`).
- **ai.ts / ai-config.ts** — Anthropic Claude integration (§ below), config stored as one `app_settings` row.
- **score.ts** — `computeUserScore` (calls shared `computeHealthAssessment`) and `recordScoreSnapshot` (one per user/day, best-effort).
- **recommendations.ts** — `computeUserRecommendations` (shared rules engine).
- **notifications.ts / notification-config.ts** — lazy notification generation (out-of-range, retest cadence, score drop) + event-driven `notifyUser`; deduped via `(user_id, dedupe_key)`.
- **push.ts** — `pushToUser` via Expo's unauthenticated push endpoint; fire-and-forget, errors swallowed.
- **booking.ts** — availability resolution + **race-safe atomic capacity** (`UPDATE … SET booked_count=booked_count+1 WHERE booked_count<capacity RETURNING id`), reschedule claims-before-frees, cancel decrements; all in transactions.
- **addons.ts** — add-on catalog, order creation with price snapshotting + 14% VAT in a transaction, idempotent `markAddonOrderPaid`.
- **content.ts** — app content key-value rows merged over `DEFAULT_APP_CONTENT`.
- **lab-pdf.ts / lab-upload.ts** — heuristic PDF parsing pipeline (pdfjs-dist positional extraction with pdf-parse fallback, ~35 slug aliases, negative-context guards, confidence scoring) → draft rows → review → confirm imports results (§7/§11).
- **lab-partner.ts** — partner area scoping (`partnerCanAccessUser` = patient has ≥1 booking in a partner's area).

## AI features

- Provider: **Anthropic Claude** (`@anthropic-ai/sdk` ^0.102.0). `ANTHROPIC_API_KEY` is **optional** — features degrade gracefully.
- Model is **admin-configured** (`AiConfig.model`, default `claude-opus-4-8`); calls pass `thinking: {type:'adaptive'}` and `max_tokens`. **[INFERENCE]** if an admin selects a model without adaptive-thinking support, calls would error.
- `buildUserContext` assembles a grounded snapshot (score, biological age, latest values with change-since-previous, capped at 30 markers). System prompt enforces "stay on scope, never diagnose/prescribe." Insights generated as `draft` (if `require_review`) or `published`. Chat uses a **rolling-summary memory** (folds old messages into a per-user summary).

## Validation, error handling, logging

- Validation: Zod via `validate()`; gaps — multipart uploads and several admin/partner/booking query params bypass Zod (manual coercion/clamping; status filters passed to `eq()` without enum checks).
- Errors: uniform envelope; correct HTTP codes; lib uses `fail()`, routes use `errorResponse`.
- Logging: Hono `logger()` + `console.error` only. **No structured logging, request IDs, or audit log** for admin/payment events.

---

# SECTION 7 — DATABASE

Drizzle ORM over **Supabase Postgres**, connected via raw `postgres.js` (`db/client.ts`, `prepare:false` for the pooler), schema in `db/schema.ts`, 15 migration steps (`0000`–`0014`), seeds in `db/seeds/*`. **25 tables, no Postgres enum types, no CHECK constraints** — value/range invariants are application-enforced.

## Migration & connection mechanics

- `client.ts:13` — `postgres(env.DATABASE_URL, { prepare:false })` (pgbouncer-safe); `drizzle(queryClient, { schema })`.
- `migrate.ts` — dedicated single connection (`max:1`), applies `.sql` files in journal order, tracked in `__drizzle_migrations`.
- `drizzle.config.ts` — schema/out paths, dialect postgresql, `verbose`+`strict`. Journal format v7, 15 entries.
- Migrations are **idempotent** (`IF NOT EXISTS` + `DO $$ … duplicate_object` guards).

## Tables (exhaustive)

**Phase 1 core:**
- **users** (id = Supabase auth uid, no default; email UNIQUE; full_name; phone; **role** default `user`; date_of_birth; gender; height_cm; weight_kg; chronic_conditions text[]=`[]`; family_history text[]=`[]`; health_goals text[]=`[]`; activity_level; address; latitude/longitude numeric(10,7); created/updated_at).
- **subscription_plans** (id; name; price_egp; price_display; annual_tests_count; biomarker_count; features jsonb<string[]>=`[]`; is_active=true).
- **subscriptions** (id; user_id FK→users CASCADE; plan_id FK→subscription_plans **NO ACTION**; status default `active`; started_at; expires_at; payment_reference; created_at).
- **biomarker_categories** (id; name; slug UNIQUE; description=''; icon=''; color=`#C9A84C`; display_order=0).
- **biomarkers** (id; category_id FK→categories CASCADE; name; slug; unit; description/why_it_matters/what_affects_it; optimal_low/high; normal_low/high; min_plausible/max_plausible numeric(12,4); is_active=true; display_order=0; tags text[]=`[]`; addon_price_egp nullable; UNIQUE index on slug).
- **user_biomarker_results** (id; user_id FK CASCADE; biomarker_id FK CASCADE; value numeric(12,4); tested_at date; lab_name; notes; source default `manual`; lab_upload_id uuid **(no FK)**; reference_range; ref_low; ref_high; created_at).
- **lab_uploads** (id; user_id FK CASCADE; file_path; original_name; lab_name; tested_at; status default `parsed`; parsed jsonb<ParsedLabRow[]>=`[]`; result_count=0; uploaded_by uuid **(no FK)**; created_at).

**Phase 2:**
- **health_goals** (id; slug UNIQUE; label; icon=''; display_order=0; is_active=true).
- **app_settings** (key text **PK**; value jsonb; updated_at) — config-as-rows (ai_config, notification_config, app content).
- **score_snapshots** (id; user_id FK CASCADE; score; band; tested_count=0; total_count=0; biological_age; cardiometabolic_score; longevity_score; confidence=0; breakdown jsonb; recorded_on date; UNIQUE index (user_id, recorded_on)).
- **ai_insights** (id; user_id FK CASCADE; type; title; body; status default `draft`; model=''; source default `system`; input_tokens=0; output_tokens=0; created_at; published_at).
- **ai_chat_messages** (id; **seq bigserial** ordering tiebreaker; user_id FK CASCADE; role; content; input/output_tokens=0; created_at).
- **ai_chat_summaries** (id; user_id FK CASCADE **UNIQUE** (1:1); summary=''; covered_count=0; updated_at).
- **interventions** (id; name; slug UNIQUE; category; summary/detail/dosage; evidence_level default `moderate`; url; target_biomarker_slugs text[]; trigger_statuses text[]; is_active=true; display_order=0).
- **notifications** (id; user_id FK CASCADE; type; severity default `info`; title; body=''; link; dedupe_key; read_at; created_at; UNIQUE index (user_id, dedupe_key)).
- **device_tokens** (id; user_id FK CASCADE; token UNIQUE; platform default `ios`; created_at).
- **service_areas** (id; name; slug UNIQUE; city=''; default_slot_minutes=60; is_active=true; display_order=0; created_at).
- **availability_windows** (id; area_id FK CASCADE; day_of_week int; start_time/end_time text; capacity=1) — weekly template.
- **availability_overrides** (id; area_id FK CASCADE; date; is_closed=false; windows jsonb; UNIQUE index (area_id, date)).
- **booking_slots** (id; area_id FK CASCADE; date; start_time/end_time; capacity; booked_count=0; UNIQUE index (area_id, date, start_time)) — the materialized capacity counter.
- **bookings** (id; user_id FK CASCADE; slot_id FK CASCADE; area_id FK CASCADE; date; start_time/end_time; status default `booked`; address; latitude/longitude; notes; created_at).
- **addon_orders** (id; user_id FK CASCADE; booking_id FK CASCADE; status default `pending`; subtotal_egp; vat_egp; total_egp; payment_reference; created_at).
- **addon_order_items** (id; order_id FK CASCADE; biomarker_id FK CASCADE; name; price_egp).
- **notification_templates** (id; title; body; is_active=true; display_order=0; created_at) — visit-message presets.
- **lab_partner_areas** (id; partner_id FK→users CASCADE; area_id FK→service_areas CASCADE; created_at; UNIQUE index (partner_id, area_id)).

## Relations (`relations()` defined for 6 core tables only)

users 1—N subscriptions/results/labUploads; subscription_plans 1—N subscriptions; biomarker_categories 1—N biomarkers; biomarkers 1—N results. Phase-2 tables have FKs but no `relations()` wiring (so `db.query` relational loads aren't available for them).

## ER diagram (FK relationships; cascade unless noted)

```
                 ┌─────────────────────┐
                 │ subscription_plans  │
                 └──────────┬──────────┘
                            │ N (plan_id, NO ACTION)
┌──────────────┐  1      N  │
│    users     │────────── subscriptions
│ (=auth uid)  │
└─┬─┬─┬─┬─┬─┬──┘
  │ │ │ │ │ └─N─► lab_uploads ····(lab_upload_id, NOT a FK)···► user_biomarker_results
  │ │ │ │ └───N─► user_biomarker_results ──N──► biomarkers ──N──► biomarker_categories
  │ │ │ └─────N─► score_snapshots (uniq user_id+recorded_on)
  │ │ └───────N─► ai_insights / ai_chat_messages / notifications / device_tokens
  │ └─────────1─► ai_chat_summaries (user_id UNIQUE, 1:1)
  └───────────N─► bookings ──N──► booking_slots ──N──► service_areas
                    │ (area_id)                          ▲   ▲
                    └─N─► addon_orders ─N─► addon_order_items ─N─► biomarkers
                                                          │   │
   lab_partner_areas (partner_id→users, area_id→service_areas)
   availability_windows / availability_overrides ─N─► service_areas

Standalone: app_settings · health_goals · interventions · notification_templates
```

## Seeds (`db/seeds/index.ts`, idempotent)

8 categories, **94 biomarkers** (from `@vital/shared`), 2 plans (basic 5,999 EGP / premium 9,999 EGP), 8 health goals, 6 interventions, 3 app-content keys, 1 demo area "New Cairo" (15 availability windows), 4 notification templates, 8 add-on prices (with a **possible slug mismatch** — some addon-price slugs may not match dataset slugs, see §21).

## make-admin & DB-level constraints

- `make-admin.ts` — `UPDATE users SET role='admin' WHERE email=$1`. Admin is purely the `role` text column.
- **Enforced:** PKs, the unique constraints/indexes listed above, FKs (mostly CASCADE; `subscriptions.plan_id` = NO ACTION), NOT NULL, defaults.
- **Not enforced at DB:** no enums, no CHECK constraints, no FK on `lab_upload_id`/`uploaded_by`, no overbooking CHECK (handled in app via atomic UPDATE), the biomarker range-ordering invariant (enforced only in the Zod admin schema + seed data).

---

# SECTION 8 — SUPABASE

- **What it provides:** Auth (identity + JWT), Postgres (the database), and Storage (lab-result PDFs). The platform does **not** use Supabase's auto-generated REST/Realtime data API or RLS for data access.
- **Auth:** A single **service-role** client `supabaseAdmin` (`lib/supabase.ts:9`, `autoRefreshToken:false`, `persistSession:false`) performs: `auth.admin.createUser` (signup, partner create), `auth.signInWithPassword` (signup/login), `auth.admin.signOut`, `auth.resetPasswordForEmail`, and `auth.getUser` (verify Bearer on every protected request).
- **JWT:** Verified by `getUser(token)` (network/SDK call), not local HMAC. `SUPABASE_JWT_SECRET` is declared in env but unused.
- **Storage / buckets:** Bucket from `SUPABASE_STORAGE_BUCKET` (default `lab-results`). Files stored at `userId/<timestamp>_<sanitized-name>`, `upsert:false`; access via short-lived (1h) signed URLs. **[INFERENCE]** bucket is private (signed URLs imply it).
- **Database:** Reached directly via `postgres.js` using `DATABASE_URL` (the Postgres connection string / pooler), **not** the Supabase JS client.
- **Policies / RLS:** **Not used for app data.** Because the service-role key bypasses RLS, **all authorization is in API middleware**. (Security implication, §18.)
- **Connection flow:** Client → API (Bearer JWT) → `getUser` verifies with Supabase Auth → API queries Postgres directly with the service role.
- **User synchronization:** Supabase Auth is the identity source; the app `users` table mirrors it keyed by the Supabase uid (`auth.ts:39`, `admin.ts` partner create). **No webhook/trigger sync** — rows are created only in those two code paths. A Supabase user created out-of-band would authenticate but fail `requireAuth`'s "User profile not found" check.

---

# SECTION 9 — AUTHENTICATION

End-to-end trace:

1. **Signup** (`POST /auth/signup`, public): `signupSchema` → `supabaseAdmin.auth.admin.createUser({email_confirm:false, user_metadata:{full_name}})` (conflict if "already" exists) → insert `users` row keyed by the Supabase uid → **immediately** `signInWithPassword` to issue tokens. Returns 201 `{user, access_token, refresh_token}` (tokens may be null). **Note:** unconfirmed emails get a session immediately.
2. **Login** (`POST /auth/login`, public): `loginSchema` → `signInWithPassword` → `{access_token, refresh_token, user_id}` (401 "Invalid email or password" otherwise).
3. **Logout** (`POST /auth/logout`): best-effort `auth.admin.signOut(token)`, always `{success:true}`.
4. **Reset** (`POST /auth/reset-password`, public): `resetPasswordForEmail`, always `{success:true}` (no enumeration).
5. **Token refresh:** **Not implemented on any client.** Mobile stores tokens in SecureStore and uses them verbatim; admin/partner store the access token in `localStorage`. A 401 surfaces as an error; only mobile `hydrate()`'s `me()` failure forces a logout. The refresh token is stored but never exchanged.
6. **Secure storage:** mobile = `expo-secure-store` (Keychain/Keystore); admin = `localStorage` key `vital_admin_token`; partner = `localStorage` key `vital_partner_token`.
7. **JWT verification:** server-side `supabaseAdmin.auth.getUser(token)` on every protected route, then the app `users` row is loaded and attached to context.
8. **Protected routes:** `requireAuth` on users/results/payments(initiate)/admin/lab-partner/score/ai/recommendations/notifications/bookings; biomarker data additionally requires `requireActiveSubscription`.
9. **Role checking & admin authorization:** `requireAdmin` / `requireLabPartner` compare `user.role`. Admin role is set by the `make-admin` CLI or `PUT /admin/users/:id` (accepts arbitrary role). Lab partners are created by admins (`role='lab_partner'`, Supabase user with `email_confirm:true`) and **demoted to `user`** (not deleted) on removal. Both web portals also enforce the role **client-side** after login (`auth.tsx`: "This account is not an administrator/lab partner").

---

# SECTION 10 — PAYMENTS

Provider: **Paymob** (Egyptian gateway). Lib `lib/paymob.ts`; routes `routes/payments.ts`; add-on logic `lib/addons.ts`.

## Payment flow (subscription)

1. `POST /payments/initiate` (`requireAuth` + `initiatePaymentSchema`): load plan; compute `total = round(price × 1.14)` (14% VAT). **Create a `subscriptions` row up front with `status:'expired'`** and `expires_at = now + 1y`. Run the Paymob 3-step:
   - `authenticate()` → `auth_token`.
   - POST `/ecommerce/orders` (amount in piasters, `merchant_order_id = pending.id`) → numeric order id.
   - POST `/acceptance/payment_keys` (amount, `integration_id`, hardcoded `billing_data`) → `payment_key.token`.
   Return `{payment_key, iframe_url, order_id, subscription_id, amount_egp}`. `iframe_url` is built from a **hardcoded** `accept.paymob.com` host (ignores `PAYMOB_BASE_URL`).
2. The mobile WebView opens the iframe; the user pays. The WebView nav signal is UX-only.
3. **Webhook** `POST /payments/webhook` (public) — see below — flips the subscription to `active`.

## Add-on flow

`POST /payments/addons/initiate`: `createAddonOrder` validates the booking is the user's and `booked`, requires each marker active with positive `addon_price_egp`, **snapshots prices**, computes subtotal + 14% VAT, inserts order+items in a transaction; Paymob `merchant_order_id = 'addon:'+order.id`. The `addon:` prefix routes webhook reconciliation.

## Webhook & HMAC verification

- Requires `?hmac=` query param (else 403). Parses `{ obj }`. **HMAC-SHA512** over Paymob's fixed lexicographic field list (`HMAC_FIELD_ORDER`), values concatenated, compared with **`crypto.timingSafeEqual`** (constant-time, correct).
- On `obj.success === true`:
  - add-on path → idempotent `UPDATE addon_orders SET status='paid' WHERE id=? AND status='pending'`.
  - subscription path → `UPDATE subscriptions SET status='active', started_at=now, payment_reference=ref WHERE id=merchant_order_id`.
- Always returns `{received:true}` (ack to stop retries).

## Failure cases, refunds, security

- **No idempotency on the subscription webhook path** (the add-on path is guarded; the subscription update is not) — a replayed valid webhook re-activates.
- **No amount verification** in the webhook — it trusts `success` + `merchant_order_id`, never checks `amount_cents` against the expected total.
- **No replay/nonce/timestamp freshness** check.
- **Refunds/voids not implemented** — `is_refunded`/`is_voided` are in the HMAC field list but ignored; an active subscription is never revoked.
- Declined payments leave the pending `expired` subscription / `pending` order as-is; no audit or notification.
- Secrets (`PAYMOB_*`) validated as required at boot. (Full discussion §18.)

---

# SECTION 11 — ADMIN DASHBOARD (+ LAB PARTNER PORTAL)

## Admin (`apps/admin`, Next.js 14 App Router, port 3001)

- **Architecture:** App Router with a single `(dash)` route group. **Everything is a client component** (`'use client'`) — there are no Server Components or server data fetching; all data comes from the API client at runtime. Root `layout.tsx` wires `ToastProvider` + `AuthProvider` and loads Inter + Bricolage_Grotesque via `next/font/google`.
- **Auth (`lib/auth.tsx`):** React context. On mount, reads the `vital_admin_token` from `localStorage`, calls `api.me()`, and **requires `user.role === 'admin'`** (else clears token → anon). `login()` stores the token, re-checks the role, redirects to `/`. `(dash)/layout.tsx` redirects to `/login` when `status==='anon'` and shows a spinner until `authed`.
- **API client (`lib/api.ts`):** `BASE_URL = NEXT_PUBLIC_API_URL`, Bearer from localStorage, JSON or FormData, throws `ApiError` from the envelope. Exposes ~70 typed methods covering every `/admin/*` endpoint plus `/auth/login` and `/users/me`.
- **UI kit (`components/ui.tsx`):** Button/Card/Field/Input/Textarea/Select/FilterBar/SegmentedTabs/AreaChip/LabelRow/StatusPill/StatusDot/Spinner/Modal/Table/Th/Td/EmptyRow/PageHd/KPICard. Status colors are data-only and match the shared palette. `Sidebar.tsx` lists 14 nav items.

### Admin pages (every page)

| Route | Purpose | Key API calls |
|---|---|---|
| `/` (overview) | KPI cards (users, active subs, revenue EGP, results, uploads, pending review) + active-plan breakdown bars. Notes trend deltas need snapshots (not collected). | `overview()` |
| `/users` | Searchable, paginated user list. | `users({search,limit,offset})` |
| `/users/[id]` | **Hub page.** Profile + role edit, subscription grant/edit/cancel, VITAL Score panel (with PhenoAge detail), AI insights (generate/publish/archive), recommendations, **lab upload → review → confirm**, manual result add, results table (delete). | `user`, `biomarkers`, `plans`, `updateUser`, `grant/updateSubscription`, `aiInsights`, `generateUserInsights`, `publish/archiveInsight`, `userRecommendations`, `uploadLab`, `labUpload`, `confirmLab`, `addResult`, `deleteResult` |
| `/plans` | Plan CRUD (soft delete). | `plans`, `create/update/deletePlan` |
| `/biomarkers` | Biomarker CRUD over the library (range invariant enforced server-side). | `biomarkers`, `create/update/deleteBiomarker` |
| `/categories` | Category CRUD (delete blocked if markers reference it). | `categories`, `create/update/deleteCategory` |
| `/goals` | Health-goal CRUD. | `goals`, `create/update/deleteGoal` |
| `/content` | App content (welcome tagline, support email, lab-partner block). | `content`, `saveContent` |
| `/areas` | **Booking areas** + weekly availability windows + date overrides editor. | `areas`, `create/update/deleteArea`, `windows`, `create/deleteWindow`, `overrides`, `saveOverride`, `deleteOverride` |
| `/bookings` | Filterable bookings table (area/date/status). | `bookings({areaId,date,status})` |
| `/partners` | Create lab-partner accounts; assign service areas via toggle chips; remove (demotes to user). | `partners`, `areas`, `createPartner`, `assignPartnerAreas`, `deletePartner` |
| `/interventions` | Supplement/protocol catalog CRUD. | `interventions`, `create/update/deleteIntervention` |
| `/notifications` | Notification config + broadcast + stats. | `notificationConfig`, `saveNotificationConfig`, `broadcast`, `notificationStats` |
| `/visit-notifications` | Visit-message template CRUD. | `notificationTemplates`, `create/update/deleteNotificationTemplate` |
| `/ai`, `/ai/insights` | AI config (model, persona, flags, max_tokens), usage stats, and the insight review queue. | `aiConfig`, `saveAiConfig`, `aiUsage`, `aiInsights`, `publish/archive/deleteInsight` |

### Lab-upload (PDF → review → confirm) workflow

On `/users/[id]`, `LabUploadCard` posts the PDF via `uploadLab` → API stores it in Supabase Storage and parses heuristically → `ReviewModal` opens with `upload.parsed` draft rows: each row has a biomarker remap `<select>`, editable value, confidence %, include checkbox, and a link to the original PDF; the reviewer can add markers the parser missed. `confirmLab` imports only selected rows; **nothing is saved until confirmed.**

## Partner portal (`apps/partner`, Next.js 14, port 3002)

Near-clone of admin (copied UI kit + auth pattern), scoped to the `lab_partner` role.
- **Auth (`lib/auth.tsx`):** identical pattern but requires `role === 'lab_partner'`; token key `vital_partner_token`.
- **Sidebar:** a single nav item ("Appointments"). `AlertsBell` polls `/lab-partner/notifications` every 60s for booking changes.
- **Pages:**
  - `/` (Appointments) — filterable table (date/status) of bookings in the partner's areas; rows link to the detail page with `?booking=`.
  - `/appointments/[id]` — patient + plan + scheduled appointment (with Google Maps navigate link) + add-on extras + notes; a **Notify** card (visit-template push) and an **Upload Results** tab (PDF → parse → review with remap/confidence tints → import → patient notified). Wrapped in `<Suspense>` for `useSearchParams`.
- **API client (`lib/api.ts`):** `vital_partner_token`; methods cover `/lab-partner/*` (profile, appointments, userDetail, biomarkers, uploadLab, labUpload, confirmLab, notificationTemplates, notify, notifications, markNotificationsRead).

### Admin vs Partner

Same Next.js 14 stack, UI kit, auth context shape, localStorage token pattern, and warm-paper theme. Admin is broad (14 modules, full CRUD); partner is narrow (appointments + uploads + notify), and every partner data read is **area-scoped server-side** (`partnerCanAccessUser`).

---

# SECTION 12 — SHARED PACKAGE

`@vital/shared` is the **domain core** — the one place client and server agree on shapes, validation, dataset, and health math. Ships raw TS (`main`/`types` → `src/index.ts`); subpath exports `.`, `./types`, `./schemas`, `./data/*`. Only runtime dep: `zod`.

## Types (`src/types/index.ts`)

Enums/unions: `Gender`, `ActivityLevel`, `UserRole` (`user|admin|lab_partner`), `ResultSource`, `LabUploadStatus`, `PlanName`, `SubscriptionStatus`, **`BiomarkerStatus`** (`optimal|suboptimal|alert|untested`), `CategorySlug` (8), `HealthGoal`, chronic conditions. Entities: `User`, `SubscriptionPlan`/`Subscription`/`SubscriptionWithPlan`, `BiomarkerCategory`/`Biomarker`/`BiomarkerWithResult`, `UserBiomarkerResult`, `ParsedLabRow`/`LabUpload`, admin summaries, app content (+`DEFAULT_APP_CONTENT`), **VITAL Score** types (`VitalScore`, `PhenoAgeResult`, `CategoryScore`, `ScoreDriver`), AI (`AiConfig`+`DEFAULT_AI_CONFIG`, insights, chat), interventions/recommendations, notifications (+`DEFAULT_NOTIFICATION_CONFIG`), booking, lab-partner, and API envelopes.

## Schemas (`src/schemas/index.ts`)

Reusable: Egyptian phone `/^\+20\d{10}$/`, password (8 + upper/lower/number), iso date. Auth (signup/login/reset), users/health-profile/goals (1–3), payments, biomarker query, results (+`plausibleResultSchema(min,max)`), and the full admin set. The **`biomarkerInputSchema` `.refine`** enforces `min_plausible ≤ normal_low ≤ optimal_low ≤ optimal_high ≤ normal_high ≤ max_plausible`. Intervention triggers default to `['suboptimal','alert']`.

## Classification logic (`src/biomarker-status.ts`)

```
classifyBiomarker(value, b):
  if optimal_low ≤ value ≤ optimal_high → 'optimal'
  else if normal_low ≤ value ≤ normal_high → 'suboptimal'  (labelled "Review")
  else → 'alert'
```
`classifyBiomarkerSafe` returns `'untested'` for null/NaN. `applyLabRange` overlays the patient's printed lab range (never invents numbers). `STATUS_COLORS` (optimal `#6FA97D`, suboptimal `#CDA24E`, alert `#C2603C`, untested `#B6AD9C`) and `STATUS_LABELS` are shared with the mobile theme.

## Biomarker dataset (`src/data/biomarkers.ts`)

**8 categories, 94 biomarkers.** Each record carries 3 copy fields + the six-number range ladder + tags. Optimal windows are deliberately tighter than lab-normal (functional medicine). **Known data smell:** 5 markers appended out of order (PSA + 4 hepatic), and duplicate concepts/slugs exist (ALP×2, BUN/urea×3, hsCRP×2, fibrinogen×2, uric-acid×2) — harmless for display but the PhenoAge model targets specific canonical slugs.

## VITAL Score & health model (`src/vital-score.ts`, `src/health-model.ts`)

- `SCORE_BANDS`: excellent ≥85, good ≥70, fair ≥50, attention ≥0. `scoreBand()` clamps + matches.
- `markerHealthScore`: optimal→100, normal edges→60, plausible edges→0, piecewise-linear.
- **Levine PhenoAge** (`computePhenoAge`): 9 biomarkers with coefficients + unit conversions + neutral imputation; needs ≥4 real markers or returns null; Gompertz 10-yr mortality → phenotypic age (clamped 18–120). Carries an explicit "verify coefficients before clinical use" caveat.
- `computeHealthAssessment`: per-marker → per-category → overall (0.4 health, 0.3 cardiometabolic, 0.3 age-gap), longevity (0.5 age-gap, 0.25 each), and **confidence** = `100·(0.45·coverage + 0.3·phenoCompleteness + 0.25·recency)`. Drivers = up to 3 worst (<60) and 3 best (≥90).

## Recommendations (`src/recommendations.ts`)

`recommendInterventions`: for each active intervention, match target markers present and in a triggering status; sort by (matched count desc, evidence rank asc, display_order asc).

## Why shared code exists

Health classification, range invariants, validation parity, lab-range authority, the entire scoring model, status colors/labels, AI guardrail defaults, engagement defaults, and the seed dataset all live here so the API, mobile, admin, and partner **cannot disagree** — critical in a health context where a client/server mismatch could be unsafe.

---

# SECTION 13 — API DOCUMENTATION

All routes under `/api/v1`. **Auth** = required Bearer unless "public"; **Sub** = also requires active subscription; **Admin/Partner** = role required.

### Auth (public) — `/auth`
- `POST /auth/signup` — body `signupSchema` → 201 `{user, access_token, refresh_token}`; errors conflict/unprocessable/server_error.
- `POST /auth/login` — body `loginSchema` → `{access_token, refresh_token, user_id}`; 401.
- `POST /auth/logout` — → `{success:true}`.
- `POST /auth/reset-password` — body `resetPasswordSchema` → `{success:true}`.

### Users (Auth) — `/users`
- `GET /users/me` → `{user}`.
- `PUT /users/me` — `updateUserSchema` → `{user}`.
- `PUT /users/me/health-profile` — `healthProfileSchema` → `{user}`.
- `PUT /users/me/client-info` — `clientInfoSchema` → `{user}`.
- `PUT /users/me/goals` — `goalsSchema` → `{user}`.

### Subscriptions
- `GET /subscription-plans` (public) → `{plans}`.
- `GET /subscriptions/me` (Auth) → `{subscription|null}`.

### Payments — `/payments`
- `POST /payments/initiate` (Auth, `initiatePaymentSchema`) → `{payment_key, iframe_url, order_id, subscription_id, amount_egp}`.
- `POST /payments/addons/initiate` (Auth, `initiateAddonPaymentSchema`) → `{..., order, amount_egp}`.
- `POST /payments/webhook` (public, HMAC) → `{received:true}`.

### Biomarkers (Auth + Sub)
- `GET /biomarkers` — query `biomarkerQuerySchema` → `{biomarkers, total, categories}`.
- `GET /biomarkers/:id` → `{biomarker}` (with category, latest_result, status).
- `GET /biomarker-categories` → `{categories}`.

### Results (Auth + Sub) — `/results`
- `GET /results/me` → `{results}`.
- `GET /results/me/:biomarkerId` → `{results}` (oldest→newest).
- `POST /results` — `createResultSchema` (plausibility-checked) → 201 `{result}`; recomputes score.
- `DELETE /results/:id` (ownership-scoped) → `{success}`; recomputes score.

### Score (Auth + Sub)
- `GET /score/me` → `{score}` (live `computeUserScore`).
- `GET /score/me/history` → `{history}`.

### AI (Auth + Sub)
- `GET /ai/insights/me` → `{insights}` (published).
- `POST /ai/insights/me/generate` → `{success, generated, pending_review}` (403 if `!allow_user_generate`).
- `GET /ai/chat/me` → `{messages}`.
- `POST /ai/chat/me` — `chatInputSchema` → `{reply}`.

### Content (public)
- `GET /app-content` → `{content}`.
- `GET /health-goals` → `{goals}`.
- `GET /ai-status` → `{status}` (enabled, features, allow_user_generate, disclaimer).

### Recommendations (Auth + Sub)
- `GET /recommendations/me` → `{recommendations}`.

### Notifications
- `POST /devices` (Auth) — `registerDeviceSchema` → `{success}`.
- `GET /notifications/me` (Auth + Sub) → `{notifications, unread_count}` (lazily generated).
- `POST /notifications/me/read` (Auth + Sub) — `markReadSchema` → `{success}`.

### Bookings (Auth + Sub)
- `GET /addons` → `{addons}`.
- `GET /areas` → `{areas}`.
- `GET /areas/:id/availability` — query `from`,`days` (no Zod) → `{availability}`.
- `GET /bookings/me` → `{bookings}`.
- `POST /bookings` — `createBookingSchema` → 201 `{booking}` (atomic capacity).
- `PUT /bookings/:id` — `createBookingSchema` → `{booking}`.
- `POST /bookings/:id/cancel` → `{success}`.

### Lab Partner (Auth + `lab_partner`, area-scoped) — `/lab-partner`
`GET /me`, `GET /biomarkers`, `GET /appointments` (query date/status), `GET /users/:userId`, `POST /users/:userId/lab-uploads` (multipart), `GET /lab-uploads/:id`, `POST /lab-uploads/:id/confirm`, `GET /notification-templates`, `POST /users/:userId/notify`, `GET /notifications`, `POST /notifications/read`.

### Admin (Auth + `admin`) — `/admin`
Overview; users (list/detail/update); results (create/delete); lab uploads (upload/get/confirm/delete); plans (CRUD, soft delete); categories (CRUD, delete guarded); biomarkers (CRUD, soft delete); subscriptions (grant/update); health goals (CRUD); app-content (get/put); AI (config get/put, insights list, publish/archive/delete, generate, usage); interventions (CRUD) + user recommendations; notification-config (get/put), broadcast, stats; areas/windows/overrides; bookings list; partners (list/create/assign-areas/delete); visit templates (CRUD). (~70 endpoints; see `routes/admin.ts`.)

---

# SECTION 14 — STATE MANAGEMENT

- **Mobile:** 7 Zustand stores (auth, onboarding, biomarkers-UI, subscription, score, addons, library) — see §3. **None persist to disk** (in-memory; only the auth *token* persists, in SecureStore).
- **Hydration:** Root `_layout` calls `auth.hydrate()` once on launch; `(tabs)` and `score`/`library` stores fetch on demand with dedupe guards (`if loading return; if loaded && !force return`).
- **Persistence:** Tokens in SecureStore (mobile) / localStorage (web). All other client state is ephemeral — re-fetched per session.
- **Session handling:** the access token is the session; `hasActive()` is the paywall gate; sign-out clears stores + token + push registration.
- **Caching:** No global cache library (no React Query/SWR). The documented pattern (FRONTEND_ARCHITECTURE.md) is per-screen `useState` triads (loading→Skeleton, error→EmptyState(retry), data→render) plus the two data stores (`library`, `subscription`, `score`) as lightweight caches. Web apps fetch fresh on every page mount.

---

# SECTION 15 — DATA FLOW

```
SIGNUP                LOGIN                 SUBSCRIPTION + PAYMENT
mobile signup ──► API /auth/signup     mobile checkout ──► API /payments/initiate
   ├─ supabase.admin.createUser            ├─ create subscription (status=expired)
   ├─ insert users row (uid)               └─ Paymob 3-step → iframe_url
   └─ signInWithPassword → tokens        WebView pays ──► Paymob ──► webhook (HMAC)
                                          API /payments/webhook ──► UPDATE sub status=active

DASHBOARD / BIOMARKERS                     ADD LAB RESULTS (two paths)
mobile ──► /subscriptions/me (hasActive)   A) user: ManualResultSheet ──► POST /results
mobile ──► /biomarkers (Auth+Sub)             └─ plausibility check → insert → recompute score
   └─ each marker: applyLabRange +         B) partner/admin: upload PDF ──► parse (draft rows)
      classifyBiomarkerSafe → status          ──► review/remap ──► confirm ──► insert results
mobile ──► /results/me (history)              ──► recompute score ──► notify patient ("Results ready")

ADMIN APPROVAL ──► DATABASE ──► MOBILE UPDATE
confirm import ──► user_biomarker_results (source=lab_upload, ref range captured)
   ──► recordScoreSnapshot(user) (1/day)  ──► notifyUser + pushToUser (Expo)
mobile refetch (library.fetch(true), score.fetch(true)) ──► UI reflects new values + score
```

**Sequence — signup → first results visible:**
```
User → Mobile: fill signup
Mobile → API: POST /auth/signup
API → Supabase Auth: admin.createUser + signInWithPassword
API → Postgres: insert users
API → Mobile: {user, tokens}  (SecureStore)
Mobile → API: PUT health-profile / client-info / goals
Mobile → API: GET /subscription-plans → checkout → POST /payments/initiate
API → Paymob: orders + payment_keys → iframe_url
Mobile(WebView) → Paymob: pay
Paymob → API: POST /payments/webhook?hmac=... (success)
API → Postgres: UPDATE subscriptions active
Partner → PartnerAPI: upload lab PDF → parse → confirm
API → Postgres: insert results; recordScoreSnapshot
API → Expo Push: "Results ready"
Mobile → API: GET /biomarkers, /score/me  → render
```

---

# SECTION 16 — ENVIRONMENT VARIABLES

### API (`apps/api/.env.example`) — server-side secrets, Zod-validated, fail-fast (`lib/env.ts`)
| Var | Required | Service | Notes |
|---|---|---|---|
| `NODE_ENV` | defaulted `development` | — | not branched on in audited code |
| `PORT` | defaulted `3000` | — | `serve()` |
| `DATABASE_URL` | **yes** | Supabase Postgres | postgres.js / Drizzle / drizzle-kit |
| `SUPABASE_URL` | **yes** | Supabase | admin client |
| `SUPABASE_SERVICE_KEY` | **yes** | Supabase Auth/Storage | service role |
| `SUPABASE_JWT_SECRET` | optional | Supabase Auth | **declared but unused** |
| `SUPABASE_STORAGE_BUCKET` | defaulted `lab-results` | Supabase Storage | lab PDFs |
| `PAYMOB_API_KEY` | required (graceful if unset) | Paymob | auth |
| `PAYMOB_INTEGRATION_ID` | required* | Paymob | payment_keys |
| `PAYMOB_IFRAME_ID` | required* | Paymob | iframe URL |
| `PAYMOB_HMAC_SECRET` | required* | Paymob | webhook verify |
| `PAYMOB_BASE_URL` | defaulted | Paymob | API base (not the iframe host) |
| `PAYMENT_RETURN_URL` | defaulted | Paymob/app | declared, not referenced in code |
| `ANTHROPIC_API_KEY` | optional | Anthropic | AI; **missing from `.env.example`** |

### Mobile (`apps/mobile/.env.example`) — all `EXPO_PUBLIC_*` (bundled, public)
| Var | Required | Service |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | **yes** | VITAL API |
| `EXPO_PUBLIC_SUPABASE_URL` | declared | Supabase (**unused in app code**) |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | declared | Supabase (**unused in app code**) |
| `EXPO_PUBLIC_GOOGLE_MAPS_KEY` | optional | Google Maps JS (LocationPicker) |

### Admin & Partner (`.env.example` each)
| Var | Required | Service |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | **yes** | VITAL API |

---

# SECTION 17 — DEPENDENCIES

**Shared:** `zod ^3.23.8` (+ `typescript` dev).

**API:** `hono ^4.6.12`, `@hono/node-server ^1.13.7`, `@hono/zod-validator ^0.4.1`, `@supabase/supabase-js ^2.46.1`, `drizzle-orm ^0.36.4`, `postgres ^3.4.5`, `pdf-parse ^1.1.1`, `pdfjs-dist 4.7.76`, `@anthropic-ai/sdk ^0.102.0`, `dotenv ^16.4.5`, `zod`. Dev: `drizzle-kit ^0.28.1`, `tsx ^4.19.2`, `@types/node ^22.9.0`, `typescript`.

**Mobile:** `expo ~54.0.0`, `expo-router ~6.0.24`, `react 19.1.0`, `react-native 0.81.5`, `nativewind 4.1.23`, `react-native-reanimated ~4.1.1`, `react-native-svg 15.12.1`, `react-native-webview 13.15.0`, `zustand ^5.0.1`, `react-hook-form ^7.53.2` + `@hookform/resolvers ^3.9.1`, `lucide-react-native ^0.460.0`, expo-secure-store/notifications/font/constants/linking/splash-screen/status-bar. Dev: `@types/react ~18.3.12`, `tailwindcss ^3.4.15`, `typescript`.

**Admin / Partner (identical):** `next 14.2.18`, `react 18.3.1`, `react-dom 18.3.1`, `@vital/shared`. Dev: tailwind/postcss/autoprefixer, types, typescript.

### Findings
- **Two React majors:** mobile React **19.1.0** vs admin/partner **18.3.1**; mobile's `@types/react` is still **18.x** (types lag the React 19 runtime).
- **Two PDF libraries** (`pdf-parse` old/unmaintained + `pdfjs-dist`) for one feature — confirm/consolidate.
- **`@anthropic-ai/sdk` wired but `ANTHROPIC_API_KEY` undocumented** in `.env.example`.
- **Unused-in-code:** mobile Supabase env vars; API `SUPABASE_JWT_SECRET`, `PAYMENT_RETURN_URL`.
- TypeScript `^5.6.3` and Zod `^3.23.8` consistent (good). Next 14 (not 15) — slightly behind. Many exact pins are deliberate (RN/Expo/NativeWind stability).
- **No ESLint, no test runner** anywhere — `lint` = `tsc --noEmit`.

---

# SECTION 18 — SECURITY

1. **CORS fully open** — `cors()` with no args reflects any origin (`index.ts`). Recommend an explicit allow-list.
2. **No rate limiting** anywhere — login, signup, reset, the public webhook, and the token-cost AI endpoints are unthrottled.
3. **Service-role key is the only DB credential** — RLS is bypassed; **all authZ is in middleware**. A missed scope check anywhere exposes data. Partner access is booking-derived: once a patient has any booking in a partner's area, the partner sees that patient's full result/upload history.
4. **Payment webhook** — HMAC is correct/constant-time, but: no idempotency on the subscription path, no amount verification, no replay/nonce protection, refunds/voids ignored (§10).
5. **Tokens in `localStorage`** on web (admin/partner) — XSS-exposed (mitigated by being internal tools, but worth httpOnly cookies long-term). Mobile uses SecureStore (good).
6. **Signup issues sessions with `email_confirm:false`** — unconfirmed emails get tokens.
7. **No token refresh** — long-lived access tokens used verbatim; no rotation.
8. **Input validation gaps** — multipart uploads not Zod-validated, no file-size cap, MIME-only PDF check; some admin/partner query params unvalidated.
9. **Injection** — Drizzle parameterizes; raw `sql\`\`` is arithmetic/counts only. Low risk. Filename sanitization prevents storage-path traversal.
10. **Secrets** — all server-side, validated at boot, never logged (good). `/ai-status` exposes only non-sensitive config. Paymob error bodies may surface in a 402 `details`.

---

# SECTION 19 — PERFORMANCE

- **Rendering (mobile):** hand-rolled SVG charts (cheap), skeleton states, Reanimated on the UI thread. Biomarkers screen is the heaviest (filter/sort/group in memory over ≤200 markers) — fine at current scale.
- **API calls:** no client cache library; per-screen fetches with dedupe guards in the data stores. Web dashboards refetch on each mount. No request batching.
- **Biomarker list** does fuzzy search + per-page latest-result lookups in memory after a category query — acceptable for ~94 markers but O(n) per request.
- **DB queries / indexes:** good unique indexes on hot lookups (biomarker slug, score per user/day, notifications dedupe, booking slot, partner-area). Score/recommendation/notification computations load all active markers + a user's latest results per request — **the live `GET /score/me` recomputes the full model each call** (no caching beyond the daily snapshot).
- **Lazy loading:** Expo Router code-splits by route; Next.js App Router splits per route. No explicit dynamic imports.
- **Bundle size:** mobile avoids heavy chart libs (SVG only) — a deliberate Expo-Go constraint. `pdfjs-dist` is large but server-side only.
- **Bottlenecks (likely, at scale):** repeated full-model score computation; N+1-ish latest-result lookups; no HTTP caching headers; `getUser()` network call on every authenticated request adds latency (a local JWT verify with `SUPABASE_JWT_SECRET` would be faster — and the secret is already declared but unused).

---

# SECTION 20 — CODE QUALITY

- **Architecture:** clean separation — thin routes, `lib/*` services, a shared domain core. Config-as-DB-rows (`app_settings`) is elegant. The "one shared brain" rule is consistently followed (no duplicated classification/validation).
- **Folder organization:** consistent and idiomatic per stack (Expo Router file routes, Hono routers, Next App Router). Naming is clear and uniform.
- **Consistency:** error envelope, serialization (string decimals → numbers), and the warm-paper theme single-source are applied throughout. Admin/partner share a copied UI kit (some drift risk).
- **Scalability:** stateless API scales horizontally; the main constraints are the per-request score recompute and the lack of caching. The booking capacity logic is correctly concurrency-safe.
- **Maintainability:** strong TypeScript discipline (`strict` + `noUncheckedIndexedAccess`), shared types end-to-end. Comments are high-quality and explain *why*.
- **Technical debt:** no tests/lint/CI; docs drift (README still "Phase 1," partner app undocumented, TRIAL.md says SDK 52 vs actual 54); legacy theme aliasing (~330 call sites use legacy names); duplicate biomarker slugs; two PDF libs; in-memory-only Zustand despite a docstring claiming persistence; `localStorage` tokens on web.

---

# SECTION 21 — KNOWN ISSUES

**Build / tooling**
- No CI, no Docker, no tests, no ESLint — only `tsc --noEmit`.
- API runs via `tsx` in "prod" too (no compiled artifact).

**Dependency / version**
- React 19 (mobile) vs 18 (web); mobile `@types/react` mismatched to 18.
- Two PDF libraries; `pdf-parse` unmaintained.
- `ANTHROPIC_API_KEY` missing from `.env.example`.

**Expo / mobile**
- No EAS config → Expo push-token minting fails; real push needs a dev build (TRIAL.md).
- `react-native-css-interop` pin + `node-linker=hoisted` are load-bearing for Metro.
- `DMMonoLight`/legacy fonts referenced but not loaded (system fallback).
- Zustand `persist` not implemented despite onboarding docstring.
- Mobile Supabase env vars + Google OAuth buttons are vestigial/placeholders.

**iOS / Android**
- Health-data App Store/Play review considerations; permissions/usage strings minimal today (OK because location is WebView-based).

**Backend / potential bugs**
- Payment webhook: no idempotency (subscription path), no amount check, no replay protection, refunds ignored — **highest-priority correctness/financial risk**.
- Open CORS, no rate limiting.
- `serializePlan(plan!)`/`order!` non-null assertions assume FK integrity; **service areas are hard-deleted** while bookings inner-join them → deleting an in-use area can break partner/booking queries.
- Admin `DELETE /admin/results/:id` is unscoped and (unlike the user route) does not recompute the score snapshot.
- Broadcast uses a shared `dedupe_key` per send → repeated same-ms broadcasts could dedupe to nothing.
- Seed add-on prices: some slugs may not match dataset slugs → those updates match 0 rows.
- Out-of-band Supabase users authenticate but fail "User profile not found."

---

# SECTION 22 — IMPROVEMENTS

**Short-term (days)**
- Fix the **payment webhook**: make the subscription update idempotent, verify `amount_cents`, add replay protection, handle refund/void to revoke access.
- Lock down **CORS** to known origins; add **rate limiting** to auth + webhook + AI endpoints.
- Add `ANTHROPIC_API_KEY` to `.env.example`; update README/TRIAL (Phase 2, partner app, SDK 54).
- Guard service-area deletion (soft delete or block when bookings exist); recompute score on admin result delete.
- Align mobile `@types/react` to 19.

**Medium-term (weeks)**
- Introduce **tests** (Vitest for shared/score/classification + Paymob HMAC; supertest for routes) and **ESLint** + **CI** (typecheck + test + lint on PR).
- Add **EAS config** + push wiring; ship first TestFlight/Play internal build.
- Add **token refresh** (exchange the stored refresh token; move web tokens to httpOnly cookies).
- Consolidate PDF parsing to one library; normalize duplicate biomarker slugs.
- Cache the VITAL Score (serve the daily snapshot for `GET /score/me`, recompute on write) and add HTTP caching for static content endpoints.

**Long-term (quarters)**
- Consider local JWT verification (use `SUPABASE_JWT_SECRET`) to drop the per-request `getUser()` round-trip; or move appropriate authZ into Postgres RLS as defense-in-depth.
- Structured logging + request IDs + an **audit log** for admin/payment mutations.
- Extract the admin/partner shared UI kit into a `packages/ui` to stop drift.
- Add a client data-fetching/cache layer (React Query) to standardize loading/error/caching.
- Background jobs for notifications/score (instead of lazy on-read generation).

**Architecture / Performance / Security / DX (summary)**
- *Architecture:* shared UI package, jobs queue, optional RLS.
- *Performance:* score caching, query result caching, drop `getUser()` round-trips.
- *Security:* webhook hardening, CORS/rate-limit, token rotation, file-upload limits + content sniffing.
- *DX:* tests, lint, CI, Docker/compose for local Supabase+API, accurate docs.

---

# SECTION 23 — FINAL PROJECT REPORT

## Executive Summary
VITAL is a well-architected, TypeScript-end-to-end preventive-health platform: a pnpm monorepo with a Hono API, an Expo mobile app, two Next.js dashboards (admin + lab partner), and a shared domain package that centralizes types, validation, the biomarker dataset, and the health-scoring math. The engineering is disciplined (strict TS, shared logic, clean separation, concurrency-safe booking, idempotent migrations) and the product is substantially complete — well beyond the "Phase 1" the README advertises. The most important gaps are **operational and financial-correctness**: the Paymob webhook lacks idempotency/amount/replay protection and refund handling; there is no rate limiting, open CORS, no tests/CI, and no EAS build pipeline.

## Technology Stack
Hono + Drizzle + postgres.js + Supabase (Auth/Storage/Postgres) + Paymob + Anthropic Claude (backend); Expo SDK 54 / RN 0.81 / React 19 + Expo Router + NativeWind 4 + Zustand + RHF/Zod + react-native-svg (mobile); Next.js 14 App Router + React 18 + Tailwind (admin & partner); shared TS/Zod package.

## Architecture
Thin REST clients ↔ one Hono API ↔ Supabase + Paymob + Claude. Auth via Supabase (server-verified JWT); subscription-gated biomarker data; role-gated admin/partner; config-as-DB-rows; all domain logic in `@vital/shared`.

## Database
Supabase Postgres via Drizzle, **25 tables**, idempotent migrations `0000`–`0014`, seeds (8 categories / 94 markers / 2 plans / goals / interventions / demo area). No enums/CHECKs — invariants enforced in app/Zod. Strong unique indexes; mostly-cascade FKs.

## Mobile
Expo Router app, 7 Zustand stores, SecureStore tokens, paywall via `hasActive()`, hand-rolled SVG charts, warm-paper theme single-sourced in `tokens.js`. No EAS/push pipeline yet.

## Admin
Next.js 14, all client components, localStorage token, 14 modules incl. the lab-PDF review→confirm workflow, subscription grants, AI config/review, booking areas, and lab-partner management.

## Backend
Hono routers + `lib/*` services; centralized Zod validation + error envelope; Paymob, scoring, recommendations, notifications, push, booking, add-ons, lab parsing. Run via tsx.

## APIs
Versioned `/api/v1`; public auth/plans/content/webhook; Bearer everywhere else; biomarker data also subscription-gated; ~70 admin endpoints. Documented in §13.

## Security
Solid secrets handling and parameterized queries; **needs** webhook hardening, CORS allow-list, rate limiting, token rotation, and upload limits. Service-role key means middleware is the only authZ layer.

## Deployment
No CI/Docker/EAS today. API = Node+tsx; web = `next build/start` (3001/3002); mobile = Expo (tunnel for device); DB lifecycle = drizzle migrate + seed + make-admin; a `lab-results` Supabase bucket is required.

## Current Status
Functionally rich and type-safe; Phase 1 + most of Phase 2 implemented. Docs lag the code.

## Risks
1. Payment webhook correctness (financial). 2. No rate limiting / open CORS (abuse). 3. No tests/CI (regressions). 4. Hard-deletable in-use service areas (data integrity). 5. No EAS pipeline (can't ship mobile). 6. localStorage tokens (web XSS).

## Recommendations
Prioritize webhook hardening, CORS/rate-limiting, and a test+CI baseline; then EAS + push, token refresh, score caching, doc updates, and a shared UI package. See §22 for the phased plan.

---

*End of audit. Every section is grounded in the source files cited inline; items marked **[INFERENCE]** are reasoned conclusions, not direct code statements.*
