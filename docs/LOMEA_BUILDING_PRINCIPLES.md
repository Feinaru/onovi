# Lomea Building Principles

**Status:** 🔒 MANDATORY
**Last Updated:** 2026-07-12
**Version:** 1.0

---

## ⚠️ THIS DOCUMENT MUST BE READ BEFORE ANY IMPLEMENTATION

**For all developers and AI agents:**

- This document **MUST** be read before starting any PLAN or BRAVE implementation task
- If a requested task conflicts with these principles, **STOP and report before coding**
- This is the **master source of truth** for Lomea development
- When in doubt, follow this document

**Violation of these principles may result in rejected code.**

---

## 0. How to Use This Document

### For Developers and AI Agents

**Before every PLAN or BRAVE task:**
1. Read this document (or refresh your memory of relevant sections)
2. Check if your task conflicts with any principle
3. If conflict exists, report before implementing
4. Follow the pre-implementation checklist (Section 15)

### For Product and Tech Leads

- This is the canonical reference for architecture and development standards
- Update this document when architecture decisions change
- Review quarterly for relevance and accuracy
- Link to this document in onboarding materials

### Document Scope

This document covers:
- ✅ Data model and business rules
- ✅ Hebrew terminology standards
- ✅ UI/UX consistency principles
- ✅ Backend and API conventions
- ✅ Development workflow and git rules
- ✅ Pre-implementation checklists

---

# PART I: DATA MODEL AND BUSINESS RULES

## 1. Users and Roles

### User Model

A **User** represents any authenticated person in the system.

**Fields:**
- `id`, `fullName`, `phone` (unique), `email`, `passwordHash`
- `role` (UserRole enum)
- `status` (UserStatus enum)
- `lastLoginAt`, `createdAt`, `updatedAt`

**Rules:**
- One user can own multiple businesses
- One user has exactly one role
- Phone number is the primary unique identifier

### Active Roles

| Role | Purpose | Home View | Primary Navigation |
|------|---------|-----------|-------------------|
| `CUSTOMER` | Service recipients who book appointments | `customer` | Customer search, my appointments, calendar |
| `SERVICE_PROVIDER` | Service providers who manage businesses | `service-provider` | Dashboard, services, availability, bookings |
| `ADMIN` | System administrators | `admin` | Business approvals, system management |

### DEPRECATED Roles

| Role | Status | Replacement | Action Required |
|------|--------|-------------|-----------------|
| `BUSINESS` | ⚠️ LEGACY | `SERVICE_PROVIDER` | Being migrated |
| `SERVICE_RECIPIENT` | ❌ NOT USED | `CUSTOMER` | Use CUSTOMER |

**Rules:**
- All new service provider users **MUST** be created with `SERVICE_PROVIDER` role
- Frontend routing **MUST** check for `SERVICE_PROVIDER`, not `BUSINESS`
- Backend auth middleware **MAY** accept both during migration, but prefer `SERVICE_PROVIDER`

---

## 2. Business / Service Provider Profile

### Business Model

Represents a service provider's business profile.

**Key Fields:**
- **Identity:** `id`, `publicId`, `name`, `description`, `phone`
- **Official ID:** `identifierType`, `identifierValue` (MANDATORY and UNIQUE)
- **Address:** `cityCode`, `cityNameHebrew`, `streetCode`, `streetNameHebrew`, `houseNumber`, `formattedAddress`
- **Location:** `latitude`, `longitude`, `hasExactCoordinates`
- **Media:** `logoUrl`, `coverImageUrl`, `galleryImages`
- **Settings:** `language`, `timezone`, `defaultAppointmentBufferMins`, `defaultBookingBehavior`
- **Status:** `status` (BusinessStatus enum)

### Business Status

```
PENDING_APPROVAL - Awaiting admin approval (default for new businesses)
ACTIVE - Approved and operational
SUSPENDED - Temporarily disabled by admin
```

**Rules:**
- New businesses **MUST** start in `PENDING_APPROVAL` status
- Only **ADMIN** can change business status to `ACTIVE` or `SUSPENDED`
- Business cannot be seen by customers until status is `ACTIVE`

---

## 3. Services and Service Catalog

### Hierarchy: Field → Profession → ServiceTemplate → BusinessService

**Field (Top-level category):**
- Examples: "Health", "Beauty", "Education"
- Admin-managed only

