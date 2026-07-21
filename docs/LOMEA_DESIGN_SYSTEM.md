# Lomea Design System

**Status:** 🔒 MANDATORY — living UI reference
**Last Updated:** 2026-07-21
**Version:** 1.0

---

## 0. About This Document

### Status
This is the **main source of truth for Lomea's visual language and UI consistency rules**.
It is a **living, mandatory** reference: read it before building or changing any UI, and
update it when a visual decision changes. It is a companion to `LOMEA_BUILDING_PRINCIPLES.md`
(architecture/process) — this document governs **look, layout, and interaction**.

### Scope
Covers the client web app (`client/src`): design tokens, color, typography, spacing, RTL,
page layout/chrome, shared components, Hebrew voice, and do/don't rules. Applies to all four
roles: **מנהל מערכת (ADMIN)**, **נותן השירות (SERVICE_PROVIDER)**, **מזמין השירות
(SERVICE_BOOKER)**, and copy referring to **מקבל השירות (SERVICE_RECIPIENT)**.

### Canonical layer
The canonical UI layer is **the global CSS in `client/src/styles.css`** (the `:root` design
tokens + the shared utility classes: `btn-*`, `form-*`, `card`, `badge*`, `modal*`, `table*`,
`empty-state*`, `toast*`, `app-*`). All values in this document are read directly from that
file — no invented tokens or hexes.

### Non-goals
- **Not a rebrand.** It documents the existing visual language as-built; it does not propose
  new brand colors or a redesign.
- **Not a component API reference (yet).** There is no blessed React component library today
  (see §7). This documents the CSS-class contract, not component props.
- Not an audit and not a cleanup task — those are separate, later phases.

---

## 1. Foundations

### 1.1 Brand principles
- **Hebrew-first, RTL-native.** The product is Hebrew and right-to-left by default
  (`<html lang="he" dir="rtl">`, `body { direction: rtl }`). LTR is the exception, not the base.
- **Calm, clean, trustworthy.** The stylesheet's own header states the intent: *"Lomea Design
  System - Modern, Clean, Trustworthy"*. Deep-blue primary, generous radius, soft shadows,
  restrained color. Avoid loud/decorative styling.
- **Consistency over novelty.** Reuse the canonical classes; do not invent per-screen variants.

### 1.2 Color — real token names and values
All defined in `styles.css` `:root` (lines 6–136).

**Neutral / interface (gray)**
| Token | Hex |
|---|---|
| `--gray-50` | `#F7FAFC` |
| `--gray-100` | `#EEF4F7` |
| `--gray-200` | `#D9E6EE` |
| `--gray-300` | `#C7D7E1` |
| `--gray-400` | `#B8C7D1` |
| `--gray-500` | `#647887` |
| `--gray-600` | `#4D6372` |
| `--gray-700` | `#304858` |
| `--gray-800` | `#1D3545` |
| `--gray-900` | `#102A3A` |

**Brand — Lomea Deep Blue (primary)**
| Token | Hex |
|---|---|
| `--primary-50` | `#EAF3F8` |
| `--primary-100` | `#D4E7F0` |
| `--primary-200` | `#A9CEE0` |
| `--primary-300` | `#7FB6D1` |
| `--primary-400` | `#549DC1` |
| `--primary-500` | `#0B4A78` |
| `--primary-600` | `#00355C` |
| `--primary-700` | `#002A49` |
| `--primary-800` | `#001F36` |
| `--primary-900` | `#001624` |

**Accent — Lomea Coral Red**
| Token | Hex |
|---|---|
| `--accent-50` | `#FDEDEC` |
| `--accent-100` | `#FAD4D1` |
| `--accent-200` | `#F4A9A3` |
| `--accent-300` | `#EE7E75` |
| `--accent-400` | `#E85347` |
| `--accent-500` | `#DB4439` |
| `--accent-600` | `#C9362D` |
| `--accent-700` | `#A92D26` |
| `--accent-800` | `#84231D` |
| `--accent-900` | `#5F1915` |
| `--accent-9` | `#84231D` (alias for `--accent-800`) |

