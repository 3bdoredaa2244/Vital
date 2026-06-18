# VITAL — Front-End Wireframes (Design-System Handoff)

> **Purpose.** Hand-off spec for a design pass to apply the VITAL design system to
> the screens built in the Phase-1 booking + lab-partner work. Each screen lists
> the layout (text wireframe), the component inventory, and its states. The
> screens are already wired to live data and reuse the existing UI kits — this
> doc is about **visual design polish**, not new functionality.
>
> Surfaces covered:
> - **Partner portal** — `apps/partner` (new standalone Next.js web app) ← primary
> - **Admin additions** — `apps/admin` (Lab Partners, Booking Areas, Bookings)
> - **Mobile** — `apps/mobile` (Client Info onboarding, Book a Test, Notifications)

---

## 0. Design System Reference

The whole product runs the **`warmPaper`** theme (one source of truth:
`apps/mobile/constants/tokens.js`; mirrored for web in `apps/{admin,partner}/tailwind.config.ts`).
Flipping `ACTIVE_THEME` reskins everything — **do not hard-code hex; use the tokens.**

### Palette (warm-paper)
| Role | Hex | Use |
|------|-----|-----|
| canvas | `#FBF6EC` | app/page background (warm paper) |
| panel | `#F3EAD9` | inset / sidebar / chip background |
| card | `#FFFFFF` | raised card surface |
| line | `#E7DECC` | hairline borders & dividers |
| ink | `#20201C` | primary text & headings |
| inkSoft | `#6B6459` | secondary / body-dim |
| inkMuted | `#A79E8D` | tertiary, captions, placeholders |
| accent | `#C2603C` | **brand / interactive** (links, active tab, selected, primary buttons) |
| accentSoft | `#E0A98C` | hover/tint edges |
| green / greenInk | `#6FA97D` / `#3E7A53` | data: optimal / in-range (also used as web "greenInk" link/active) |
| amber | `#CDA24E` | data: suboptimal / review |
| rust | `#C2603C` | data: alert / out-of-range / destructive |

> ⚠️ **Status colors are for DATA only, never for interactive chrome.** Buttons,
> tabs, links = `accent`. Pills that encode a booking/result state = green/amber/rust.

### Type
- **Display:** Bricolage Grotesque (`font-display`) — headings, big numbers.
- **Body:** Inter (`font-sans` web / `body` mobile).
- **Mono:** Inter caps + wide tracking is used for eyebrow/section labels.

### Component kits (reuse, restyle centrally)
- **Web** (`apps/admin/components/ui.tsx`, copied to `apps/partner`): `Card, Button
  (primary|outline|ghost|danger), Field, Input, Textarea, Select, StatusPill,
  StatusDot, Spinner, Modal, Table/Th/Td, EmptyRow`, `toast`.
- **Mobile** (`apps/mobile/components/ui/*`): `Screen, Button, Field, EmptyState,
  LucideIcon, SectionHeader, StatusBadge, toast`.
- Token vocab note (mobile legacy aliases): `obsidian→canvas`, `white→ink`,
  `gold→accent`, `surface→panel`, `text→ink`, `textDim→inkSoft`, `red→rust`.
  So mobile screens written with `colors.obsidian/white/gold` already render on
  warm paper — restyle via tokens, not by renaming.

---

## 1. Partner Portal (web · `apps/partner`)

