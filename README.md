# VITAL — Preventive Health Intelligence Platform

> Know your body. Before it fails you.

VITAL is a subscription-based preventive health platform for the Egyptian
market. Users get comprehensive biomarker testing through partner labs and a
mobile-first app that stores, visualizes, and explains their health data over
time.

This repository contains the **Phase 1** build: onboarding, subscriptions &
payments, the biomarker library, categorization, and biomarker detail pages.

## Monorepo layout

```
vital/
├── apps/
│   ├── mobile/          # Expo (React Native) app — Expo Router, NativeWind, Zustand
│   ├── admin/           # Next.js admin dashboard — users, lab uploads, plans, content
│   └── api/             # Hono backend — Drizzle ORM + Supabase Postgres, Paymob
├── packages/
│   └── shared/          # Shared types, Zod schemas, biomarker dataset, status logic
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

## Tech stack

| Layer     | Choice |
|-----------|--------|
| Mobile    | Expo + Expo Router, NativeWind (Tailwind), Zustand, React Hook Form + Zod, Reanimated, react-native-svg, react-native-webview |
| Backend   | Node + TypeScript, Hono, Drizzle ORM, Supabase (Postgres + Auth + Storage), Paymob |
| Shared    | TypeScript types, Zod validation, canonical biomarker dataset (89 markers / 8 categories) |

## Getting started

```bash
pnpm install

# Backend
cp apps/api/.env.example apps/api/.env      # fill in Supabase + Paymob creds
pnpm db:migrate                              # apply migrations
pnpm db:seed                                 # seed categories, 89 biomarkers, plans
pnpm dev:api                                 # http://localhost:3000

# Mobile
cp apps/mobile/.env.example apps/mobile/.env # point EXPO_PUBLIC_API_URL at the API
pnpm dev:mobile                              # Expo — open in Expo Go (iOS/Android)

# Admin dashboard (web)
cp apps/admin/.env.example apps/admin/.env   # point NEXT_PUBLIC_API_URL at the API
pnpm --filter @vital/api db:make-admin you@example.com  # promote a user to admin
pnpm --filter @vital/admin dev               # http://localhost:3001
```

## Useful scripts (root)

| Command | What it does |
|---------|--------------|
| `pnpm typecheck` | `tsc --noEmit` across all packages |
| `pnpm db:generate` | Generate a new Drizzle migration from the schema |
| `pnpm db:migrate` | Apply migrations to the database |
| `pnpm db:seed` | Seed categories, biomarkers, and plans (idempotent) |
| `pnpm dev:api` / `pnpm dev:mobile` | Run backend / mobile in dev |
| `pnpm --filter @vital/admin dev` | Run the admin dashboard (port 3001) |
| `pnpm --filter @vital/api db:make-admin <email>` | Promote a user to admin |

## Architecture notes

- **Auth** wraps Supabase Auth. The API mirrors each user into its own `users`
  table (keyed by the Supabase auth id) and verifies the Bearer JWT on every
  protected route.
- **Subscriptions** are gated by `requireActiveSubscription` middleware — no
  active, non-expired subscription means no biomarker data.
- **Payments** use Paymob (cards, Vodafone Cash, Fawry, Meeza). The flow creates
  a pending subscription, opens the Paymob iframe in a WebView, and activates the
  subscription only after an HMAC-verified success webhook.
- **Biomarker status** (`optimal` / `suboptimal` / `alert` / `untested`) is
  computed by a single shared `classifyBiomarker` so the client and server never
  disagree.
- **The biomarker dataset** (89 markers across 8 categories, with optimal +
  normal + physiologically-plausible ranges and plain-language copy) lives in
  `packages/shared/src/data` and is the single source of truth for both the API
  seed and the mobile constants.

## API surface (v1)

All under `/api/v1`. Auth and the Paymob webhook are public; everything else
needs a Bearer token, and biomarker data additionally needs an active
subscription.

```
auth:           POST /auth/signup · /auth/login · /auth/logout · /auth/reset-password
users:          GET/PUT /users/me · PUT /users/me/health-profile · PUT /users/me/goals
subscriptions:  GET /subscription-plans · GET /subscriptions/me
payments:       POST /payments/initiate · POST /payments/webhook
biomarkers:     GET /biomarkers · GET /biomarkers/:id · GET /biomarker-categories
results:        GET /results/me · GET /results/me/:biomarkerId · POST /results · DELETE /results/:id
```

## Admin dashboard

A Next.js (App Router) web app in `apps/admin`, gated by `users.role = 'admin'`
(set via `db:make-admin`). It talks to the same Hono API under `/api/v1/admin`,
which is protected by `requireAuth` + `requireAdmin`. Modules:

- **Overview** — users, active subscriptions, revenue, results, pending uploads.
- **Users** — searchable list; per-user detail page with profile/role editing,
  subscription, recorded values, manual result entry, and lab uploads.
- **Lab results (PDF → review → confirm)** — upload a lab PDF; the API stores it
  in Supabase Storage, extracts text, and matches it against the biomarker
  library to produce **draft** rows. The admin reviews/edits values and selects
  which to import — nothing is saved until confirmed. (Parsing is heuristic by
  design; the review step keeps the data clean.)
- **Plans & pricing** — create/edit/deactivate subscription plans.
- **Biomarkers & categories** — full CRUD over the library content and ranges
  (range ordering invariant enforced server-side).

```
admin (Bearer + admin role, under /api/v1):
  overview:    GET  /admin/overview
  users:       GET  /admin/users · GET/PUT /admin/users/:id
  results:     POST /admin/users/:id/results · DELETE /admin/results/:id
  lab uploads: POST /admin/users/:id/lab-uploads · GET /admin/lab-uploads/:id
               POST /admin/lab-uploads/:id/confirm · DELETE /admin/lab-uploads/:id
  plans:       GET/POST /admin/plans · PUT/DELETE /admin/plans/:id
  categories:  GET/POST /admin/categories · PUT/DELETE /admin/categories/:id
  biomarkers:  GET/POST /admin/biomarkers · PUT/DELETE /admin/biomarkers/:id
```

> Requires a Supabase Storage bucket (`SUPABASE_STORAGE_BUCKET`, default
> `lab-results`) for the uploaded PDFs.

## Phase 1 status

- [x] Onboarding: signup, multi-step health profile, goals
- [x] Subscriptions: plans, Paymob checkout (WebView), confirmation, guard
- [x] Biomarker library: 89 markers, search, category + status filters, sort, grid/list
- [x] Categorization: category overview cards, category detail, status classification, progress rings
- [x] Biomarker detail: dual-mode range bar, history chart, explanatory sections, manual result entry
- [x] `tsc --noEmit` passes across all packages
- [x] Reproducible DB migration committed

Out of scope (future phases): AI coaching, composite health scores, lab API
import, push notifications, enterprise dashboards, imaging, genetics, supplement
store.