**Semantic status**
| Token | Hex | | Token | Hex |
|---|---|---|---|---|
| `--success-50` | `#EAFBF5` | | `--danger-50` | `#FEF3F2` |
| `--success-100` | `#D1F7E9` | | `--danger-100` | `#FEE4E2` |
| `--success-500` | `#18A77A` | | `--danger-500` | `#DB4439` |
| `--success-600` | `#128B65` | | `--danger-600` | `#B42318` |
| `--success-700` | `#0F7455` | | `--danger-700` | `#911C13` |
| `--warning-50` | `#FFF8E6` | | `--info-50` | `#EEF6FF` |
| `--warning-100` | `#FFEFC2` | | `--info-100` | `#D9EAFF` |
| `--warning-500` | `#F4B740` | | `--info-500` | `#2F80ED` |
| `--warning-600` | `#D99A16` | | `--info-600` | `#1C64D1` |

**Semantic aliases**
| Token | Hex | Role |
|---|---|---|
| `--bg-primary` | `#F7FAFC` | page background |
| `--bg-secondary` | `#EAF3F8` | tinted background |
| `--bg-elevated` | `#FFFFFF` | cards / surfaces |
| `--text-primary` | `#102A3A` | body text |
| `--text-secondary` | `#647887` | secondary text |
| `--text-tertiary` | `#7D909C` | placeholder / muted |
| `--border-subtle` | `#D9E6EE` | dividers, card borders |
| `--border-strong` | `#B8C7D1` | input borders |

### 1.3 When to use each color
- **Primary (Deep Blue)** — the single brand action color. Primary buttons (`--primary-600`,
  hover `--primary-700`), active nav (`--primary-50` bg / `--primary-700` text), focus ring
  (`--primary-100`), links, key numbers.
- **Gray / neutrals** — page/surface backgrounds, text, borders, disabled states, neutral badges.
- **Success / Warning / Info** — status only (badges, toasts, KPI accents). Not decorative.
- **Coral Red / danger — DANGER & DESTRUCTIVE ONLY (for now).** Because `--accent-500`
  (`#DB4439`) is **identical** to `--danger-500` (see §1.7 known gap), red currently reads as
  "danger". **Do not use Coral Red as a general brand accent** while this collision stands.
  Use it for destructive buttons (`btn-danger` → `--danger-600`), error toasts/badges, and
  validation errors. For ordinary emphasis or highlights, prefer **primary (Deep Blue)** or a
  **neutral/gray** treatment — not red.

### 1.4 Typography
- **Font stack** (`styles.css:153`):
  `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', 'Heebo', system-ui, sans-serif`.
  `Heebo` is the intended Hebrew face; see §1.7 known gap (it is not actually loaded).
- **Type scale:** `--text-xs` 0.75rem · `--text-sm` 0.875 · `--text-base` 1 · `--text-lg`
  1.125 · `--text-xl` 1.25 · `--text-2xl` 1.5 · `--text-3xl` 1.875 · `--text-4xl` 2.25 ·
  `--text-5xl` 3rem.
- **Weights:** `--font-normal` 400 · `--font-medium` 500 · `--font-semibold` 600 · `--font-bold` 700.
- **Usage:** body/inputs `--text-sm`; labels `--text-sm`/`--font-medium`; card title
  `--text-xl`/`--font-semibold`; modal title `--text-2xl`/`--font-bold`; KPI value
  `--text-3xl`/`--font-bold`. Use scale tokens, never magic px.

### 1.5 Spacing scale
`--space-1` 4px · `-2` 8 · `-3` 12 · `-4` 16 · `-5` 20 · `-6` 24 · `-8` 32 · `-10` 40 ·
`-12` 48 · `-16` 64 · `-20` 80px. **Always use `--space-*`; never hardcode px gaps/margins.**

### 1.6 Radius, shadows, transitions, z-index
- **Radius:** `--radius-sm` 8px · `-md` 12 · `-lg` 16 (buttons/inputs) · `-xl` 24 (cards) ·
  `-2xl` 32 (modals) · `-full` 9999px (pills/badges).
- **Shadows:** `--shadow-xs` → `--shadow-2xl` (2xl reserved for modals). Cards use `--shadow-sm`,
  hover `--shadow-md`.
- **Transitions:** `--transition-fast` 150ms · `--transition-base` 200ms · `--transition-slow`
  300ms, all `cubic-bezier(0.4, 0, 0.2, 1)`.
- **Z-index layers:** `--z-dropdown` 1000 · `--z-sticky` 1020 · `--z-fixed` 1030 (sidebar) ·
  `--z-modal-backdrop` 1040 · `--z-modal` 1050 · `--z-toast` 1060 · `--z-tooltip` 1070. Use
  these tokens for any stacking; do not invent z-index values.

