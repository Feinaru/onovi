# Lomea Calendar System

**Status:** 🔒 MANDATORY for all calendar-related work
**Last Updated:** 2026-07-12
**Version:** 1.0

---

## ⚠️ THIS DOCUMENT MUST BE READ BEFORE ANY CALENDAR WORK

**For all developers and AI agents:**

- This document **MUST** be read before starting any calendar-related PLAN or BRAVE task
- If a requested calendar task conflicts with these rules, **STOP and report before coding**
- This extends **`docs/LOMEA_BUILDING_PRINCIPLES.md`** with calendar-specific architecture
- When in doubt about calendar behavior, follow this document

**Violation of these rules may result in rejected code.**

---

## 0. Document Purpose

This document defines the unified Lomea calendar system architecture for both **customer** and **service provider** calendars.

**Required reading before:**
- Any calendar implementation (PLAN or BRAVE mode)
- Adding or modifying calendar views (day/week/month)
- Changing calendar behavior or click handlers
- Modifying availability/booking edit rules
- Implementing calendar-related features (reports, search integration, etc.)

**Related documents:**
- **`docs/LOMEA_BUILDING_PRINCIPLES.md`** — General architecture, role principles, data model

**Scope:**
This document covers:
- ✅ Customer and provider calendar types
- ✅ Shared visual design language
- ✅ Day/week/month view behavior specifications
- ✅ Availability vs booking separation rules
- ✅ Provider edit and lock policy
- ✅ Price and revenue calculation rules
- ✅ Calendar component architecture
- ✅ Implementation phases and checklist

---

## 1. Calendar Types Overview

Lomea has **two active calendar systems** serving different roles with different purposes:

| Calendar Type | Role | Purpose | Data Source | Views | Editable | Status |
|--------------|------|---------|-------------|-------|----------|--------|
| **Customer Calendar** | CUSTOMER | Read-only appointment view | `Booking` | Month, Week (future), Day (future) | ❌ No | ✅ Active |
| **Provider Calendar** | SERVICE_PROVIDER | Manage availability + view bookings | `Slot` + `Booking` | Day, Week (future), Month (future) | ⚠️ Limited | ✅ Active |
| **Legacy Business Calendar** | BUSINESS (deprecated) | Unified event calendar | All event types | Day only | ✅ Yes | 🗑️ Legacy |

---

### 1.1 Customer Calendar

**Purpose:** Allow customers to view their booked appointments in a visual calendar format.

**Behavior:**
- Displays only the customer's own `Booking` records
- Read-only — no inline editing or availability management
- Click appointment → navigate to booking details page
- Actions (cancel, reschedule) happen in booking details flow, not calendar

**Data source:**
- `GET /bookings?mine=true` — Returns customer's bookings with related `Slot`, `Business`, `BusinessService`

**Click behavior:**
- Click date → show that day's bookings (month view)
- Click booking card → navigate to booking details

**Current state (2026-07-12):**
- ✅ Month view implemented and working well
- ⏳ Week view — planned
- ⏳ Day view — planned

---

### 1.2 Provider Calendar

**Purpose:** Work management tool for service providers to manage availability and view bookings.

**Behavior:**
- Displays provider-created availability windows (`Slot`)
- Shows booking counts and booking indicators
- Provider can create/edit open availability
- Provider **CANNOT** freely edit availability with active bookings (safety rule)
- Click behavior depends on availability state (see Section 6)

**Data source:**
- `GET /api/service-provider/slots?date={date}` — Returns slots for one date (current)
- Future: `GET /api/service-provider/calendar?from={date}&to={date}` — Date range endpoint

**Click behavior:**
- Click **empty availability** → edit availability modal
- Click **availability with bookings** → availability details drawer (limited editing)
- Click **booking** → provider booking details

**Current state (2026-07-12):**
- ✅ Day view implemented (visual time grid)
- ⏳ Week view — planned
- ⏳ Month view — planned
- ⚠️ Edit UX needs improvement (misleading modal title, no booking warnings)

---

### 1.3 Legacy Business Calendar

**Status:** 🗑️ **DEPRECATED** — Do NOT extend or use as reference

**Why deprecated:**
- Built for legacy `BUSINESS` role (being migrated to `SERVICE_PROVIDER`)
- Unified event model (slots, bookings, calendar events, time blocks) — too complex
- Different architecture from current customer/provider calendars

**Action required:**
- Do NOT add features to legacy business calendar
- Do NOT copy legacy calendar components to new calendar work
- Migrate remaining BUSINESS users to SERVICE_PROVIDER (separate task)
- Eventually remove `client/src/features/business/calendar/`

---

## 2. Shared Calendar Design Language

Customer and provider calendars serve **different purposes** and have **different behavior**, but they **MUST share the same visual design language** to maintain consistency.

### 2.1 What MUST Be Shared

| Element | Consistency Rule |
|---------|-----------------|
| **View switcher** | Same component: "יום / שבוע / חודש" toggle buttons |
| **Toolbar** | Same navigation pattern: ← Previous \| היום (Today) \| Next → |
| **Date display** | Same Hebrew formatting (via `calendarUtils.js`) |
| **Grid components** | Same month grid, week grid, time grid primitives |
| **Event cards** | Same card structure (role-aware variants allowed) |
| **Status colors** | Same source: `statusColors.js` |
| **Empty states** | Same style: emoji + Hebrew text + helpful CTA |
| **Loading states** | Same pattern: "טוען יומן..." |
| **RTL layout** | Both calendars right-to-left |
| **Spacing/cards** | Same CSS variables, card classes |

### 2.2 What Can Differ (Role-Specific Behavior)

| Aspect | Customer | Provider |
|--------|----------|----------|
| **Terminology** | תור (appointment) | הזמנה (booking), זמינות (availability) |
| **Data displayed** | Customer's bookings only | Availability + bookings |
| **Click behavior** | View booking details (read-only) | Edit availability or view booking details |
| **Actions** | Cancel/reschedule (via booking details) | Create availability, manage bookings |
| **Edit permissions** | None | Limited by availability state |
| **Card content** | Business name + service + time | Service name + booking count + time |

### 2.3 Implementation Rules

