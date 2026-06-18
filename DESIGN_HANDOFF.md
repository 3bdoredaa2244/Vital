# VITAL — Frontend Design Handoff (v2 · "Warm Paper" direction)

> This **supersedes** the earlier dark/gold/serif direction. The new visual
> language is derived from the **Function Health** reference screens: a warm,
> light, editorial, data-forward aesthetic. Pair this doc with those reference
> images when briefing the designer.

The app stays the same product (same screens, flows, data, and API). What
changes is the **look**: from dark luxe → **light "paper", bold type, and
numbers-as-hero data viz.**

> Brand line: **"Know your body. Before it fails you."**
> Mood: a calm, premium **health journal** on warm paper. Big confident
> typography, huge legible numbers, lots of whitespace, hairline dividers
> instead of heavy cards. Clinical but human.

---

## 0. Adopt vs. exclude (scope guardrails)

**Adopt the visual language from the references:**
- Warm paper canvas, bold editorial type, generous whitespace
- Count-bar hero, category proportional status bars, range-reference line chart
- Inline status line (`● status · value unit`)
- Outline line-icons, light bottom tab bar with a single accent

**Do NOT build (these appear in the Function shots but are out of VITAL Phase 1 scope):**
- ❌ Biological Age / any composite "health score" (Phase 2)
- ❌ AI Clinician Notes / Chat / Protocols (Phase 2 AI)
- ❌ MRI Scans / imaging (future phase)
- VITAL's hero is a **count of statuses + "X of Y optimal"** — a count, *not* a score.

---

## 1. Framework & libraries (unchanged)

| Concern | Choice |
|---|---|
| App framework | Expo (React Native), runs in Expo Go |
| Navigation | Expo Router (file-based) — stacks + 3-tab bottom bar |
| Styling | NativeWind (Tailwind for RN) |
| Animation | React Native Reanimated 3 |
| Forms | React Hook Form + Zod |
| Charts | react-native-svg (custom range bar + line chart) |
| Icons | lucide-react-native (use the **outline / thin-stroke** style) |
| Payments UI | react-native-webview (Paymob iframe) |

---

## 2. Design tokens (NEW — light "Warm Paper")

### Colors

```
/* canvas & surfaces */
canvas       #FBF6EC   app background — warm cream "paper"
panelWarm    #F3EAD9   sectioned/inset background, subtle grouping
card         #FFFFFF   raised cards (use sparingly — prefer dividers)
panelSlate   #6E8BA0   accent feature panel (muted slate blue)
line         #E7DECC   hairline dividers & borders

/* ink (text) */
ink          #20201C   primary text & headings (warm near-black)
inkSoft      #6B6459   secondary / body-dim
inkMuted     #A79E8D   tertiary, placeholders, captions

/* status (data only — never used for interactive chrome) */
green        #6FA97D   optimal / in range
greenInk     #3E7A53   optimal big-number text emphasis
amber        #CDA24E   suboptimal / review
rust         #C2603C   alert / out of range
untested     #B6AD9C   no result yet

/* brand / interactive accent */
accent       #C2603C   active tab, links, selected, accent marks (clay/terracotta)
ink-button   #20201C   primary button fill (cream text on ink)
```

Notes:
- **Cards are optional.** Function leans on the cream canvas + hairline dividers,
  not boxed cards. Use `card`/shadow only for true elevation (the slate feature
  panel, bottom sheets). Most lists are just rows + `line` dividers.
- The accent (clay) is intentionally in the same family as `rust` (alert), as in
  the reference. Status colors only appear in data contexts, so meaning stays
  clear.
- **Primary buttons are ink charcoal with cream text** (editorial, high contrast)
  — not the accent.

### Status system (VITAL keeps 4 states; Function only had 3)

| Status | VITAL meaning | Color | Inline label |
|---|---|---|---|
| `optimal` | within functional-optimal window | green `#6FA97D` | "Optimal" |
| `suboptimal` | within lab-normal, outside optimal | amber `#CDA24E` | "Review" |
| `alert` | outside lab-normal | rust `#C2603C` | "Alert" |
| `untested` | no result | untested `#B6AD9C` | "Untested" |

---

## 3. Typography (NEW — bold editorial sans)