### 1.7 Known gaps (documented, not fixed here)
- **No `@font-face` / web-font link for `Heebo`.** `Heebo` is named in the font stack
  (`styles.css:153`) but there is no `@font-face` rule and no Google Fonts `<link>` in
  `client/index.html`. Hebrew text therefore renders in the system fallback, not Heebo.
- **`--warning-700` is referenced but undefined.** `.badge-warning` (`styles.css:671`) and two
  other rules (lines 2527, 3716) use `var(--warning-700)`, but only `--warning-50/100/500/600`
  are defined in `:root`. The value falls back to `inherit`.
- **Accent/danger collision.** `--accent-500` (`#DB4439`) equals `--danger-500` (`#DB4439`), so
  "brand accent" and "danger" are visually indistinguishable. Until resolved, red = danger only
  (see §1.3). Resolving the palette (distinct accent vs danger) is a future decision.

---

## 2. RTL and Bidirectionality

- **Default is RTL.** `<html dir="rtl">` and `body { direction: rtl }`. Inputs/textareas also
  force `direction: rtl` (`styles.css:461`). Build every layout RTL-first.
- **Force LTR only for these content types**, keeping them inside an RTL layout:
  **numbers, times, dates, phone numbers, prices, IDs, emails, and URLs.** Wrap such values in
  a container with `direction: ltr` (as done for data columns in `UserTable.css` and
  `BusinessProfilePage.css`); do not flip the whole row/screen.
- **Logical spacing.** Prefer symmetric spacing via `--space-*`. When a physical side is
  unavoidable, remember the app is RTL: the sidebar is anchored on the **right**
  (`.app-sidebar { right: 0; border-left: … }`) and `.app-main { margin-right: 260px }`. Text
  in headers/nav aligns right (`th`, `.sidebar-nav-item` use `text-align: right`).
- **Icon / emoji mirroring.** Do not mirror emoji glyphs (they render as-is). Directional
  affordances follow reading order: "next/forward" points **left**, "back/previous" points
  **right**. Place leading icons on the right of their label (start side in RTL). Status/action
  emoji (✓ ✕ ⚠️ 🗑️ ✏️) are non-directional — use as-is.

---

## 3. Layout and Page Chrome

Routing is a state-based view switcher in `main.jsx` (not react-router). There are three
layout shells:

### 3.1 `AppLayout` (`layouts/AppLayout.jsx`)
Authenticated shell: fixed right-anchored sidebar (`.app-sidebar`, 260px, `border-left`),
`.app-main` offset by `margin-right: 260px`, and a mobile bottom nav (`.mobile-nav`). Nav items
come from `shared/hooks/useNavigation.js`. Used by **ADMIN**, **SERVICE_BOOKER** (customer),
and the legacy **BUSINESS** views.

### 3.2 `PublicLayout` (`layouts/PublicLayout.jsx`)
Logged-out, header-only chrome. Used for the auth panel and all registration/onboarding steps.
(Note: `ConsentScreen`, `RegistrationComplete`, and `LandingPage` render with no shell.)

### 3.3 `ServiceProviderWorkspace` (`features/service-provider/ServiceProviderWorkspace.jsx`)
The only role with a **dedicated self-contained shell**: its own sidebar + sticky header
(showing an approval-status badge) and internal page state. Used by **SERVICE_PROVIDER**.

### 3.4 Per-role layout rules
- **מנהל מערכת (ADMIN)** — `AppLayout` sidebar; content is data-dense: tables in
  `.table-container`, tabbed sections (e.g. catalog), KPI cards. Guard every admin view with a
  role check; unauthorized → `UnauthorizedAccess`.
- **נותן השירות (SERVICE_PROVIDER)** — `ServiceProviderWorkspace`; dashboard + management pages.
  Sticky header carries approval status. Keep primary actions in the header/section, not buried.
- **מזמין השירות (SERVICE_BOOKER)** — the registered customer-facing user who searches, books,
  manages, approves, and may pay. Uses `AppLayout` when logged in and `PublicLayout` when
  browsing logged-out (search/business-profile). Card/marketplace patterns (`slot-card`,
  search cards), booking dialogs, "my bookings".