**✅ DO:**
- Use shared calendar components from `client/src/shared/calendar/`
- Extend shared primitives when role-specific behavior is needed
- Use `CalendarEventCard` with `context="customer"` or `context="provider"`
- Follow Hebrew terminology standards (Section 5)

**❌ DO NOT:**
- Duplicate calendar grid components
- Create separate view switcher components
- Create inline status mappings (use `statusColors.js`)
- Force identical behavior when role-specific differences are justified

---

## 3. Role-Specific Behavior

### 3.1 Customer Calendar Behavior

**Data:**
- Displays `Booking` records only
- No `Slot` / availability management
- Filtered by `customerId = currentUser.id`

**Permissions:**
- ❌ No inline editing
- ❌ No availability creation
- ❌ No booking management inside calendar

**Click behavior:**
- Click date (month view) → show that day's bookings below grid
- Click booking card → navigate to **Booking Details** page/drawer
- Booking details page allows: view, cancel, reschedule (future)

**Actions:**
- Cancel booking → via booking details page
- Reschedule booking → via booking details flow (future)
- All actions happen **outside** the calendar, not inline

**Terminology:**
- Use "תור" (appointment) — customer-facing language
- Use "יומן" (calendar) — not "לוח שנה"
- Examples: "התורים שלי" (my appointments), "אין תורים ביום זה" (no appointments this day)

---

### 3.2 Provider Calendar Behavior

**Data:**
- Displays `Slot` records (availability windows)
- Shows booking counts per slot
- May display or link to individual `Booking` records

**Permissions:**
- ✅ Create new availability
- ⚠️ Edit availability (limited by state — see Section 7)
- ❌ Direct booking editing (via separate booking details flow)

**Click behavior (depends on state):**
- Click **empty availability** → **Edit Availability Modal**
- Click **availability with bookings** → **Availability Details Drawer** (limited editing, shows bookings)
- Click **booking** (if shown separately) → **Provider Booking Details**

**Actions:**
- Create availability → "פתח זמינות חדשה" button
- Edit empty availability → Full edit form
- Edit availability with bookings → Limited to note only (MVP), show warnings
- Delete availability → Only if no active bookings
- Booking actions (approve/reject/cancel) → Via booking details, not availability editor

**Terminology:**
- Use "זמינות" or "חלון זמינות" (availability window) — not customer appointment
- Use "הזמנה" (booking) — provider/admin language
- ❌ **NEVER** use "תור" for provider availability management
- ❌ **NEVER** use "סלוט" (technical term) in user-facing UI

---

## 4. Day / Week / Month Views

This section defines the **target behavior** for each view across both roles.

---

### 4.1 Customer Month View

**Status:** ✅ Implemented, good foundation

**Behavior:**
- Month grid (7 columns × ~5 rows)
- Show all customer bookings in the month
- Color-coded by booking status (via `statusColors.js`)
- Click date → show that day's bookings below grid
- Click booking card → navigate to booking details
- Previous / Next / Today navigation

**Enhancements needed:**
- Integrate with shared `CalendarShell` and `CalendarViewSwitcher` (when created)
- Replace custom header with shared `CalendarToolbar`

**Visual goals:**
- Keep existing clean month grid design
- Preserve color-coded status badges
- Maintain read-only clarity (no edit affordances)

**Empty state:**
- "אין תורים בחודש זה" (no appointments this month)

**Mobile:**
- Responsive month grid (already working)
- Booking cards display below selected date

---

### 4.2 Customer Week View

**Status:** ⏳ Planned

**Behavior:**
- 7-column layout (Sunday–Saturday)
- Each column shows that day's appointments
- Time slots visible (hourly or morning/afternoon/evening)
- Click booking → booking details
- Clear "today" indicator
- Scroll to today on load

**Visual goals:**
- Clean 7-column grid
- Booking cards stacked vertically per day
- Status color on card left border
- Time + business name + service visible

**Empty state:**
- "אין תורים השבוע" (no appointments this week)

**Mobile:**
- Horizontal scroll or swipe between days
- Single day visible at a time on small screens

---

### 4.3 Customer Day View

**Status:** ⏳ Planned

**Behavior:**
- Single day timeline or list
- Show all bookings for selected day
- Booking cards with time, business, service, status
- Click booking → booking details
- Actions: Cancel, Reschedule buttons (navigate to booking details)

**Visual goals:**
- Clear timeline or list (not necessarily hourly grid)
- Booking cards more detailed than month/week cards
- More space for service description, notes

**Empty state:**
- "אין תורים ביום זה" (no appointments this day)

**Mobile:**
- Full-screen day view
- Swipe left/right to change days

---

### 4.4 Provider Month View

**Status:** ⏳ Planned

**Behavior:**
- Month grid showing per-day indicators/counts
- **NOT** full availability cards (too crowded)
- Show:
  - 🟢 Green indicator: Open availability available
  - 📋 Badge: Booking count (e.g., "📋 3 הזמנות")
  - ⚫ Gray: Full/no availability
  - Empty: No availability published
- Click day → navigate to **day view** for that date

**Visual goals:**
- High-level overview, not detailed
- Easy to see which days have availability
- Easy to see booking density
- Not overcrowded

**Empty state:**
- "אין זמינות מפורסמת בחודש זה" (no availability published this month)

**Mobile:**
- Responsive month grid (similar to customer)

---

### 4.5 Provider Week View

**Status:** ⏳ Planned

**Behavior:**
- 7-column grid (Sunday–Saturday)
- Each column shows that day's availability blocks (compact)
- Show booking count per availability
- Status colors visible
- Click availability → navigate to day view or open details drawer

**Visual goals:**
- Compact availability cards per day
- Status color + booking count visible
- Less detailed than day view
- Quick weekly schedule overview

**Empty state:**
- "אין זמינות השבוע" (no availability this week)

**Mobile:**
- Horizontal scroll or single-day view

---

### 4.6 Provider Day View

**Status:** ✅ Implemented (visual time grid), ⚠️ Needs UX improvement

**Current state:**
- 24-hour time grid (`CalendarTimeGrid`)
- Availability blocks positioned by start/end time
- Overlap handling for multiple availability windows
- Auto-scroll to 08:00