**Profession (Specific profession):**
- Examples: "Hairdresser" under "Beauty"
- Belongs to one field
- Admin-managed only

**ServiceTemplate (Specific service template):**
- Examples: "Haircut" under "Hairdresser"
- Belongs to one profession
- Has default duration, price, color level (risk indicator)
- Admin-managed only

**BusinessService (Provider's offering):**
- A business's specific offering of a service template
- Provider-managed
- Has custom name, duration, price
- Requires admin approval (`approvalStatus`: PENDING → APPROVED)
- Can be made visible/invisible to customers

**Rules:**
- Service catalog (Field/Profession/ServiceTemplate) is managed by **ADMIN only**
- Providers select from approved templates and customize for their business
- `businessService.durationMinutes` is the **source of truth** for service duration
- `businessService.regularPrice` is the **source of truth** for service price

---

## 4. Availability and Slots

### Critical Product Rule: Opt-In Availability Model

**Customers NEVER see:**
- ❌ Business working hours
- ❌ General "free time" calculated from calendar
- ❌ External appointments (Google Calendar, etc.)

**Customers ONLY see:**
- ✅ Slots explicitly published to Lomea by the business
- ✅ With status: `OPEN` (available for booking)

### Formula for Customer Visibility

```
Customer Available Slots =
  Published Lomea Slots (status: OPEN)
  MINUS Existing Active Bookings
```

**External appointments are blockers only — they do NOT create availability.**

### Slot Model

A **Slot** represents a provider-created availability window.

**Fields:**
- `id`, `publicId`, `businessId`
- `date` (YYYY-MM-DD string)
- `startTime`, `endTime` (HH:MM strings)
- `regularPrice`, `dealPrice`
- `status` (SlotStatus enum)
- `allowedServiceIds` (multi-service support via SlotAllowedService relation)

### Slot Status

```
OPEN - Available for customer booking
RESERVED - Temporarily held during booking flow
BOOKED - Deprecated, avoid using
FULL - No legal booking time remains
CANCELLED - Provider cancelled the slot
EXPIRED - Slot date/time has passed
```

**Rules:**
- Slots are created by providers, not auto-generated
- One slot can allow multiple services (multi-service slots)
- Slot status is recalculated based on available booking windows
- Customers see only `OPEN` slots with legal start times

---

## 5. Bookings

### Booking Model

A **Booking** represents a customer appointment.

**Fields:**
- `id`, `publicId`, `customerId`, `businessId`, `slotId`, `businessServiceId`
- `date`, `startTime`, `endTime`
- `price`, `customerNote`, `businessNote`
- `status` (BookingStatus enum)

### Booking Status

```
PENDING - Awaiting provider approval
APPROVED - Approved (legacy, same as CONFIRMED)
CONFIRMED - Confirmed by provider
REJECTED - Rejected by provider
COMPLETED - Appointment completed
CANCELLED - Generic cancellation
CANCELLED_BY_CUSTOMER - Customer cancelled
CANCELLED_BY_BUSINESS - Provider cancelled
NO_SHOW - Customer did not show up
```

**Rules:**
- New bookings start as `PENDING` (if business requires approval) or `CONFIRMED` (if auto-confirm)
- Only active bookings (`PENDING`, `CONFIRMED`) can be cancelled or rescheduled
- Booking price is copied from `businessService.regularPrice` at time of booking
- Booking duration is calculated from `businessService.durationMinutes`

### Booking Status Labels

**One source of truth:** `client/src/shared/calendar/utils/statusColors.js`

**Component:** `client/src/shared/ui/BookingStatusBadge.jsx`

**Rule:** **NEVER create inline status mappings** — always use `BookingStatusBadge` component.

**Context-Aware Labels:**

| Status | Customer Context | Provider/Admin Context |
|--------|------------------|------------------------|
| PENDING | ממתין לאישור | ממתין לאישור |
| CONFIRMED | מאושר | מאושר |
| APPROVED | מאושר | מאושר |
| COMPLETED | הושלם | הושלם |
| CANCELLED | בוטל | בוטל |
| CANCELLED_BY_CUSTOMER | בוטל על ידך | בוטל על ידי הלקוח |
| CANCELLED_BY_BUSINESS | בוטל על ידי העסק | בוטל על ידי העסק |
| REJECTED | נדחה | נדחה |
| NO_SHOW | לא הגעת | לא הגיע |

---

## 6. Booking and Slot Lifecycle

### Booking Creation Flow

1. Customer selects service, date, and start time
2. Backend validates:
   - Slot exists and is `OPEN`
   - Start time is legal for service duration
   - No conflicting active booking for this customer
   - Not a past time
3. Create booking with:
   - `status`: `PENDING` (if approval required) or `CONFIRMED`
   - `price`: copied from `businessService.regularPrice`
   - `endTime`: calculated from `startTime + durationMinutes`
4. Recalculate slot status

### Booking Status Transitions

**Allowed transitions:**
- `PENDING` → `CONFIRMED` (provider approves)
- `PENDING` → `REJECTED` (provider rejects)
- `PENDING` / `CONFIRMED` → `CANCELLED_BY_CUSTOMER` (customer cancels)
- `PENDING` / `CONFIRMED` → `CANCELLED_BY_BUSINESS` (provider cancels)
- `CONFIRMED` → `COMPLETED` (after appointment time)
- `CONFIRMED` → `NO_SHOW` (customer didn't show up)

**Rule:** Only bookings with status `PENDING` or `CONFIRMED` can be cancelled or rescheduled.

---

# PART II: HEBREW TERMINOLOGY DICTIONARY

## 7. Preferred Vocabulary

### Customer-Facing Terms

| English | Hebrew | Usage | Notes |
|---------|--------|-------|-------|
| Appointment | תור | Everywhere | Customer books "תור" |
| My appointments | התורים שלי | Navigation | - |
| Calendar | יומן | Navigation, page titles | **NOT** "לוח שנה" |
| Book appointment | קבע תור | Action buttons | - |
| Find services | מצא תורים | Search page | - |

### Provider/Admin-Facing Terms

| English | Hebrew | Usage | Notes |
|---------|--------|-------|-------|
| Booking | הזמנה | Provider/admin side | Business management language |
| Bookings | הזמנות | Page titles | - |
| Pending bookings | הזמנות ממתינות לאישור | Filter labels | Full form, not "ממתינות" |
| Availability | זמינות | Provider-created time window | - |
| Create availability | פתח זמינות חדשה | Form titles | **NOT** "פרסום תור" |
| Time window | חלון זמינות | Descriptions | - |

### Shared Terms (All Roles)

| English | Hebrew | Universal |
|---------|--------|-----------|
| Service | שירות | Same everywhere |
| Business | עסק | Same everywhere |
| Customer | לקוח | Prefer over "מקבל שירות" |
| Service provider | נותן שירות | - |

### Grammar and Style Rules

**Use full forms, not abbreviations:**
- ✅ **Use:** "על ידי" (by, full form)
- ❌ **NEVER:** "ע״י" or "ע"י" (abbreviation, informal)

**Use complete phrases:**
- ✅ **Use:** "ממתין לאישור" (waiting for approval)
- ❌ **Avoid:** "ממתין" (incomplete in professional contexts)

**Avoid exposing technical jargon:**
- ✅ **Use:** "זמינות" or "חלון זמינות" (user-facing)
- ❌ **Avoid:** "סלוט" (technical, English-derived)

**Calendar terminology:**
- ✅ **Use:** "יומן" (journal/calendar)
- ❌ **Avoid:** "לוח שנה" (less natural in app context)

---

# PART III: UI/UX CONSISTENCY PRINCIPLES

## 8. Role-Based UX Differences

### Justified Role-Specific Differences

**Different roles have different needs. Do NOT force identical UX when role-specific behavior is justified.**

| Aspect | Customer | Provider | Admin |
|--------|----------|----------|-------|
| **Appointment language** | "תור" (appointment) | "הזמנה" (booking) | "הזמנה" (booking) |
| **Calendar purpose** | Read-only booking view | Availability management + bookings | System oversight |
| **Calendar functionality** | View my appointments | Create availability, manage bookings | Monitor all bookings |
| **Primary actions** | Book, cancel, reschedule | Create availability, approve/reject | Approve businesses/services |
| **Navigation style** | Simple, customer-focused | Business management tools | Admin controls |
| **Data visibility** | Own appointments only | Own business data | All system data |

### What MUST Be Shared (Where Applicable)

| Element | Consistency Rule |
|---------|-----------------|
| **Booking status labels** | Via `statusColors.js` |
| **Booking status badges** | Via `BookingStatusBadge` component |
| **Date/time formatting** | Via `calendarUtils.js` helpers |
| **Empty states** | Use shared `EmptyState` component |
| **Loading states** | Consistent patterns (emoji + Hebrew text) |
| **Buttons** | Use shared `Button` component or `.btn-*` classes |
| **Cards** | Use `.card` class or shared `Card` component |
| **Modals** | Use consistent modal patterns |
| **Hebrew terminology** | Follow Section 7 dictionary |
| **Professional tone** | Across all roles |
| **RTL consistency** | Hebrew right-to-left everywhere |

---

## 9. Shared Component Principles

### Before Creating a New UI Element

**Check these locations first:**
1. `client/src/shared/ui/` — shared UI components
2. `client/src/shared/calendar/` — shared calendar components
3. Existing feature components — look for similar patterns

### Known Shared Components

**UI Components:**
- `BookingStatusBadge.jsx` — **Booking statuses** (MANDATORY for all booking status displays)
- `StatusBadge.jsx` — User/business approval statuses
- `Button.jsx` — Buttons
- `Card.jsx` — Cards
- `Badge.jsx` — Generic badges
- `EmptyState.jsx` — Empty states
- `Toast.jsx` — Toast notifications
- `Input.jsx`, `Select.jsx` — Form inputs
- `Drawer.jsx` — Side drawer

**Calendar Components:**
- `CalendarMonthGrid.jsx` — Month grid
- `CalendarDateCell.jsx` — Date cell
- `CalendarEventCard.jsx` — Event card
- `CalendarMonthHeader.jsx` — Month header
- `calendarUtils.js` — Date formatting utilities
- `statusColors.js` — **Booking status metadata (CANONICAL SOURCE)**

### Critical Rules

**❌ NEVER create inline status mappings:**
```javascript
// ❌ BAD - inline duplication
const statusLabels = {
  'PENDING': 'ממתין לאישור',
  'CONFIRMED': 'מאושר',
  ...
};
```

**✅ ALWAYS use shared components:**
```javascript
// ✅ GOOD - use shared component
<BookingStatusBadge status={booking.status} context="customer" />
```

**❌ NEVER create new badge/color systems** — extend existing ones if needed.

**✅ ALWAYS check for existing patterns** before creating new components.

---

## 10. Empty, Loading, and Error State Principles

### Empty States

**Use `EmptyState` component where applicable.**

**Required elements:**
- Emoji or icon
- Clear title
- Helpful description
- Optional call-to-action button

**Hebrew copy guidelines:**
- Explain what will appear in this space
- Suggest what action the user can take
- Be friendly and helpful, not technical

**Examples:**
- ✅ "אין תורים קרובים. לחץ על 'מצא תורים' כדי לקבוע תור חדש"
- ✅ "אין זמינות ביום זה. לחץ על 'פתח זמינות חדשה' כדי ליצור זמינות"
- ❌ "No data" (English, not helpful)

### Loading States

**Consistent pattern:**
- Emoji or spinner + Hebrew text
- "טוען..." or specific context (e.g., "טוען הזמנות...")
- Center-aligned, adequate padding

**Consider creating `LoadingState` component (future improvement).**

### Error States

**Error Boundary:**
- Use `ErrorBoundary` component for app crashes
- Provides fallback UI and error logging

**Toast notifications:**
- Use `Toast` component for transient errors
- Hebrew error messages should be user-friendly, not technical

**Error messages:**
- ✅ "שגיאה בטעינת ההזמנות. נסה שוב מאוחר יותר"
- ❌ "Error 500: Internal server error"

---

## 11. Broad Design Changes Require PLAN

### What Constitutes a "Broad Design Change"

**The following require PLAN mode first (not BRAVE):**
- Changing page layouts (e.g., moving sidebar, changing grid structure)
- Changing card structures (e.g., redesigning booking cards)
- Changing tab systems (e.g., replacing tabs with dropdown)
- Changing calendar grid structure (e.g., month → week view)
- Changing global CSS variables (e.g., color palette, spacing scale)
- Changing typography system
- Creating or replacing design system architecture

**Small consistency fixes can be BRAVE if scoped:**
- Button label changes
- Status badge replacements (using existing component)
- Empty state text updates
- Terminology alignment
- Component consolidation (if limited scope)

**When in doubt, PLAN first.**

---

# PART IV: CALENDAR, SERVICES, AND AVAILABILITY

## 12. Availability Model (CRITICAL PRODUCT RULE)

### Opt-In Availability Model

**Lomea is a gap-filling platform, not a general booking platform.**

**Customers NEVER see:**
- ❌ Business working hours
- ❌ General "free time" calculated from business calendar
- ❌ Time slots auto-generated from "business hours minus bookings"
- ❌ External appointments (Google Calendar, etc.)

**Customers ONLY see:**
- ✅ Slots explicitly published to Lomea by the business
- ✅ With status: `OPEN` (available for booking)

### Formula for Customer Visibility

```
Customer Available Times =
  Published Lomea Slots (status: OPEN)
  MINUS Existing Active Bookings (PENDING, CONFIRMED)
```

**Rule:** External appointments (if integrated later) are **blockers only** — they do NOT create customer-visible availability.

**Rule:** Providers must explicitly publish availability; it is not inferred.

---

## 13. Provider Calendar Principles

### Provider Calendar Is a Work Management Tool

**The provider calendar is the daily workspace for managing the entire working schedule.**

**It may include (now or future):**
- Published Lomea availability (slots)
- Lomea bookings (confirmed customer appointments)
- External appointments (future: Google Calendar sync)
- Time blocks (personal time, breaks, unavailable periods)
- Vacations

**Rules:**
- ❌ **Do NOT modify provider calendar logic without dedicated PLAN**
- ✅ Provider calendar and customer calendar serve different purposes
- ✅ Provider calendar may have different UI/behavior than customer calendar (justified)
- ✅ Reuse visual primitives where appropriate (date cells, event cards, colors)

---

## 14. Customer Calendar Principles

### Customer Calendar Is a Read-Only Appointment View

**The customer calendar displays the customer's booked appointments.**

**Purpose:**
- View my appointments in calendar format
- Quick access to appointment details
- Navigate by month

**Rules:**
- ✅ Use shared calendar components where applicable (`CalendarMonthGrid`, `CalendarEventCard`, etc.)
- ✅ Consistent visual styling with provider calendar (colors, spacing, cards)
- ❌ Do NOT add booking creation or availability management to customer calendar
- ❌ Do NOT force identical behavior to provider calendar when roles differ

---

## 15. Service and Availability Principles

**Provider manages services:**
- Provider selects from admin-approved `ServiceTemplate` catalog
- Provider customizes `BusinessService` (name, duration, price)
- Admin approves `BusinessService` before it becomes visible to customers

**Customer books services:**
- Customer sees only approved, active, visible `BusinessService` offerings
- Customer selects service, then sees available times for that service

**Source of truth:**
- **Service duration:** `businessService.durationMinutes`
- **Service price:** `businessService.regularPrice`
- **Service visibility:** `businessService.visibleToCustomers && businessService.approvalStatus === 'APPROVED'`

**Rules:**
- ❌ Do NOT duplicate service/availability logic in frontend
- ✅ Backend calculates legal start times based on slot windows and service duration
- ✅ Frontend displays available times provided by backend API

---

# PART V: BACKEND AND API PRINCIPLES

## 16. API Routing Conventions

### Preferred Route Structure (Modern)

**Role-scoped routes:**
```
/api/customer/...
/api/service-provider/...
/api/admin/...
```

**Examples:**
- `/api/customer/search/appointments`
- `/api/service-provider/slots`
- `/api/service-provider/bookings`
- `/api/admin/approvals`

### Legacy Routes (Migrate Gradually)

**Legacy routes with role-based filtering inside:**
```
/api/bookings (role-based filtering)
/api/slots
/api/businesses
```

**Rule:** New routes **MUST** use role-scoped prefix unless there's a strong reason not to.

**Rule:** Legacy routes may be refactored gradually; do not force breaking changes without PLAN.

---

## 17. API Response Conventions

### Modern Response Shape (Preferred)

**Success:**
```javascript
{
  success: true,
  data: { ... }
}
```

**Error:**
```javascript
{
  success: false,
  error: "Hebrew user-facing message"
}
```

### Legacy Response Shape (Migrate Gradually)

**Direct data:**
```javascript
{ ... } // object or array
```

**Error:**
```javascript
{ message: "..." }
// or
{ error: "..." }
```

**Rule:** New endpoints **SHOULD** use modern `{ success, data }` shape.

**Rule:** Do NOT change existing API response shapes without PLAN (breaking change).

---

## 18. API Security and Permissions

**Rules:**
- ✅ Use role-based access control (RBAC) consistently
- ✅ Validate user owns the resource before allowing modification
- ❌ **NEVER expose private fields in public endpoints**
- ❌ **NEVER mix customer/provider/admin data scoping casually**
- ✅ Keep public and private response models separate
- ✅ Return 403 Forbidden when user lacks permission
- ✅ Return 404 Not Found (not 403) when hiding existence of resources

**Example:**
```javascript
// ✅ GOOD - provider can only see own business bookings
if (req.user.role === 'SERVICE_PROVIDER') {
  const ownedBusinesses = await getOwnedBusinesses(req.user.id);
  where.businessId = { in: ownedBusinessIds };
}

// ❌ BAD - exposing all bookings without filtering
const bookings = await prisma.booking.findMany();
```

---

## 19. API Field Naming Consistency

**Keep naming consistent across backend and frontend:**

| Concept | Backend Field | Frontend Display | API Response |
|---------|---------------|------------------|--------------|
| Date | `date` (YYYY-MM-DD string) | Format with calendarUtils | Same |
| Time | `startTime`, `endTime` (HH:MM string) | Display as-is | Same |
| Price | `regularPrice`, `dealPrice` (Integer, cents or whole) | Format with ₪ symbol | Same |
| Duration | `durationMinutes` (Integer) | "X דקות" | Same |
| ID | `id` (Integer), `publicId` (UUID string) | Use `publicId` publicly | Both (where appropriate) |

**Rule:** Do NOT rename fields between backend and frontend without strong reason.

**Rule:** Do NOT change field types (e.g., string → integer) without PLAN.

---

# PART VI: DATABASE AND SEED PRINCIPLES

## 20. Schema Changes and Migrations

**Rules:**
- ❌ **Do NOT add schema changes without explicit approval**
- ❌ **Do NOT add migrations without explicit approval**
- ✅ Schema changes **REQUIRE PLAN mode first**
- ✅ If data model changes, update this document (Section 1-6)
- ✅ Coordinate with team before destructive changes
- ✅ Test migrations locally before proposing

**Why this matters:**
- Schema changes can break production
- Migrations may require downtime
- Data integrity is critical

---

## 21. Seed Data Principles

### Seeds Must Be Idempotent

**Rule:** Seed scripts **MUST** be safe to run multiple times without errors or duplication.

**Use `upsert` where possible:**
```javascript
await prisma.user.upsert({
  where: { phone: 'customer@lomea.com' },
  update: {},
  create: { ... }
});
```

### Demo Data Must Be Realistic

**Rules:**
- ✅ Use realistic Hebrew names, addresses, services
- ✅ Use dynamic dates (not hardcoded past dates)
- ✅ Create related data (business → services → slots → bookings)
- ❌ Do NOT use fake/test-looking data in demo

### Demo Credentials (Standard)

**Consistent demo passwords:**
- Customer: `customer@lomea.com` / `12345678`
- Provider: `provider@lomea.com` / `12345678`
- Admin: `admin@lomea.com` / `12345678`

**Rule:** Keep demo credentials consistent across seed scripts.

### Database Reset

**Rules:**
- ❌ **Do NOT reset DB without explicit approval**
- ❌ **Do NOT delete demo data without cleanup PLAN**
- ✅ Seeds can be rerun safely (idempotent)
- ✅ Report seed changes in commit messages

---

# PART VII: DEVELOPMENT WORKFLOW

## 22. PLAN vs BRAVE Decision Matrix

### Use PLAN Mode For:

- Architecture decisions
- Broad design changes (Section 11)
- Schema/migration changes
- API response shape changes
- Calendar logic changes
- Multi-page layout redesigns
- Role workflow redesigns
- Audits and analysis
- When scope is unclear
- When implementation might require broader changes

**In PLAN mode:**
- Do NOT write code
- Analyze, propose, document
- Create detailed implementation prompts

### Use BRAVE Mode For:

- Scoped implementation tasks
- Small consistency fixes
- Creating shared components (scoped)
- Fixing status badge duplication
- Terminology alignment
- Bug fixes (scoped)
- Feature implementation (scoped, clear requirements)

**In BRAVE mode:**
- Follow exact scope
- Stop if broader changes needed
- Report conflicts before expanding scope

**When in doubt, PLAN first.**

---

## 23. Git and Stash Workflow

### Stash Rules

**❌ NEVER:**
- Touch stash without explicit approval
- Apply, pop, drop, or modify stash
- Touch "calendar stash" (stash@{0} or stash with "calendar" in name)

**✅ ALWAYS:**
- Check `git stash list` before and after tasks
- Report stash state in final report
- Verify stash untouched

**Why this matters:**
- Stash may contain important work-in-progress
- Calendar stash contains critical calendar refactor work
- Accidental stash modification can lose work

### Git Status

**Before every task:**
```bash
git status
git branch --show-current
git stash list
```

**Verify:**
- Working tree is clean
- On correct branch (usually `develop`)
- Stash is untouched

**If working tree is NOT clean:**
- STOP and report
- Do NOT proceed with implementation

---

## 24. Push and Branch Rules

### Push Rules

**❌ Do NOT push unless explicitly approved.**

**✅ It is OK to:**
- Commit locally (if task says to commit)
- Report "ready to push" and wait for approval

**Why:**
- Team may want to review before push
- May need to coordinate with other changes
- May need to test locally first

### Branch Rules

**Standard:**
- Work on `develop` branch unless instructed otherwise
- Verify branch before starting work
- Do NOT create new branches without approval

**Check branch:**
```bash
git branch --show-current
```

---

## 25. Commit Rules

### Before Commit

**Run checks:**
```bash
git diff --check  # No trailing whitespace
npm run build     # Build succeeds (if code changed)
git status        # Verify files
```

**Verify:**
- Only intended files are staged
- No unintended changes
- No temporary/debug code

### Commit Message Format

**Use conventional commits:**
```
<type>(<scope>): <subject>

<body>
```

**Types:**
- `feat` — new feature
- `fix` — bug fix
- `docs` — documentation only
- `refactor` — code refactor
- `test` — tests
- `chore` — maintenance

**Examples:**
- `feat(ui): create shared BookingStatusBadge component`
- `fix(copy): align Hebrew terminology across booking flows`
- `docs: create Lomea Building Principles`

### Commit Content Rules

**❌ NEVER include:**
- Claude footer
- `Co-Authored-By: Claude <noreply@anthropic.com>`
- Debug code or temporary hacks
- Commented-out code blocks
- Unintended file changes

**✅ ALWAYS include:**
- Clear, descriptive commit message
- Why the change was made (if not obvious)
- Any breaking changes or migration notes

---

## 26. Package and Dependency Rules

**Rules:**
- ❌ **Do NOT add packages without explicit approval**
- ❌ **Do NOT upgrade major versions without PLAN**
- ✅ Security patches are OK (but report after)
- ✅ Minor/patch upgrades usually OK (but report)

**Before adding a package:**
1. Check if existing package can be used
2. Check if feature can be built without new dependency
3. If needed, request approval with justification

**Why this matters:**
- Package bloat slows builds
- New dependencies increase security surface
- Major upgrades can break existing code

---

## 27. Testing and Verification

### Build Testing

**For code changes:**
```bash
cd client && npm run build
cd server && npm run test  # if tests exist
```

**For documentation changes:**
- No build required
- Verify markdown renders correctly

### Browser Verification

**Be honest about browser testing:**
- ✅ "Browser verified: tested customer calendar page, status badges display correctly"
- ✅ "Browser verification not performed" (acceptable if out of scope)
- ❌ "UI is fixed" (without actual browser test)

**Remember:**
- Passing build ≠ browser verification
- File edited ≠ UI fixed
- Tests passing ≠ feature works

**If you claim browser verification, you MUST have tested in actual browser.**

---

# PART VIII: PRE-IMPLEMENTATION CHECKLIST

## 28. Before Every BRAVE Task

**☑️ Documentation:**
- [ ] Read `docs/LOMEA_BUILDING_PRINCIPLES.md` (this document)
- [ ] Read any task-specific documentation linked in prompt

**☑️ Git Status:**
- [ ] Run `git status` — working tree must be clean
- [ ] Run `git branch --show-current` — verify correct branch
- [ ] Run `git stash list` — note current stash state

**☑️ Existing Code:**
- [ ] Check `client/src/shared/ui/` for existing components
- [ ] Check `client/src/shared/calendar/utils/statusColors.js` for status metadata
- [ ] Check for similar patterns in existing codebase

**☑️ Scope Verification:**
- [ ] Identify whether differences are role-specific or unnecessary inconsistency
- [ ] Confirm scope boundaries (PLAN vs BRAVE)
- [ ] Verify no schema/migration/package changes unless approved

**☑️ Conflict Check:**
- [ ] If task conflicts with these principles → STOP and report before coding

---

## 29. After Every BRAVE Task

**☑️ Code Quality:**
- [ ] Run `git diff --check` (no trailing whitespace)
- [ ] Run `npm run build` for client (if code changed)
- [ ] No debug code, commented blocks, or temporary hacks

**☑️ Git Status:**
- [ ] Run `git status` — working tree clean (if committed)
- [ ] Run `git stash list` — stash unchanged

**☑️ Commit Quality:**
- [ ] Conventional commit message format
- [ ] No Claude footer
- [ ] No `Co-Authored-By: Claude`
- [ ] Clear description of what and why

**☑️ Verification:**
- [ ] Browser testing performed (or honestly report not performed)
- [ ] Do NOT claim UI fixed without browser proof

**☑️ Push:**
- [ ] Do NOT push (unless explicitly approved)
- [ ] Report "ready to push" if applicable

---

# PART IX: FUTURE IMPLEMENTATION PROMPTS

## 30. Mandatory Prompt Prefix

**Every future implementation prompt should include:**

```
Before implementing, read docs/LOMEA_BUILDING_PRINCIPLES.md
and follow it. If this task conflicts with the principles,
stop and report before changing code.
```

**This ensures:**
- Future AI agents read this document
- Conflicts are caught early
- Consistency is maintained

**Prompts that violate these principles may be rejected.**

---

# APPENDIX A: QUICK REFERENCE

## Current Key Shared Components (as of 2026-07-12)

**Booking Statuses:**
- **Canonical source:** `client/src/shared/calendar/utils/statusColors.js`
- **Component:** `client/src/shared/ui/BookingStatusBadge.jsx`
- **Rule:** NEVER create inline status mappings

**Shared UI:**
- `Button.jsx`, `Card.jsx`, `Badge.jsx`
- `EmptyState.jsx`, `Toast.jsx`
- `Input.jsx`, `Select.jsx`, `Drawer.jsx`

**Shared Calendar:**
- `CalendarMonthGrid.jsx`, `CalendarDateCell.jsx`
- `CalendarEventCard.jsx`, `CalendarMonthHeader.jsx`
- `calendarUtils.js`

## Recent Consistency Work (Reference)

**Commits:**
- `0a2e870` feat(ui): create shared BookingStatusBadge component
- `7ab41ba` fix(copy): align Hebrew terminology across booking flows

**What was fixed:**
- Unified booking status labels across customer/provider/admin
- Fixed "ע"י" → "על ידי" abbreviations
- Aligned "תור" vs "הזמנה" vs "זמינות" terminology
- Replaced "לוח שנה" with "יומן" in customer calendar
- Standardized "ממתינות לאישור" (not "ממתינות")

**These commits serve as examples of proper consistency fixes.**

---

# APPENDIX B: DOCUMENT HISTORY

| Date | Change | Author/Source |
|------|--------|---------------|
| 2026-07-06 | Created `LOMEA_ARCHITECTURE_RULES_DRAFT.md` | Team |
| 2026-07-12 | Promoted to `LOMEA_BUILDING_PRINCIPLES.md` (mandatory) | Consistency audit |
| 2026-07-12 | Added UI/UX principles, Hebrew terminology, workflow rules | Consistency audit |
| 2026-07-12 | Merged availability model and calendar principles | From AVAILABILITY_MODEL.md, CALENDAR_ARCHITECTURE.md |
| 2026-07-12 | Merged AI agent workflow rules | From AI_AGENT_WORKFLOW.md |

## Source Documents

This document was created by merging and enhancing:
- `docs/LOMEA_ARCHITECTURE_RULES_DRAFT.md` (primary source)
- `docs/AI_AGENT_WORKFLOW.md` (workflow rules)
- `AVAILABILITY_MODEL.md` (availability principles)
- `CALENDAR_ARCHITECTURE.md` (calendar vision)
- `README.md` (project overview)
- Recent consistency commits (terminology and component standards)

---

**END OF DOCUMENT**

**This is the master source of truth for Lomea development.**

**Read before every PLAN or BRAVE task.**