- **Booking recipient / מקבל השירות (SERVICE_RECIPIENT)** terminology rule — see §5.6.
  A screen is laid out for the **booker** (the logged-in user). The **recipient** is data
  *inside a booking* (may be the booker or another person). Never build a separate "recipient"
  shell; render recipient details within the booking's card/summary/detail views.

---

## 4. Components

For each: anatomy, variants, canonical classes, states, do/don't. Canonical classes live in
`styles.css` unless noted.

### 4.1 Buttons
- **Anatomy:** base `button, .button` (`styles.css:346`) — inline-flex, `gap --space-2`,
  padding `--space-3 --space-5`, `--text-sm`/`--font-medium`, `--radius-lg`. Icon + label
  inline.
- **Variants:** `.btn-primary` (Deep Blue action), `.btn-secondary` (elevated bg + strong
  border), `.btn-ghost` (transparent), `.btn-danger` (`--danger-600`, destructive only),
  `.btn-success` (`--success-600`).
- **Sizes:** `.btn-sm`, `.btn-lg` (base is medium). Full width: `.btn-full`.
- **States:** `:hover:not(:disabled)` lifts primary/danger (`translateY(-1px)` + shadow);
  `:disabled` → opacity 0.5, `not-allowed`.
- **Do:** use `btn-primary` for the one main action; `btn-secondary` for secondary; `btn-danger`
  only for destructive.
- **Don't:** invent one-off classes (`btn-large`, `btn-link`, `btn-delete`, `btn-remove`,
  `btn-outline`, `btn-warning`, `btn-edit`, …) — map to the canonical set (see §7). Don't use
  red/`btn-danger` for non-destructive actions.

### 4.2 Forms & fields
- **Anatomy:** `.form-group` (bottom margin `--space-5`) wraps a `.form-label` + control.
  `.form-label` is block, `--text-sm`/`--font-medium`.
- **Required / help / error:** mark required with a trailing `*` in the label (existing
  convention, e.g. "שם השירות *"). Help text: small muted line under the field
  (`--text-xs`, `--text-secondary`). Errors are surfaced via toast today (see §4.9); inline
  error styling is not yet standardized — when adding it, use `--danger-600` text under the field.
- **Do:** one `.form-group` per field; label every control; keep vertical rhythm on `--space-*`.
- **Don't:** put labels beside inputs ad-hoc; skip labels; hardcode margins.

### 4.3 Inputs
- Base `input` (`styles.css:451`): full width, padding `--space-3 --space-4`, `--text-sm`,
  `--border-strong`, `--radius-lg`, `direction: rtl`. Focus: `--primary-500` border +
  `0 0 0 3px --primary-100` ring. Placeholder `--text-tertiary`.
- **Do:** rely on the base styling; force `ltr` only for numeric/email/URL values (§2).

### 4.4 Textareas
- Base `textarea` (`styles.css:474`): same field styling + `resize: vertical`,
  `min-height: 100px`. **Use a textarea for any multi-line input** (e.g. provider instructions
  "הוראות לנותן השירות") — never a stretched single-line input.

### 4.5 Selects
- Base `select` shares the input styling (full width, RTL, focus ring). Use a leading empty
  option as the placeholder (e.g. `בחר סוג מסמך`). Label archived/inactive options inline
  (e.g. `… (בארכיון)`) rather than hiding a currently-selected inactive value.

### 4.6 Modals / popups
- **Canonical pattern:** `.modal-backdrop` (`styles.css:677`, fixed, blur, `--z-modal-backdrop`,
  `fadeIn`) → `.modal` (`--radius-2xl`, padding `--space-8`, `max-width: 500px`,
  `max-height: 90vh`, `--shadow-2xl`, `slideUp`). Header `.modal-header` + `.modal-title`
  (`--text-2xl`/`--font-bold`); close `.modal-close` (positioned top-**left**, the near corner
  in RTL). The reusable wrapper is `features/admin/catalog/CatalogModal.jsx`.
- **Do:** use the canonical `.modal` structure; keep one clear primary action; close on backdrop
  click + ✕; keep content scannable.
- **Don't:** overcrowd a popup (split dense forms into sections or steps); don't hand-roll new
  modal markup; **don't use the `modal-v2` variant** for new work (see §7).

### 4.7 Drawers
- `shared/ui/Drawer.jsx` (+ `Drawer.css`): slide-in panel (`isOpen`/`onClose`/`title`/`width`),
  header + ✕. **Use a drawer** for contextual detail/edit alongside a list (e.g. admin user
  details); **use a modal** for focused create/confirm tasks. Don't mix both for the same flow.