Out: Cormorant Garamond serif. In: a **bold humanist/grotesque sans** for
headings and numbers, with a clean sans for body — matching Function's heavy,
confident type.

| Role | Font (Google Fonts) | Weight | Used for |
|---|---|---|---|
| Display / Heading / Numbers | **Bricolage Grotesque** | 600–800 | Screen titles, biomarker names, the big stat numbers |
| Body / UI | **Inter** | 400–500 | Descriptions, paragraphs, labels, form text |
| Optional accent serif | **Fraunces** (soft serif) | 500–600 | If a warmer numeral treatment is wanted on hero values |

Scale in use:
- Hero numbers (count-bar, big values): **64–96**, bold, status-colored
- Screen titles / biomarker name: **30–40**, bold ink
- Section headers (e.g. "Why it matters?"): **20–24** bold ink (sentence case, *not* uppercase mono anymore)
- Body: **15–17**, line-height ~1.6
- Captions / units / dates: **12–13** inkSoft/inkMuted

> Big stylistic shift: drop the uppercase-mono label treatment from v1. The new
> language uses **bold sentence-case headings** and lets size/weight create
> hierarchy.

---

## 4. Data-visualization patterns (the core of this redesign)

These are the patterns to design carefully — they are VITAL's data identity.

### 4.1 Count-bar hero (Dashboard)
Big colored numerals for each status, each with a **proportional bar** sized to
its count. Reference: Function's "125 In Range / 16 Out of Range / 7 Other".

- VITAL version: **Optimal (green) · Review (amber) · Alert (rust) · Untested (gray)**.
- Each: a large bold number in its status color, a short label beneath, and a
  block/bar whose height or width is proportional to the count.
- Beneath, a quiet line: **"42 of 60 markers optimal"** (a count — not a score).

### 4.2 Category list with proportional status bars (Biomarkers / "Data")
Each category is a **full-width row**: outline icon · category name (bold ink) ·
a horizontal **ratio bar** (green segment for optimal count, amber for review,
rust for alert) with the counts printed at the segment ends. Hairline divider
between rows. Reference: Function's "Male Health → ▬▬▬ 9 · ▬ 2".

- Tap a row → category detail.
- This replaces v1's text-only "4 optimal · 1 review" summary with a **visual bar**.

### 4.3 Range-reference line chart (Biomarker detail)
Reference: the ApoB chart. Compose it as:
- A **vertical range band on the left edge** showing the reference zones —
  green "in-range/optimal" band (labeled, e.g. `< 90` or the optimal window),
  with red/rust zone(s) above/below.
- A **line across test dates** (x-axis = May 24, Dec 24, …) with **status-colored
  points** (green when optimal, amber/rust otherwise).
- The **current value labeled** above its point (e.g. green "67").
- A **dashed gray segment** to a hollow point = the projected/next test slot.
- Keep gridlines minimal; let the band + points carry it.

### 4.4 Inline status line (replaces the boxed badge)
Under the biomarker title: **`● Optimal · 5.8 %`** — a colored dot, the status
word in its color, a middot, then the bold value + unit in ink. Lighter and more
editorial than v1's bordered pill. (A small pill may still be used in dense
list rows.)

### 4.5 Big-number value treatment
Values are heroes: large, bold, colored by status where it aids meaning (the
current reading), ink where neutral. Units are small inkSoft beside the number.

### 4.6 Editorial long-form (explanatory sections)
Reference: "Clinician Notes" layout. For "What this measures / Why it matters? /
What affects this marker": bold sentence-case section header, then well-spaced
body or bullets with comfortable line-height. Generous vertical rhythm.

---

## 5. Screen inventory (same screens, re-skinned)

### Onboarding `(auth)`
1. **Welcome** — cream canvas, big bold "VITAL" wordmark in ink (Bricolage), tagline in inkSoft, **ink primary button** ("Get Started") + outline secondary ("Sign In"). Optional: a soft warm gradient or a single accent mark instead of the old dark glow.
2. **Sign Up / 3. Login** — light forms: inkSoft labels, white/cream inputs with `line` borders, accent focus ring, ink primary button. Google = outline button.
4. **Health Profile** — one-question-per-screen, thin **accent** progress bar on cream. Choice rows = cream rows with `line` borders; selected = accent border + faint accent tint. Shows computed age / BMI in accent or green.
5. **Goals** — 2-col card grid; selected card = accent border + faint tint, icon turns accent.