Two-column shell: fixed **sidebar** (240px, `panel/60` bg, brand wordmark + "Lab
Partner", nav, signed-in email + sign-out) and a scrolling **main** (max-w-6xl, p-8).

### 1.1 Login  ·  `/login`
```
┌───────────────────────────── canvas ─────────────────────────────┐
│                                                                   │
│                     ┌──────── card ────────┐                      │
│                     │        VITAL         │  ← display, ink      │
│                     │  Lab partner portal  │  ← inkSoft           │
│                     │                      │                      │
│                     │  Email               │  Field + Input       │
│                     │  [________________]  │                      │
│                     │  Password            │                      │
│                     │  [________________]  │                      │
│                     │  [    Sign In    ]   │  ← Button primary    │
│                     └──────────────────────┘                      │
└───────────────────────────────────────────────────────────────────┘
```
- **States:** idle · submitting (`Signing in…`, button disabled) · error (toast,
  e.g. "This account is not a lab partner") · already-authed → redirect `/`.
- **Design notes:** centered single card; this is the brand's first impression —
  give the wordmark presence, generous card padding, subtle card shadow on `line`.

### 1.2 Appointments (home)  ·  `/`
```
┌── Appointments ───────────────────────────────────────────────────┐
│ Appointments                                            (h1)      │
│ Scheduled home draws in your service areas.            (inkSoft)  │
│                                                                   │
│ [ date ▾ ]   [ Status: Booked ▾ ]                  ← filters      │
│                                                                   │
│ ┌── Table ───────────────────────────────────────────────────┐  │
│ │ Date  │ Time        │ Patient        │ Area │ Tests(plan) │ Notes │ Status │
│ │ 06-14 │ 07:00–08:00 │ Omar A.        │ New  │ premium ·   │ Gate │ ●Booked│
│ │       │             │ +20…           │ Cairo│ 50 markers  │ code │        │
│ │ …                                                           │  │
│ └────────────────────────────────────────────────────────────┘  │
│         (row click → /appointments/[userId]?booking=[id])        │
└───────────────────────────────────────────────────────────────────┘
```
- **Component:** `Table` with `Th/Td`; patient name = `accent` link + caption
  (phone/email); status via `StatusPill` (booked→active/green, completed→cancelled/
  amber, cancelled→expired/rust).
- **States:** loading (`Spinner`) · empty (`EmptyRow "No appointments."`) · populated.
- **Design notes:** this is the partner's daily worklist — optimize row scannability
  (date + time prominent, patient bold). Consider grouping by date or a "Today"
  affordance. Make the whole row a hover target (currently only some cells link).

### 1.3 Appointment / Patient Detail — **Details tab**  ·  `/appointments/[id]`
Tabs sit **next to the patient name** (segmented control: Details | Upload Results).
```
┌───────────────────────────────────────────────────────────────────┐
│ ← Appointments                                                    │
│ Omar Arafa   [ Details | Upload Results ]   ← h1 + segmented tabs │
│                                                                   │
│ ┌──── Patient ─────────────┐  ┌──── Lab tests required ───────┐  │
│ │ Name      Omar Arafa     │  │ Plan        premium           │  │
│ │ Email     omar@…         │  │ Biomarkers  50 markers        │  │
│ │ Phone     +20…           │  │ Annual tests 2                │  │
│ │ DOB       1990-05-01     │  │ • Full metabolic panel        │  │
│ │ Gender    male           │  │ • Lipids, HbA1c, …            │  │
│ └──────────────────────────┘  └───────────────────────────────┘  │
│ ┌── Scheduled appointment ─┐  ┌──── Notes ────────────────────┐  │
│ │ Date   2026-06-14        │  │ "Gate code 1234, call on      │  │
│ │ Time   07:00–08:00       │  │  arrival."                    │  │
│ │ Area   New Cairo         │  │                               │  │
│ │ Address 12 St, …         │  │ 3 results on file · 1 upload  │  │
│ │ ● Booked                 │  │                               │  │
│ └──────────────────────────┘  └───────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────┘
```
- **Component:** 2×2 grid of `Card`s; each uses an eyebrow label (mono caps,
  `inkMuted`) + label/value rows (`Row` = inkMuted label / ink value, `line` divider).
- **Mapping to requirements:** Patient = 1a · Lab tests required (plan) = 1b ·
  Scheduled appointment = 1c · Notes = 1d.
- **States:** loading (`Spinner`) · no active plan ("No active subscription plan.")
  · no notes ("No notes provided.") · appointment resolved from `?booking=` else
  latest booked.
- **Design notes:** these 4 cards are the at-a-glance brief — establish a clear
  visual hierarchy (Patient + Appointment are the "act on it" cards; Tests + Notes
  are context). Address/notes are operationally critical → make them legible and
  copy-able. Segmented tab control needs a proper selected state (`accent`).

### 1.4 Appointment / Patient Detail — **Upload Results tab**
```
┌──── Upload Results (Card) ───────────────────────────────────────┐
│ [ Lab PDF: choose file ]  [ Lab name ____ ]  [ Test date ▾ ]      │
│                                            [ Upload & parse ]     │
│ ─────────────────────────────────────────────────────────────── │
│ Review parsed results                                            │
│ Remap a row with the dropdown, or map an unmatched row.          │
│                                                                  │
│ ☑ [ HDL Cholesterol ▾ ]  [ 55  ]  mg/dL   85%                    │
│      from PDF: HDL-C                                              │
│ ☑ [ LDL Cholesterol ▾ ]  [ 120 ]  mg/dL   90%                    │
│      from PDF: LDL                                               │
│ ☐ [ — unmatched: pick a biomarker — ▾ ] [ 6.1 ] %    60%        │
│      from PDF: A1C                                                │
│                                                  [ Import selected ]│
└──────────────────────────────────────────────────────────────────┘
```
- **Row anatomy:** include `checkbox` · biomarker **`Select`** (remap / map
  unmatched; options = active catalog from `GET /lab-partner/biomarkers`) ·
  value `Input` · unit (follows selected marker) · confidence %. Caption shows the
  raw "from PDF: …" text.
- **States:** no file · uploading (`Uploading…`) · parsed-with-rows (review) ·
  parsed-empty (toast "no values auto-detected") · importing (`Importing…`) ·
  success (toast "Imported N result(s) — the patient has been notified", view resets).
- **Design notes:** the review list is the highest-stakes screen (wrong value →
  wrong patient record). Use confidence to draw the eye (e.g. tint low-confidence
  rows amber), make the checkbox + value field obviously editable, and make
  "Import selected" a clear primary commit. Consider a quiet PDF-preview link
  (`file_url` is available) so the partner can cross-check.

---

## 2. Admin Additions (web · `apps/admin`)

Same shell/kit as the partner app. Sidebar gains **Lab Partners** (+ existing
**Booking Areas**, **Bookings**).

### 2.1 Lab Partners  ·  `/partners`
```
┌── Lab Partners ──────────────────────────────────────────────────┐
│ Lab Partners                                                     │
│ Create accounts and assign the service areas they cover.         │
│ ┌── New partner (Card) ─────────────────────────────────────┐   │
│ │ Full name [____]  Email [______]  Temp pw [____] [Create] │   │
│ └───────────────────────────────────────────────────────────┘   │
│ ┌── partner (Card) ─────────────────────────────────────────┐   │
│ │ Cairo Labs                                       [Remove] │   │
│ │ ops@cairolabs.com                                         │   │
│ │ ASSIGNED AREAS                                            │   │
│ │ ( New Cairo* )  ( Maadi )  ( Zamalek )   ← toggle chips    │   │
│ └───────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────┘
```
- **Area chips** are toggle buttons (selected = filled `greenInk`/`accent`).
- **States:** loading · empty ("No lab partners yet.") · no areas exist yet ·
  create validation (toast) · creating (`Creating…`).
- **Design notes:** the area chips are the core interaction — give selected/
  unselected an unambiguous, on-system treatment (currently an inline style stub
  `--green-ink`; replace with `accent`/`panel` tokens).

### 2.2 Booking Areas  ·  `/areas`  (already built — restyle only)
Per-area `Card` with inline editable city / default-window length / active toggle,
expandable **schedule editor** (weekly windows list + add row; date overrides:
close-a-date or custom windows). Heavy form surface → needs spacing/rhythm pass.

### 2.3 Bookings  ·  `/bookings`  (already built — restyle only)
Filter row (area / date / status) + `Table` (Date, Time, Area, Customer, Address,
Status pill). Mirror the partner Appointments table styling.

---

## 3. Mobile (`apps/mobile`)  — warm-paper, native

### 3.1 Client Info (onboarding)  ·  `/(auth)/client-info`
```
┌─ Screen (scroll) ─────────────┐
│ A bit about you               │  display, ink
│ This helps us tailor guidance │  inkSoft
│                               │
│ ACTIVITY LEVEL                │  eyebrow (accent)
│ ┌───────────────────────────┐ │
│ │ Sedentary   ·  little ex. ○│ │  selectable rows
│ │ Light       ·  1–3 / wk   ○│ │  (selected = accent tint
│ │ Moderate    ·  3–5 / wk   ●│ │   + dot)
│ │ Active …                   │ │
│ └───────────────────────────┘ │
│ HOME LOCATION                 │  eyebrow
│ ┌── Google Map (WebView) ───┐ │  search + tap-to-pin
│ │           📍              │ │  (falls back to a notice
│ └───────────────────────────┘ │   card if no maps key)
│ [ Address (multiline) ______ ]│
│ [        Continue          ]  │  Button
└───────────────────────────────┘
```
- **States:** map available vs **fallback notice** (no `EXPO_PUBLIC_GOOGLE_MAPS_KEY`)
  · address required (toast) · saving.
- **Design notes:** activity rows = radio-card pattern; ensure selected state and
  the map container read as on-system (rounded, `line` border, `panel` fallback).

### 3.2 Book a Test  ·  `/booking`
```
┌───────────────────────────────┐
│ ‹  Book a Test                │  header
│ YOUR BOOKINGS                  │  (only if any)
│ ┌ New Cairo · 2026-06-14    ┐  │  card + Cancel (rust)
│ │ 07:00–08:00        Cancel │  │
│ └───────────────────────────┘  │
│ AREA                           │
│ ( New Cairo* ) ( Maadi ) …     │  horizontal chips
│ ┌Su┐┌Mo┐┌Tu┐┌We┐ …  date strip │  selected=accent; closed=dim
│ │14││15││16││17│                │
│ SLOTS                          │
│ ┌ 07:00 – 08:00     5 left  ┐  │  tappable; full=disabled/rust
│ ┌ 08:00 – 09:00     Full    ┐  │
└───────────────────────────────┘
```
- **States:** loading · no areas (`EmptyState`) · loading slots · date closed /
  no windows · slot full (disabled) · booking (in-flight) · success/err toast.
- **Design notes:** chips + date strip + slot list is a 3-step funnel — make the
  selected area/date obvious and the "N left / Full" capacity legible (green vs
  rust). Slot cards are the primary CTA surface.

### 3.3 Notifications (entries added)
New feed item types use existing card; **icon mapping only**: `booking →
CalendarCheck`, `results → FlaskConical`. Severity `info` → secondary-accent.
Tapping routes via stored deep-link (`booking`, `(tabs)/biomarkers`).
- **Design note:** ensure the two new icons read consistently with existing
  alert/retest/score items.

---

## 4. Handoff checklist for the design pass
1. Drive everything from `tokens.js` / `tailwind.config.ts` — no new hex.
2. Keep **interactive = accent**, **data state = green/amber/rust**; fix the few
   inline-style stubs (partner area chips, segmented tabs) to use tokens.
3. Define on-system treatments for the repeated patterns: **segmented tabs**,
   **toggle chips**, **label/value `Row`**, **review-list row**, **filter bar**,
   **status pill**, **eyebrow label**.
4. Tighten table density + empty/loading states across partner + admin.
5. Elevate the two highest-stakes screens: partner **Upload/Review** (correctness)
   and **Appointment Details** (operational brief).
6. Mobile: radio-cards, chips, date strip, slot cards, map container.
```
Routes index
  partner:  /login · / (Appointments) · /appointments/[id] (Details | Upload)
  admin:    /partners · /areas · /bookings
  mobile:   (auth)/client-info · /booking · /notifications
```