### 4.8 Tables
- **Anatomy:** `.table-container` (`styles.css:754`, overflow-x auto, `--radius-xl`,
  `--border-subtle`) wrapping a `<table>`; `thead` on `--gray-50`; `th` right-aligned,
  `--font-semibold`, `--text-secondary`; `td` `--text-sm`, top border; `tr:hover` `--gray-50`.
- **Sorting (canonical helper):** `features/admin/catalog/catalogUi.jsx` exports
  `useTableSort(defaultKey, accessors)` (Hebrew-aware `localeCompare('he')`) and
  `SortHeader` (clickable `<th>` with ▲/▼ and `aria-sort`). Reuse these for sortable tables.
- **Do:** wrap tables in `.table-container`; keep numeric/date cells `ltr`; provide an empty
  state when there are no rows.
- **Don't:** build bespoke sort logic when `useTableSort` fits; left-align Hebrew headers.

### 4.9 Cards
- **Anatomy:** `.card` (`styles.css:482`): `--bg-elevated`, `--border-subtle`, `--radius-xl`,
  padding `--space-6`, `--shadow-sm`, hover `--shadow-md` + lift. Subparts `.card-header`,
  `.card-title` (`--text-xl`/`--font-semibold`), `.card-description`. `.kpi-card` for stats.
- **Approved feature variants** (documented, in styles.css): `slot-card` (marketplace slot),
  `kpi-card`. Other bespoke feature cards should converge toward the base `card` look
  (same radius/border/shadow tokens).
- **Don't:** invent new shadow/radius values per card; introduce new card variants without adding
  them here.

### 4.10 Status badges
- **Anatomy:** `.badge` (`styles.css:657`, pill, `--radius-full`, `--text-xs`/`--font-medium`)
  + color modifier: `.badge-primary` `.badge-success` `.badge-danger` `.badge-warning`
  `.badge-gray`.
- **Catalog helper:** `catalogUi.StatusPill` renders `בארכיון` (`badge-gray`) / `פעיל`
  (`badge-success`).
- **Booking statuses — canonical source:** `shared/calendar/utils/statusColors.js`
  (`STATUS_META` + `getCalendarStatusMeta(status, context)`), which also maps each status to a
  `badgeClass`. Use it for all booking-status display; pass `context` (`'customer'` vs
  `'provider'`/`'admin'`) for correct person (see §5.4).
- **Known inconsistency:** `statusColors.js` and `shared/ui/StatusBadge.css` carry **hardcoded
  hexes** (e.g. `#10b981`, `#f59e0b`, `#fef3c7`) that do **not** match the `:root` status
  tokens. Treat `getCalendarStatusMeta` as the wording authority; reconciling the color values to
  tokens is a future cleanup (see §7).
- **Do:** reuse an existing badge class + canonical wording.
- **Don't:** introduce a fourth badge system or new status hexes.

### 4.11 Toasts / notifications
- **Canonical pattern:** `.toast` (`styles.css:824`, fixed bottom-right, `--z-toast`, slide-in)
  + `.toast-success` (`--success-600`) / `.toast-error` (`--danger-600`). The most complete
  implementation is `features/admin/catalog/CatalogToast.jsx` (typed, icon prefix, `role`), driven
  by an `onSuccess`/`onError` pattern — treat it as the model to standardize on.
- **Do:** show success/error via a toast; auto-dismiss (≈3s success, ≈5s error).
- **Don't:** use `alert()` for user feedback (see §7); don't reinvent per-page toast state.

### 4.12 Empty states
- **Canonical pattern:** `.empty-state` (`styles.css:793`) → `.empty-state-icon` (48px, opacity
  0.3) + `.empty-state-title` (`--text-lg`/`--font-semibold`) + `.empty-state-description`
  (`--text-sm`, muted) + optional CTA button.
- **Do:** explain what's missing and offer the next action.
- **Don't:** use the `empty-state-v2` / `empty-state-card` divergent variants for new work (§7).

### 4.13 Icons / emoji
- Icons are **emoji** app-wide (no icon library). Keep them consistent and semantic. Common
  registry in use: **➕ add · ✏️ edit · 🗑️ delete · ♻️ restore · 📥 archive · 📄 document ·
  ✓ confirm/success · ✕ close · ⚠️ warning · ⏳ pending · ✅ completed · 🔍 search · 📅
  calendar**.