### Subscription `subscription/`
6. **Plans** — light cards (or divider-separated blocks). Annual/Monthly toggle as a segmented control. Premium = accent border + "Most Popular" tag. Big bold prices (Bricolage). Comparison table with hairline rows. Primary CTA = ink button on Premium, outline on Basic.
7. **Checkout** — order summary with subtotal → **14% VAT** → total (big bold total). Payment-method rows. Terms checkbox. "Pay {total} EGP" ink button → Paymob WebView (unchanged).
8. **Confirmation** — animated green check, bold "You're all set", subscription detail rows, two CTAs.

### Main app `(tabs)` — light bottom bar (Dashboard · Biomarkers · Profile), active item in **accent**, outline icons
9. **Dashboard** — top bar (avatar · "VITAL" · search). **Count-bar hero (4.1)**. Subscription strip. Category preview (rows or cards).
10. **Biomarkers** — title, **category list with proportional bars (4.2)**, search field, lightweight filter chips (category + status) and a sort/view control, then the biomarker list. Locked/subscribe state for non-subscribers.
11. **Profile** — avatar, name, health-profile rows, goals, subscription, sign out — editorial rows on cream.

### Biomarker detail `biomarker/`
12. **Biomarker Detail** — back · bold title · **inline status line (4.4)** · gray description · **range-reference chart (4.3)** · range bar (optimal/normal toggle) · "What this measures" · "Why it matters?" (bullets) · "What affects this marker" · related biomarkers (horizontal) · sticky bottom actions (Book a Test outline · Add Result ink). Manual-entry bottom sheet on cream.
13. **Category Detail** — outline icon + name + count, a **status summary (count bar)** + description, the category's biomarker list, "Why this category matters", related-category chips.

8 categories keep their identity colors but rendered on the warm canvas:
Metabolic, Hormonal, Cardiovascular, Vitamins & Nutrients, Inflammation,
Thyroid, Liver & Kidney, Complete Blood Count.

---

## 6. Component library — what changes

Same component set; restyled for light/editorial. Key deltas:

- **Button** — primary = **ink fill / cream text**; secondary = outline (`line` border, ink text); ghost = accent text. Sentence-case or light-uppercase, not heavy tracking.
- **StatusBadge → StatusLine** — prefer the **inline `● word · value`** form on detail/headers; keep a compact pill only for dense rows.
- **BiomarkerRow** (list) — cream row, outline category dot/icon, bold ink name, inkSoft "value unit · date", inline status; hairline divider. (Replaces the boxed card as the default.)
- **CategoryRow** (NEW primary) — outline icon · name · **proportional green/amber/rust ratio bar with counts**. (The card variant stays for horizontal dashboard scrollers.)
- **CountBarHero** (NEW) — the 4-up big-number + proportional bar block for the dashboard.
- **PlanCard** — light card, big bold price, green check features, ink/outline CTA, accent "Most Popular".
- **RangeBar** — keep the 5-zone bar but on light: zones in green/amber/rust at lower saturation; marker = ink with cream ring.
- **HistoryChart** — upgrade to the **range-reference style (4.3)**: left range band, status-colored points, current-value label, dashed projection.
- **ProgressRing** — keep, but on cream with status/category color; thinner track in `line`.
- **SectionHeader** — **bold sentence-case ink** (e.g. "Why it matters?"), drop the gold uppercase-mono style.
- **BottomSheet / FormField / Skeleton / EmptyState / Toast / FilterPills** — recolor to the light palette; pills selected = faint accent tint + accent border.

---

## 7. Direction summary for the designer

1. **Warm paper, not dark.** Cream canvas, ink text, hairline dividers, airy.
2. **Numbers are the product.** Big, bold, status-colored. Charts are simple and
   legible (range band + points), never decorative.
3. **Editorial type.** Bold Bricolage Grotesque headings + Inter body. No
   uppercase-mono labels.
4. **One accent (clay), green/amber/rust for status.** Restraint.
5. **Honor scope.** No biological age, AI notes, MRI, chat — adopt the *look*,
   not those features.

Use the Function Health reference images for tone, density, and the three
signature data visuals; use this doc for VITAL's screens, statuses, and
structure.
