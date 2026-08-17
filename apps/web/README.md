# @vital/web — VITAL web client

The browser client for VITAL users. It is the web sibling of `apps/mobile`, not
a separate product: same backend, same auth model, same shared types, same
visual identity.

```
apps/web  →  apps/api (Hono)  →  Supabase / Paymob / Anthropic
```

The web app holds **no** privileged credentials. It talks only to the VITAL API
with a Bearer token, exactly as the mobile app does.

## Running it

```bash
# 1. API (port 3000)
pnpm dev:api

# 2. Web (port 3003)
pnpm --filter @vital/web dev
```

Then open <http://localhost:3003>.

Ports in this monorepo: **3000** API · **3001** admin · **3002** partner ·
**3003** web.

## Environment

Copy `.env.example` to `.env.local` and set:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Base URL of the VITAL API, including `/api/v1`. Defaults to `http://localhost:3000/api/v1`. |

Only `NEXT_PUBLIC_*` variables belong here — everything in this file ships to
the browser. Never copy values from `apps/api/.env`.

## Design system

`lib/tokens.js` is the single source of truth for colour and radii, mirroring
`apps/mobile/constants/tokens.js` role-for-role. `tailwind.config.ts` and
`lib/theme.ts` both read from it, so re-skinning is a one-file edit.

It is a deliberate copy rather than a cross-app import: `apps/web` must not
depend on the Expo app's build graph. If you change a value in the mobile
tokens file, mirror it here — the role names are identical.

Primitives live in `components/ui.tsx`. Add new ones there rather than styling
ad hoc in a page; that is what keeps web and mobile reading as one product.

## Structure

```
app/(auth)/       login, signup, forgot-password        — unauthenticated shell
app/onboarding/   health-profile → goals → client-info  — post-signup flow
app/(app)/        dashboard, score, biomarkers, results, recommendations,
                  ai, bookings, subscriptions, notifications, profile, settings
lib/api.ts        typed client, mirrors apps/mobile/lib/api.ts
lib/auth.tsx      session + subscription context
lib/use-api.ts    loading / error / subscription-gate hook
```

## The subscription gate

Most API routes sit behind `requireActiveSubscription`. Without an active plan
the API returns 403 for `/score`, `/biomarkers`, `/results`, `/ai`,
`/recommendations`, `/notifications`, `/areas`, `/bookings` and `/addons`.

That is a first-class UI state, not an error: `components/states.tsx` renders
the same "Start your health journey" gate the mobile app shows. Pages check
`hasActiveSubscription` from `useAuth()` before fetching so they don't fire
requests that are guaranteed to 403.