- **Do:** reuse the registry meanings; size via surrounding text tokens.
- **Don't:** introduce ad-hoc emoji for actions already covered; don't rely on emoji as the only
  label for a critical action (pair with text).

---

## 5. Content and Hebrew Voice

### 5.1 Tone
Clear, warm, professional Hebrew. Short sentences. Plain language over jargon. Trustworthy and
calm — this is a booking/health-adjacent product.

### 5.2 Button verbs
Use action verbs matching existing copy: `שמור` / `עדכן` / `הוסף` / `צור` for confirms,
`ביטול` for cancel, `מחק` for destructive, `סגור` to dismiss. Keep labels short; pair a
leading emoji from the §4.13 registry when it aids scanning (e.g. `➕ שירות חדש`).

### 5.3 Status wording
Prefer the canonical booking wording from `statusColors.js`: `ממתין לאישור`, `מאושר`, `הושלם`,
`בוטל`, `בוטל על ידי הלקוח` / `בוטל על ידך`, `בוטל על ידי העסק`, `נדחה`, `לא הגיע` / `לא הגעת`.
Catalog/entity status: `פעיל` / `בארכיון`. Account status (StatusBadge): `פעיל`, `ממתין לאישור`,
`מוסתר`, `מושעה`, `חסום`. Keep wording consistent per domain; don't invent synonyms.

### 5.4 Error message style
Human, specific, non-technical Hebrew. Say what happened and what to do (e.g. the archive
confirmation: *"העברה לארכיון תמנע שימוש חדש בסוג המסמך, אך לא תסיר דרישות קיימות…"*). Never
surface raw server errors or codes; map to a friendly Hebrew message.

### 5.5 Provider / admin / booker / recipient wording
- **מזמין השירות (booker)** — address in **2nd person** ("הזמנת", "בוטל על ידך", "התור שלך").
- **נותן השירות (provider)** and **מנהל מערכת (admin)** — **3rd person** about the booker/recipient
  ("בוטל על ידי הלקוח", "לא הגיע"). `getCalendarStatusMeta(status, context)` already switches
  person via `context` — pass `'customer'` for booker views, `'provider'`/`'admin'` otherwise.
- **מקבל השירות (recipient)** — refer to them as the person receiving the service inside the
  booking, distinct from the booker (§5.6).

### 5.6 SERVICE_BOOKER vs SERVICE_RECIPIENT (terminology rule)
> **Canonical role terminology:** the authoritative definitions live in
> [`docs/LOMEA_ROLE_TERMINOLOGY.md`](./LOMEA_ROLE_TERMINOLOGY.md). This section is the
> UI-copy application of those rules.

These are **not the same concept**:
- **SERVICE_BOOKER = מזמין השירות** — the registered user who searches, books, manages,
  approves, and may pay. This is the customer-facing **role**. Use **"מזמין שירות"** for this
  user in UI copy and role labels.
- **SERVICE_RECIPIENT = מקבל השירות** — the person who actually receives the service. May be the
  booker themselves, or someone else entered inside the booking (child, parent, spouse, employee,
  …). Use **"מקבל השירות" only** when referring to that person inside a booking.
- **SERVICE_PROVIDER = נותן השירות**, **ADMIN = מנהל מערכת**.
- **Legacy / current-code naming:** the codebase still says **"customer"** (e.g.
  `features/customer/*`, `CustomerPage`, `context: 'customer'`, status label `הלקוח`). Treat
  "customer" as **current-code naming for the booker role**; the **target** term is
  **מזמין השירות (SERVICE_BOOKER)**. New user-facing copy should prefer "מזמין שירות" and reserve
  "מקבל השירות" for the in-booking recipient. Do not rename code in this document's scope — this
  is a terminology/naming intent note only.

### 5.7 Avoid technical/backend wording in UI
No enum values, table names, HTTP codes, or English identifiers in user-facing text. Translate
statuses/errors to the Hebrew vocabulary above (e.g. show `ממתין לאישור`, never `PENDING`).

---

## 6. Do / Don't Gallery (textual)

**Buttons**
- ✅ Do: `<button className="btn-primary">➕ שירות חדש</button>` — one primary action per view.
- ❌ Don't: `<button className="btn-large btn-outline">` — non-canonical classes.
- ❌ Don't: `btn-danger` for a benign action like "ערוך".