**Target behavior:**
- Keep existing time grid foundation (good)
- **Improve:** Availability blocks show booking count badge
- **Improve:** Visual distinction:
  - 🟢 Open (green) = Empty or has space for more bookings
  - 🔵 Partial (blue) = Has bookings, limited space
  - ⚫ Full (gray) = No space for more bookings
  - 🔴 Cancelled (red)
- **Improve:** Click behavior depends on state (see Section 6)
- **Improve:** Actions separated from visual blocks:
  - "עריכה" button (edit) — only if no bookings
  - "לפרטים" button (details) — always
  - "מחק" button (delete) — only if no bookings
- **Improve:** Current time indicator (red line)
- **Improve:** "פתח זמינות חדשה" button in toolbar

**Visual goals:**
- Professional time grid (keep existing foundation)
- Clear status colors
- Booking count visible
- Clear affordances (what's clickable vs read-only)

**Empty state:**
- "אין זמינות ביום זה. לחץ על 'פתח זמינות חדשה' כדי ליצור זמינות"

**Mobile:**
- Simplified list view (not grid) for small screens
- Swipe left/right to change days

---

## 5. Availability vs Booking Separation

**This is a critical product and UX rule.**

### 5.1 Definitions

**Slot / Availability:**
- A **provider-created bookable time window**
- Represents when the provider is **available for Lomea bookings**
- Can contain **zero or more customer bookings**
- Has properties: date, start/end time, regular price, allowed services
- Database model: `Slot`

**Booking:**
- A **customer appointment**
- Created when a customer books a specific time within an available slot
- Has properties: customer info, service, start/end time, **captured price**
- Database model: `Booking`

**Critical distinction:**
- A **Slot** is NOT the same as a customer appointment
- Editing a **Slot** does NOT edit existing **Bookings**
- A **Booking** exists inside a **Slot** time window

---

### 5.2 Terminology Rules

**❌ NEVER confuse these terms in UI copy:**

| Concept | Customer-Facing | Provider-Facing | Technical (avoid in UI) |
|---------|----------------|-----------------|------------------------|
| Customer appointment | תור | הזמנה | Booking |
| Provider availability | N/A (customers don't see) | זמינות / חלון זמינות | Slot |
| Edit availability | N/A | עריכת זמינות | Edit slot |
| Edit appointment | N/A (read-only) | פרטי הזמנה (booking details) | Edit booking |

**Examples:**

✅ **Correct:**
- Modal title when editing availability: "עריכת זמינות" (Edit availability)
- Modal title when viewing booking: "פרטי הזמנה" (Booking details)
- Customer calendar page title: "יומן התורים שלי" (My appointments calendar)

❌ **Incorrect:**
- Modal title when editing availability: "עריכת תור" (Edit appointment) — **WRONG**, editing availability not appointment
- Using "סלוט" in user-facing UI — **WRONG**, technical jargon
- Using "תור" for provider availability — **WRONG**, "תור" is customer appointment

---

### 5.3 UI Copy Rules

**Provider availability editing:**
- Form title: "עריכת זמינות" or "פרטי זמינות"
- Create button: "פתח זמינות חדשה" (Open new availability)
- Delete button: "מחק זמינות" (Delete availability)

**Provider booking management:**
- Form title: "פרטי הזמנה" (Booking details)
- Actions: "אישור הזמנה" (Approve booking), "ביטול הזמנה" (Cancel booking)

**Customer appointments:**
- Calendar title: "יומן" (Calendar)
- List title: "התורים שלי" (My appointments)
- Booking card: "תור" (appointment)

---

## 6. Provider Click Behavior Matrix

This table defines what happens when a provider clicks different items in the provider calendar.

| Item Type / State | Click Result | Opens | Editable Fields | Locked Fields | Actions Available |
|-------------------|--------------|-------|-----------------|---------------|-------------------|
| **Empty Availability** (no bookings) | Edit | Edit Availability Modal | `date`, `startTime`, `endTime`, `regularPrice`, `dealPrice`, `note`, `allowedServices` | None | Edit, Delete, Cancel |
| **Availability with Active Bookings** | View with warnings | Availability Details Drawer | `note` only (MVP) | `date`, `startTime`, `endTime`, `regularPrice`, `dealPrice`, `allowedServices`, Delete | View bookings list, Edit note |
| **Booking** (individual appointment) | View booking | Provider Booking Details | None (via availability UI) | All | Approve, Reject, Cancel, Complete, No-Show |
| **Cancelled Availability** | View | Read-only details | None | All | None |
| **Expired Availability** | View | Read-only details | None | All | None |

---

### 6.1 Empty Availability Behavior

**Definition:** Availability with **no active bookings** (`PENDING` or `CONFIRMED` status).

**Click result:**
- Opens **Edit Availability Modal**

**UI:**
- Modal title: "עריכת זמינות" (Edit availability)
- Full edit form with all fields
- No warnings needed

**Editable fields:**
- ✅ `date` — Move availability to different day
- ✅ `startTime` / `endTime` — Adjust time window
- ✅ `allowedServices` — Change which services are allowed
- ✅ `regularPrice` — Change price for this slot
- ✅ `dealPrice` — Add/remove discount
- ✅ `note` — Internal provider note

**Actions:**
- Save changes → `PATCH /api/service-provider/slots/:id`
- Delete → `DELETE /api/service-provider/slots/:id` (with confirmation)
- Cancel → Close modal without saving

---

### 6.2 Availability with Active Bookings Behavior

**Definition:** Availability that contains **one or more active bookings** (status `PENDING` or `CONFIRMED`).

**Click result:**
- Opens **Availability Details Drawer** (not full edit modal)

**UI:**
- Drawer title: "פרטי זמינות" (Availability details)
- **Warning banner:** "⚠️ יש {count} הזמנות פעילות בזמינות זו"
- **Booking list:** Show customer names, times, statuses
- **Limited editing:** Only internal note editable (MVP)

**Editable fields:**
- ✅ `note` — Internal note only

**Locked fields (read-only, grayed out):**
- 🔒 `date` — Cannot move if bookings exist
- 🔒 `startTime` / `endTime` — Cannot change if bookings exist
- 🔒 `allowedServices` — Bookings reference specific service
- 🔒 `regularPrice` — Existing bookings have captured price
- 🔒 `dealPrice` — Locked

**Why locked:**
- Changing date/time would invalidate customer appointments
- Changing price does NOT affect existing `Booking.price` (immutable)
- Changing allowed services could break booking-service relationship

**Actions:**
- View booking → Click booking in list → opens **Provider Booking Details**
- Edit note → Save note only
- Delete → ❌ **Blocked** (must cancel bookings first)

**Alternative (future P1):**
- Allow editing with **explicit confirmation**
- Require checkbox: "אני מבין שזה ישפיע על {count} הזמנות קיימות"
- Log change with audit trail

---

### 6.3 Booking Click Behavior

**Definition:** Clicking an individual **booking** (customer appointment).

**Click result:**
- Opens **Provider Booking Details** page/drawer

**UI:**
- Title: "פרטי הזמנה" (Booking details)
- Show: Customer name, phone, service, time, price, status, notes

**Editable:**
- ❌ **NONE** via availability UI
- Booking management happens in dedicated booking details flow

**Allowed actions (in booking details, not calendar):**
- ✅ Approve (if `PENDING`)
- ✅ Reject (if `PENDING`)
- ✅ Cancel (if `PENDING` or `CONFIRMED`)
- ✅ Complete (if past date)
- ✅ Mark No-Show (if past date)
- ❌ **NEVER** change `Booking.price` (immutable)
- ❌ **NEVER** change `date`/`time` silently (use reschedule flow if implemented)

**Reschedule (future):**
- Separate flow
- Cancel old booking + create new booking
- Notify customer

---

## 7. Provider Edit and Lock Rules

This section defines the **MVP edit policy** for provider availability management.

### 7.1 Edit Rules Summary

| Availability State | Editable Fields | Locked Fields | Delete Allowed | Backend Validation Required |
|-------------------|-----------------|---------------|----------------|----------------------------|
| **Open (no bookings)** | `date`, `startTime`, `endTime`, `allowedServices`, `regularPrice`, `dealPrice`, `note` | None | ✅ Yes (with confirmation) | Ownership + valid field values |
| **Has Active Bookings** | `note` only (MVP) | `date`, `startTime`, `endTime`, `allowedServices`, `regularPrice`, `dealPrice` | ❌ No | Reject price/date/time change if bookings exist |
| **Cancelled** | None | All | ❌ No | Read-only |
| **Expired** | None | All | ❌ No | Read-only |

---

### 7.2 Open Availability (No Active Bookings)

**Full editing allowed.**

**Editable:**
- ✅ `date` — Move to different day
- ✅ `startTime` / `endTime` — Adjust time window
- ✅ `allowedServices` — Change services
- ✅ `regularPrice` — Change price
- ✅ `dealPrice` — Change discount
- ✅ `note` — Edit note
- ✅ **Delete** — Allowed with confirmation

**UI:**
- Modal title: "עריכת זמינות"
- No warnings needed
- All fields active

**Backend validation:**
- Ownership check (provider owns slot)
- Valid date (not past)
- Valid time (start < end)
- Valid price (> 0)

---

### 7.3 Availability with Active Bookings

**Limited editing to protect customer appointments.**

**Editable:**
- ✅ `note` — Internal note only (MVP)

**Locked (read-only):**
- 🔒 `date` — **Reason:** Would invalidate customer appointments
- 🔒 `startTime` / `endTime` — **Reason:** Bookings reference specific times
- 🔒 `allowedServices` — **Reason:** Bookings reference specific service
- 🔒 `regularPrice` — **Reason:** Changing doesn't affect existing `Booking.price`, creates confusion
- 🔒 `dealPrice` — **Reason:** Same as `regularPrice`
- 🔒 **Delete** — **Blocked** (must cancel bookings first)

**UI:**
- Drawer title: "פרטי זמינות"
- **Warning banner:** "⚠️ יש {count} הזמנות פעילות בזמינות זו. לא ניתן לשנות תאריך, שעה או מחיר."
- **Booking list:** Show bookings with click to booking details
- **Locked fields:** Grayed out with tooltip explaining why locked

**Backend validation:**
- `PATCH /api/service-provider/slots/:id` — **MUST reject** if:
  - Trying to change `date` and active bookings exist
  - Trying to change `startTime` or `endTime` and active bookings exist
  - Trying to change `regularPrice` and active bookings exist
- Return error: `{ success: false, error: "לא ניתן לשנות זמינות עם הזמנות פעילות" }`

---

### 7.4 Delete Rules

**Delete open availability:**
- ✅ **Allowed**
- Show confirmation: "למחוק זמינות זו?"
- `DELETE /api/service-provider/slots/:id`

**Delete availability with bookings:**
- ❌ **Blocked**
- Frontend: Disable delete button, show tooltip
- Backend: Reject with error if attempted
- Error message: "לא ניתן למחוק זמינות עם הזמנות פעילות. בטל תחילה את ההזמנות."

**Alternative to delete (cancel availability):**
- Change `status` to `CANCELLED`
- Availability hidden from customers
- Bookings remain (must be handled separately)
- Provider can still see cancelled availability in history

---

## 8. Price and Revenue Rules

**This section is CRITICAL for data integrity and reports accuracy.**

### 8.1 Price Fields in Data Model

| Field | Model | Purpose | Editable | Used for Revenue |
|-------|-------|---------|----------|------------------|
| `businessService.regularPrice` | BusinessService | Service price template | ✅ Yes (affects future bookings) | ❌ No |
| `slot.regularPrice` | Slot | Slot-specific price (optional) | ⚠️ Only if no bookings | ❌ No |
| `booking.price` | Booking | **Captured price at booking time** | ❌ **IMMUTABLE** | ✅ **YES** |

---

### 8.2 Price Flow

```
1. Provider creates BusinessService
   └─ BusinessService.regularPrice = 100₪

2. Provider creates Slot for that service
   └─ Slot.regularPrice = BusinessService.regularPrice (100₪)
   └─ Can be overridden per slot

3. Customer books the slot
   └─ Booking.price = BusinessService.regularPrice (100₪ at booking time)
   └─ ✅ IMMUTABLE — Stored permanently in Booking record

4. Provider edits service price
   └─ BusinessService.regularPrice = 120₪ (NEW VALUE)
   └─ ❌ Does NOT affect existing Booking.price
   └─ ✅ Only affects FUTURE bookings

5. Provider tries to edit slot price with existing bookings
   └─ ❌ BLOCKED by backend validation (Section 7)
   └─ Prevents confusion
```

---

### 8.3 Revenue Calculation Rules

**✅ CORRECT — For Reports and Revenue Calculations:**
- **ALWAYS** use `Booking.price`
- `Booking.price` is captured at booking creation and **never changes**
- Even if slot price or service price changes later, booking price remains original
- Reports, dashboards, analytics **MUST** use `Booking.price` only

**❌ INCORRECT — Do NOT Use for Revenue:**
- ❌ `Slot.regularPrice` — Mutable, unreliable
- ❌ Current `BusinessService.regularPrice` — May have changed since booking
- ❌ Any calculated or inferred price

**Example query for revenue report:**
```sql
SELECT
  Slot.date,
  SUM(Booking.price) AS revenue,  -- ✅ Use Booking.price
  COUNT(Booking.id) AS bookingCount
FROM Booking
JOIN Slot ON Booking.slotId = Slot.id
WHERE Booking.businessId = ?
  AND Booking.status IN ('CONFIRMED', 'COMPLETED')
  AND Slot.date BETWEEN ? AND ?
GROUP BY Slot.date
ORDER BY Slot.date ASC
```

---

### 8.4 UX Confusion Risk

**Scenario:**
- Provider edits `Slot.regularPrice` from 100₪ to 120₪
- Existing booking still has `Booking.price = 100₪` in database
- Provider expects revenue of 120₪, actual is 100₪

**Solution (implemented via Section 7 rules):**
- ⚠️ Lock `Slot.regularPrice` editing when bookings exist
- Show warning: "לא ניתן לשנות מחיר כאשר יש הזמנות פעילות"
- Alternative: Allow with explicit confirmation + audit log (future P1)

---

### 8.5 Manual Price Override (Future)

**If ever allowed:**
- Must require explicit reason/note
- Must create audit trail
- Must notify customer if booking price changes
- May require admin approval
- Should be rare exception, not normal flow

**MVP:**
- ❌ Manual price override NOT supported
- `Booking.price` is **immutable**

---

## 9. Shared Component Architecture

This section defines the **target architecture** for shared calendar components.

### 9.1 Recommended Shared Components

**Location:** `client/src/shared/calendar/`

**Primitives:**
- `CalendarShell.jsx` — Wrapper with view switcher + toolbar + view content area
- `CalendarViewSwitcher.jsx` — Day/Week/Month toggle buttons
- `CalendarToolbar.jsx` — Previous / Today / Next buttons + date display
- `CalendarMonthGrid.jsx` — ✅ EXISTS — Month grid layout (7×~5)
- `CalendarWeekGrid.jsx` — NEW — Week grid layout (7 columns)
- `CalendarTimeGrid.jsx` — NEW (move from provider) — 24-hour hourly grid
- `CalendarDateCell.jsx` — ✅ EXISTS — Individual date cell
- `CalendarEventCard.jsx` — ✅ EXISTS — Event/booking card (role-aware)
- `CalendarDayTimeline.jsx` — NEW — Single-day timeline (alternative to grid)

**Utils:**
- `calendarUtils.js` — ✅ EXISTS — Date formatting, Hebrew day names
- `statusColors.js` — ✅ EXISTS — Booking status metadata (canonical source)
- `timeGridUtils.js` — NEW — Time positioning, overlap calculation

**Adapters:**
- `calendarAdapters.js` — NEW — Transform Booking/Slot → CalendarEvent
- `calendarTypes.js` — NEW — TypeScript-style type definitions

---

### 9.2 Role-Specific Components

**Customer-specific:**
- `CustomerCalendarPage.jsx` — Fetches bookings, uses `CalendarShell`
- `CustomerCalendarMonthView.jsx` — Customer month view wrapper
- `CustomerCalendarWeekView.jsx` — Customer week view wrapper
- `CustomerCalendarDayView.jsx` — Customer day view wrapper
- `customerCalendarAdapter.js` — Booking → CalendarEvent transformation

**Provider-specific:**
- `ProviderCalendarPage.jsx` — Fetches slots, uses `CalendarShell`
- `ProviderCalendarDayView.jsx` — Provider day view wrapper
- `ProviderCalendarWeekView.jsx` — Provider week view wrapper
- `ProviderCalendarMonthView.jsx` — Provider month view wrapper
- `providerCalendarAdapter.js` — Slot → CalendarEvent transformation
- `ProviderAvailabilityEditor.jsx` — Edit availability modal
- `ProviderAvailabilityDetails.jsx` — Availability details drawer

---

### 9.3 Component Usage Rules

**Before creating a new calendar component:**
1. ✅ Check `client/src/shared/calendar/` first
2. ✅ Check if existing component can be extended
3. ✅ Check if role-aware variant is appropriate
4. ❌ Do NOT duplicate grid/toolbar components

**When extending shared components:**
- ✅ Pass `context="customer"` or `context="provider"` for role-aware behavior
- ✅ Use composition (wrap shared component with role-specific logic)
- ❌ Do NOT fork shared components into customer/provider directories

**Examples:**

✅ **Correct:**
```javascript
// Customer calendar uses shared CalendarEventCard
<CalendarEventCard
  event={event}
  context="customer"  // Role-aware variant
  onClick={handleBookingClick}
/>
```

❌ **Incorrect:**
```javascript
// Don't create CustomerCalendarEventCard that duplicates CalendarEventCard
```

---

### 9.4 Legacy Components — Do NOT Reuse

🗑️ **Do NOT use as reference or copy:**
- `business/calendar/CalendarPage.jsx` — Legacy unified calendar
- `business/calendar/components/DayView.jsx` — Different architecture
- `business/calendar/hooks/useCalendarData.js` — Unified event model not needed
- All business calendar modals/cards — Not aligned with current architecture

**Why:**
- Built for deprecated BUSINESS role
- Different data model (unified events)
- Different UX patterns
- Will be removed in Phase 6

**✅ CAN salvage concepts (not code):**
- KPI bar idea (for provider dashboard, separate from calendar)
- Heat map idea (future enhancement, separate component)

---

## 10. Calendar View Model

This section defines a **recommended future unified event model** for calendar views.

### 10.1 CalendarEvent Interface

**Purpose:** Normalize different data sources (Booking, Slot) into a consistent format for shared calendar UI components.

**Recommended interface:**

```typescript
interface CalendarEvent {
  // Identity
  id: string;  // Unique ID for this event (e.g., "booking-123" or "slot-456")
  type: "availability" | "booking" | "time-block" | "external-event";

  // Temporal
  date: string;  // YYYY-MM-DD
  startTime: string;  // HH:MM
  endTime: string;  // HH:MM

  // Display
  title: string;  // Primary text (service name or business name)
  subtitle: string;  // Secondary text (duration, price, etc.)
  status: string;  // Status (Slot status or Booking status)
  statusMeta: {  // From statusColors.js
    label: string,
    bgColor: string,
    textColor: string,
    borderColor: string
  };

  // Metadata (for availability type)
  bookingCount?: number;  // Active bookings count
  capacity?: number;  // Max bookings this slot can hold
  hasBookings?: boolean;  // Quick check

  // Actions
  allowedActions: string[];  // ["edit", "delete", "view", "cancel"]
  onClick: () => void;  // Role-specific click handler

  // Source (for details view)
  sourceId: number;  // Original Slot/Booking ID
  sourceModel: "Slot" | "Booking" | "CalendarEvent" | "TimeBlock";
  sourceData: any;  // Original object for details view
}
```

---

### 10.2 Customer Adapter

**Purpose:** Transform `Booking` → `CalendarEvent`

**Example:**

```javascript
// client/src/features/customer/calendar/customerCalendarAdapter.js

import { getCalendarStatusMeta } from '../../../shared/calendar/utils/statusColors';

export function bookingToCalendarEvent(booking, context = "customer") {
  const statusMeta = getCalendarStatusMeta(booking.status);

  return {
    id: `booking-${booking.id}`,
    type: "booking",
    date: booking.slot.date,
    startTime: booking.startTime,
    endTime: booking.endTime,
    title: booking.business?.name || "עסק",
    subtitle: booking.businessService?.serviceTemplate?.name || "שירות",
    status: booking.status,
    statusMeta,
    allowedActions: canCancelBooking(booking) ? ["view", "cancel"] : ["view"],
    onClick: () => navigateToBookingDetails(booking.id),
    sourceId: booking.id,
    sourceModel: "Booking",
    sourceData: booking
  };
}

function canCancelBooking(booking) {
  return ['PENDING', 'CONFIRMED', 'APPROVED'].includes(booking.status);
}
```

---

### 10.3 Provider Adapter

**Purpose:** Transform `Slot` → `CalendarEvent`

**Example:**

```javascript
// client/src/features/service-provider/calendar/providerCalendarAdapter.js

import { getSlotStatusMeta } from '../../../shared/calendar/utils/statusColors';

export function slotToCalendarEvent(slot) {
  const activeBookings = slot.bookings?.filter(isActiveBooking) || [];
  const statusMeta = getSlotStatusMeta(slot.status);

  return {
    id: `slot-${slot.id}`,
    type: "availability",
    date: slot.date,
    startTime: slot.startTime,
    endTime: slot.endTime,
    title: slot.service?.name || "שירות",
    subtitle: `${slot.service?.durationMinutes} דק׳ • ${slot.regularPrice}₪`,
    status: slot.status,
    statusMeta,
    bookingCount: activeBookings.length,
    capacity: calculateCapacity(slot),
    hasBookings: activeBookings.length > 0,
    allowedActions: activeBookings.length > 0 ? ["view"] : ["edit", "delete"],
    onClick: () => handleSlotClick(slot, activeBookings.length > 0),
    sourceId: slot.id,
    sourceModel: "Slot",
    sourceData: slot
  };
}

function isActiveBooking(booking) {
  return ['PENDING', 'CONFIRMED', 'APPROVED'].includes(booking.status);
}

function calculateCapacity(slot) {
  // Calculate how many bookings this slot can hold
  // Based on slot duration and service duration
  const slotDuration = calculateDuration(slot.startTime, slot.endTime);
  const serviceDuration = slot.service?.durationMinutes || slotDuration;
  return Math.floor(slotDuration / serviceDuration);
}
```

---

### 10.4 Benefits of Unified View Model

**✅ Advantages:**
- Shared calendar components can render normalized `CalendarEvent` objects
- Role-specific logic isolated in adapters
- Easy to add new event types (time blocks, external events) later
- Click behavior encapsulated in adapter
- Status colors applied consistently

**Implementation:**
- Adapters are **role-specific** (customer vs provider)
- Shared UI components consume `CalendarEvent` interface
- Future: Could be formalized with TypeScript

---

## 11. Data and API Principles

This section defines current and future API requirements for calendar views.

### 11.1 Customer Calendar APIs

**Current:**
- `GET /bookings?mine=true` — Returns all customer's bookings
- Includes: `Slot`, `Business`, `BusinessService`, `service` relations
- ✅ **Sufficient** for day/week/month views (frontend can filter by date)

**Optional future enhancement:**
- `GET /api/customer/calendar?from={date}&to={date}` — Date range filter
- Benefits: Server-side filtering, performance optimization
- Priority: **P2** (current endpoint is sufficient)

---

### 11.2 Provider Calendar APIs

**Current:**
- `GET /api/service-provider/slots?date={date}` — Returns slots for **one date**
- Includes: `Booking` array, `BusinessService`, `service`
- ❌ **Limitation:** No date range support
- Week view requires 7 API calls
- Month view requires ~30 API calls

**Recommended future endpoint:**

```
GET /api/service-provider/calendar?from={date}&to={date}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": "slot-123",
        "type": "availability",
        "date": "2026-07-15",
        "startTime": "09:00",
        "endTime": "12:00",
        "status": "OPEN",
        "title": "תספורת גברים",
        "subtitle": "60 דק׳ • 100₪",
        "bookingCount": 2,
        "capacity": 3,
        "hasBookings": true,
        "sourceId": 123,
        "sourceModel": "Slot",
        "allowedActions": ["view"]
      }
    ],
    "metrics": {
      "totalSlots": 10,
      "openSlots": 5,
      "bookedSlots": 3,
      "fullSlots": 2
    }
  }
}
```

**Benefits:**
- Single API call for week/month views
- Pre-computed booking counts
- Normalized event model
- Optional metrics for dashboard

**Schema changes needed:**
- ❌ **NONE** — Uses existing `Slot` + `Booking` tables
- Computed in backend query

**Priority:** Phase 5 (provider week/month views)

---

## 12. Implementation Phases

This section defines the **recommended phased roadmap** for calendar system implementation.

### Phase 0 — Calendar System Documentation

**Status:** ✅ **CURRENT TASK**

**Scope:**
- Create `docs/LOMEA_CALENDAR_SYSTEM.md`
- Update `docs/LOMEA_BUILDING_PRINCIPLES.md` to reference it

**Mode:** BRAVE (docs-only)
**Backend needed:** ❌ No
**Schema needed:** ❌ No
**Risk level:** ⚫ None
**Estimated effort:** 2-3 hours
**Suggested commit:** `docs: create Lomea Calendar System specification`

---

### Phase 1 — Provider Calendar Edit Safety (P0 Critical)

**Scope:**
- Fix edit modal title: "עריכת תור" → "עריכת זמינות"
- Add warning banner when editing availability with bookings
- Show booking count in availability cards
- Backend validation: Lock price/date/time editing when bookings exist
- Backend validation: Block delete when bookings exist

**Mode:** PLAN first (backend validation strategy), then BRAVE
**Backend needed:** ✅ Yes (validation logic)
**Schema needed:** ❌ No
**Risk level:** 🟡 Medium
**Estimated effort:** 4-6 hours
**Suggested commits:**
1. `fix(provider): correct calendar edit modal title and warnings`
2. `feat(api): add booking-aware validation to slot editing`

**Priority:** **P0 — CRITICAL** (prevents confusion and data integrity issues)

---

### Phase 2 — Shared Calendar Primitives

**Scope:**
- Create `CalendarShell.jsx`, `CalendarViewSwitcher.jsx`, `CalendarToolbar.jsx`
- Move `CalendarTimeGrid.jsx` from provider to shared
- Create `timeGridUtils.js`, `calendarAdapters.js`, `calendarTypes.js`

**Mode:** BRAVE
**Backend needed:** ❌ No
**Schema needed:** ❌ No
**Risk level:** 🟡 Low (new infrastructure, doesn't break existing)
**Estimated effort:** 6-8 hours
**Suggested commit:** `feat(calendar): create shared calendar primitives and adapters`

---

### Phase 3 — Customer Day/Week Views

**Scope:**
- Refactor `CustomerCalendarPage` to use `CalendarShell`
- Create `CustomerCalendarWeekView.jsx`, `CustomerCalendarDayView.jsx`
- Create `customerCalendarAdapter.js`

**Mode:** BRAVE
**Backend needed:** ❌ No (uses existing `/bookings?mine=true`)
**Schema needed:** ❌ No
**Risk level:** 🟡 Low (additive)
**Estimated effort:** 8-10 hours
**Suggested commit:** `feat(customer): add day and week calendar views`

**User impact:** ✅ High — Customers can view day/week calendars

---

### Phase 4 — Provider Day View Redesign

**Scope:**
- Refactor `ProviderCalendarPage` to use `CalendarShell`
- Enhance day view with improved UX (booking badges, status colors, action buttons)
- Create `ProviderAvailabilityEditor.jsx`, `ProviderAvailabilityDetails.jsx`

**Mode:** PLAN first (UX review), then BRAVE
**Backend needed:** ❌ No (uses existing APIs + Phase 1 validation)
**Schema needed:** ❌ No
**Risk level:** 🟡 Medium (refactoring existing)
**Estimated effort:** 10-12 hours
**Suggested commit:** `feat(provider): redesign day view calendar with improved UX`

**User impact:** ✅ Very High — Professional provider calendar

---

### Phase 5 — Provider Week/Month Views

**Scope:**
- Create `GET /api/service-provider/calendar?from={date}&to={date}` endpoint
- Create `ProviderCalendarWeekView.jsx`, `ProviderCalendarMonthView.jsx`

**Mode:** PLAN first (API design), then BRAVE
**Backend needed:** ✅ Yes (new calendar endpoint)
**Schema needed:** ❌ No
**Risk level:** 🟡 Low (additive)
**Estimated effort:** 10-12 hours
**Suggested commits:**
1. `feat(api): add provider calendar range endpoint`
2. `feat(provider): add week and month calendar views`

**User impact:** ✅ High — Providers can see weekly/monthly overview

---

### Phase 6 — Reports v1

**Scope:**
- Create provider reports module
- Revenue dashboard with date range filter
- Use `Booking.price` for revenue (safe after Phase 1)

**Mode:** PLAN first, then BRAVE
**Backend needed:** ✅ Yes
**Schema needed:** ❌ No
**Risk level:** 🟡 Low (new feature)
**Estimated effort:** 6-8 hours
**Suggested commit:** `feat(provider): add reports module v1`

**Dependencies:** Phase 1 (edit safety rules) should be complete first

**User impact:** ✅ Very High — Revenue insights

---

### Phase 7 — Legacy Calendar Cleanup

**Scope:**
- Remove `business/calendar/**` directory
- Remove `/api/calendar/:businessId` endpoint (if not used elsewhere)

**Mode:** PLAN first (audit dependencies), then BRAVE
**Backend needed:** ⚠️ Maybe
**Schema needed:** ❌ No
**Risk level:** 🟡 Medium (cleanup)
**Estimated effort:** 2-4 hours
**Suggested commit:** `chore: remove deprecated business calendar`

**User impact:** None (cleanup)

---

### Recommended Execution Order

1. **Phase 0** (docs) — ✅ Current task
2. **Phase 1** (edit safety) — P0 critical fix
3. **Phase 2** (shared primitives) — Infrastructure
4. **Phase 3** (customer day/week) — Quick win
5. **Phase 4** (provider day redesign) — Major improvement
6. **Phase 5** (provider week/month) — Complete provider calendar
7. **Phase 6** (reports) — After edit rules stable
8. **Phase 7** (cleanup) — Last (non-critical)

---

## 13. Calendar Work Checklist

### 13.1 Before Starting Any Calendar Task

**☑️ Documentation:**
- [ ] Read `docs/LOMEA_BUILDING_PRINCIPLES.md`
- [ ] Read `docs/LOMEA_CALENDAR_SYSTEM.md` (this document)
- [ ] Identify which calendar: customer or provider
- [ ] Identify which view: day, week, or month
- [ ] Identify data model: Booking, Slot, or both

**☑️ Safety Checks:**
- [ ] Run `git status` — working tree must be clean
- [ ] Run `git branch --show-current` — verify correct branch
- [ ] Run `git stash list` — note stash state, do not touch

**☑️ Existing Components:**
- [ ] Check `client/src/shared/calendar/` for shared components
- [ ] Check `client/src/shared/calendar/utils/statusColors.js` for status metadata
- [ ] Do NOT duplicate existing calendar primitives

**☑️ Edit Rules (Provider Calendar Only):**
- [ ] If editing availability, check if bookings exist
- [ ] If price/revenue involved, verify using `Booking.price` not `Slot.regularPrice`
- [ ] If locked fields needed, follow Section 7 rules

**☑️ Conflict Check:**
- [ ] If task conflicts with this document → STOP and report before coding

---

### 13.2 During Calendar Implementation

**☑️ Component Usage:**
- [ ] Use shared calendar components from `client/src/shared/calendar/`
- [ ] Use `CalendarEventCard` with `context` prop for role-aware behavior
- [ ] Use `statusColors.js` for status metadata (canonical source)
- [ ] Use `calendarUtils.js` for date/time formatting

**☑️ Terminology:**
- [ ] Customer calendar: Use "תור" (appointment), "יומן" (calendar)
- [ ] Provider calendar: Use "זמינות" (availability), "הזמנה" (booking)
- [ ] **NEVER** use "עריכת תור" for availability editing (use "עריכת זמינות")
- [ ] **NEVER** use "סלוט" in user-facing UI

**☑️ Edit Safety (Provider):**
- [ ] Lock fields when bookings exist (Section 7)
- [ ] Show warning banner when editing availability with bookings
- [ ] Show booking count
- [ ] Backend validation for price/date/time changes

---

### 13.3 After Calendar Implementation

**☑️ Code Quality:**
- [ ] Run `git diff --check` (no trailing whitespace)
- [ ] Run `npm run build` for client (if code changed)
- [ ] No debug code, commented blocks, or temporary hacks

**☑️ Testing:**
- [ ] Test empty state
- [ ] Test with at least one booking/availability item
- [ ] Test click behavior
- [ ] Test mobile view (if applicable)
- [ ] Browser verification performed? (be honest)

**☑️ Commit:**
- [ ] Conventional commit message format
- [ ] No Claude footer
- [ ] No `Co-Authored-By: Claude`
- [ ] Clear description of what and why

**☑️ Final Checks:**
- [ ] Run `git status` — verify changes
- [ ] Run `git stash list` — verify stash unchanged
- [ ] Do NOT push (unless explicitly approved)

---

## Appendix A: Quick Reference

### A.1 Key Terminology

| English | Customer Hebrew | Provider Hebrew | Technical |
|---------|----------------|-----------------|-----------|
| Appointment | תור | הזמנה | Booking |
| Availability | N/A | זמינות / חלון זמינות | Slot |
| Calendar | יומן | יומן | Calendar |
| Edit appointment | N/A | פרטי הזמנה | Edit booking |
| Edit availability | N/A | עריכת זמינות | Edit slot |

### A.2 Data Model Quick Reference

| Field | Model | Purpose | Editable | Revenue Source |
|-------|-------|---------|----------|----------------|
| `businessService.regularPrice` | BusinessService | Service price | ✅ Yes | ❌ No |
| `slot.regularPrice` | Slot | Slot price | ⚠️ Only if no bookings | ❌ No |
| `booking.price` | Booking | Captured price | ❌ Immutable | ✅ **YES** |

### A.3 File Locations

**Documentation:**
- `docs/LOMEA_BUILDING_PRINCIPLES.md` — General architecture
- `docs/LOMEA_CALENDAR_SYSTEM.md` — Calendar-specific (this document)

**Shared Calendar:**
- `client/src/shared/calendar/` — Shared components
- `client/src/shared/calendar/utils/statusColors.js` — Status metadata (canonical)
- `client/src/shared/calendar/utils/calendarUtils.js` — Date formatting

**Customer Calendar:**
- `client/src/features/customer/pages/CustomerCalendarPage.jsx`
- `client/src/features/customer/pages/CustomerCalendarView.jsx`
- `client/src/features/customer/hooks/useMyBookings.js`

**Provider Calendar:**
- `client/src/features/service-provider/pages/CalendarPage.jsx`
- `client/src/features/service-provider/components/calendar/CalendarDayView.jsx`
- `client/src/features/service-provider/components/calendar/CalendarTimeGrid.jsx`

**Backend:**
- `server/src/routes/booking.routes.js` — Customer bookings
- `server/src/routes/service-provider-slots.routes.js` — Provider slots

---

## Appendix B: Document History

| Date | Change | Author/Source |
|------|--------|---------------|
| 2026-07-12 | Created calendar system specification | Comprehensive calendar PLAN |
| 2026-07-12 | Defined day/week/month behavior for customer and provider | Calendar PLAN |
| 2026-07-12 | Defined provider edit and lock rules | Calendar PLAN Section E |
| 2026-07-12 | Defined price/revenue rules and Booking.price immutability | Calendar PLAN Section F |
| 2026-07-12 | Defined phased implementation roadmap | Calendar PLAN Section I |

---

**END OF DOCUMENT**

**This is the mandatory calendar system specification for Lomea.**

**Read before every calendar-related PLAN or BRAVE task.**