**Color / red**
- ✅ Do: red only for `מחק`, error toasts, validation errors.
- ❌ Don't: red highlight to "draw attention" to a normal card/CTA (use Deep Blue or neutral).

**Modals**
- ✅ Do: `modal-backdrop` → `modal` with `modal-title`, one primary + `ביטול`, sectioned form.
- ❌ Don't: cram 15 fields with no grouping; hand-roll a new modal; use `modal-v2`.

**Forms**
- ✅ Do: `form-group` + `form-label` "שדה *", help line under the field, textarea for multi-line.
- ❌ Don't: label beside input with hardcoded px; single-line input for a paragraph.

**Tables**
- ✅ Do: `table-container` + `SortHeader`/`useTableSort`; numbers/times in `ltr`.
- ❌ Don't: custom sort code; left-aligned Hebrew headers.

**Status / voice**
- ✅ Do: `getCalendarStatusMeta(status, 'customer')` → 2nd-person label for the booker.
- ❌ Don't: show `CONFIRMED`; write "בוטל על ידך" in a provider view.

**Terminology**
- ✅ Do: "מזמין שירות" for the registered user; "מקבל השירות" for the person in the booking.
- ❌ Don't: treat "customer" and "מקבל השירות" as interchangeable.

**Feedback**
- ✅ Do: success/error via `toast` (`CatalogToast` pattern).
- ❌ Don't: `alert('...')`.

---

## 7. Deprecated / Do-Not-Use

Documented as **not canonical**. Do not build new UI on these; migrate opportunistically
(migration itself is a later, separate task).

- **`shared/ui/*` Tailwind components** — `Button.jsx`, `Card.jsx`, `Badge.jsx`, `Input.jsx`,
  `Select.jsx`, `PageHeader.jsx`, `Section.jsx` are written with Tailwind utility classes, but
  **no Tailwind is installed** and they have **zero imports**. **Deprecated / dead.** Use the CSS
  classes in §4 instead. (Real, in-use members of that folder — `Drawer`, `Toast`,
  `BookingStatusBadge`, `StatusBadge`, `EmptyState`, `LoadingState`, `UnauthorizedAccess` — are
  fine.)
- **`modal-v2` variant** — a second modal system (`modal-backdrop-v2`/`modal-v2`/`modal-close-v2`)
  coexists with the canonical `.modal`. Fragmented. **Do not use for new work**; the canonical
  `.modal` (§4.6) is the target.
- **`empty-state-v2` / `empty-state-card`** — divergent empty-state variants alongside the
  canonical `.empty-state`. **Use `.empty-state` (§4.12).**
- **Redundant button class names** — `btn-large` (use `btn-lg`), `btn-link` (use `btn-text`),
  `btn-delete` / `btn-remove` (use `btn-danger`), plus one-offs `btn-outline`, `btn-warning`,
  `btn-edit`. Consolidate onto the canonical set (§4.1).
- **Legacy `features/business/*` UI** — an older provider UI (`BusinessPage` + tabs + its own
  calendar under `features/business/calendar/*`) parallel to the active
  `features/service-provider/*`. **Deprecated; not the design-system target.** Do not invest in
  its styling unless it is confirmed still active.
- **Duplicate `SlotCard` patterns** — `SlotCard.jsx` exists in multiple places
  (`features/business/components/`, `features/business/calendar/components/`,
  `features/customer/search/`). Visual-drift risk; converge on one when touched.
- **Raw `alert()` for user feedback** — present in ~5 files. **Do not use**; use the `toast`
  pattern (§4.11).

---

## 8. Change Log

### v1.0 — 2026-07-21
- Created as the **main Lomea UI Design System document**.
- Established **CSS / global classes (`styles.css`) as the canonical UI layer**.
- Marked **`shared/ui/*` Tailwind components as deprecated / not canonical** (also flagged
  `modal-v2`, `empty-state-v2`, redundant button classes, legacy `features/business/*`, duplicate
  `SlotCard`, and raw `alert()`).
- **Reserved Coral Red for danger/destructive only** and documented the accent/danger hex
  collision (`--accent-500` == `--danger-500` == `#DB4439`).
- Documented known gaps: **no `@font-face` for Heebo**, **undefined `--warning-700`**.
- **Clarified SERVICE_BOOKER (מזמין השירות) vs SERVICE_RECIPIENT (מקבל השירות)** terminology, and
  noted current-code "customer" as legacy naming for the booker role.
