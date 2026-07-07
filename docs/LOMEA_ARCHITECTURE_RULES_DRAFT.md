# Lomea Architecture Rules (DRAFT)

**Status:** 🚧 DRAFT - Not Yet Mandatory
**Created:** 2026-07-06
**Review Required:** YES (by product owner and tech lead)

---

## Purpose

This document defines the architectural rules and conventions for Lomea development going forward.

⚠️ **This is a DRAFT.** Do not treat as final until reviewed and approved.

Once approved, this will become the mandatory rulebook for:
- All new feature development
- All bug fixes
- All refactoring work
- AI agent development tasks

---

## Part 1: Active Data Model

### 1.1 User and Roles

#### User Model
- Represents any authenticated person in the system
- Fields: `id`, `fullName`, `phone` (unique), `email`, `passwordHash`, `role`, `status`
- One user can own multiple businesses
- One user has exactly one role

#### Active Roles

| Role | Purpose | Home View | Workspace Component |
|------|---------|-----------|---------------------|
| `ADMIN` | System administrators | `admin` | AdminPage (in AppLayout) |
| `SERVICE_PROVIDER` | Service providers/businesses | `service-provider` | ServiceProviderWorkspace |
| `CUSTOMER` | Service recipients | `customer` | CustomerPage |

#### DEPRECATED Roles

| Role | Status | Replacement | Action Required |
|------|--------|-------------|-----------------|
| `BUSINESS` | ⚠️ LEGACY | `SERVICE_PROVIDER` | Migrate in Sprint D |
| `SERVICE_RECIPIENT` | ❌ NOT USED | `CUSTOMER` | Remove from schema or use in future |

**Rule:** All new service provider users MUST be created with `SERVICE_PROVIDER` role.

**Rule:** Frontend routing MUST check for `SERVICE_PROVIDER`, not `BUSINESS`.

**Rule:** Backend auth middleware MAY accept both `BUSINESS` and `SERVICE_PROVIDER` during migration period, but prefer `SERVICE_PROVIDER`.

---

### 1.2 Business / Service Provider

#### Business Model
- Represents a service provider's business profile
- Fields:
  - Identity: `id`, `publicId`, `name`, `description`, `phone`, `identifierType`, `identifierValue`
  - Address: `cityCode`, `cityNameHebrew`, `streetCode`, `streetNameHebrew`, `houseNumber`, `formattedAddress`
  - Location: `latitude`, `longitude`, `hasExactCoordinates`
  - Media: `logoUrl`, `coverImageUrl`, `galleryImages`
  - Settings: `language`, `timezone`, `defaultAppointmentBufferMins`, `defaultBookingBehavior`
  - Status: `status` (BusinessStatus enum)
- One business belongs to one user (owner)
- One business may have multiple professions (Phase 1 catalog)

#### Business Status
- `PENDING_APPROVAL` - awaiting admin approval (default for new businesses)
- `ACTIVE` - approved and operational
- `SUSPENDED` - temporarily disabled by admin

**Rule:** New businesses MUST start in `PENDING_APPROVAL` status.

**Rule:** Only ADMIN can change business status to `ACTIVE` or `SUSPENDED`.

---

### 1.3 Services

#### Field → Profession → ServiceTemplate Hierarchy (Phase 1 Catalog)

**Field:**
- Top-level service category (e.g., "Health", "Beauty", "Education")
- Admin-managed

**Profession:**
- Specific profession within a field (e.g., "Hairdresser" in "Beauty")
- Admin-managed
- Belongs to one field

**ServiceTemplate:**
- Specific service template (e.g., "Haircut" under "Hairdresser")
- Admin-managed
- Belongs to one profession
- Has default duration, price, color level (risk indicator)

**Rule:** Service catalog (Field/Profession/ServiceTemplate) is managed by ADMIN only.

**Rule:** Service providers choose from catalog during registration.

---

#### BusinessService Model
- Service offered by a specific business (instance of ServiceTemplate)
- Fields:
  - `businessId` (FK to Business)
  - `serviceTemplateId` (FK to ServiceTemplate)
  - `name`, `description`, `durationMinutes`, `regularPrice`
  - `active` (Boolean)
  - `approvalStatus` (PENDING/APPROVED/REJECTED)
  - `visibleToCustomers` (Boolean)
- One business can offer multiple services

**Rule:** New services MUST be linked to a ServiceTemplate from catalog.

**Rule:** Service providers MAY customize name, description, duration, and price.

**Rule:** Services with `visibleToCustomers = false` MUST NOT appear in customer search.

---

### 1.4 Slots (Epic 2 Model)

#### Slot Model
- Time slot published by service provider for customer booking
- Fields:
  - `businessId` (FK to Business)
  - `date` (String, YYYY-MM-DD)
  - `startTime`, `endTime` (String, HH:MM)
  - `status` (SlotStatus enum)
  - `allowedServices[]` (junction to BusinessService via SlotAllowedService)

**Rule:** Slots use **opt-in availability model** (not calculated from calendar).

**Rule:** Only explicitly published slots (`status = OPEN`) are visible to customers.

**Rule:** One slot MAY support multiple services (multi-service slot via `allowedServices` junction).

**Rule:** One slot MAY have multiple bookings (as long as times don't overlap and fit within slot duration).

#### Slot Status (Epic 2)

| Status | Meaning | Customer Visible |
|--------|---------|------------------|
| `OPEN` | At least one legal booking time remains | ✅ YES |
| `FULL` | No legal booking time remains | ❌ NO |
| `CANCELLED` | Provider cancelled the slot | ❌ NO |
| `EXPIRED` | Slot date/time has passed | ❌ NO |

**DEPRECATED Statuses:**
- `RESERVED` (old single-booking model)
- `BOOKED` (old single-booking model)

**Rule:** Frontend slot discovery MUST filter by `status = 'OPEN'` for customers.

**Rule:** Slot status MUST be recalculated after each booking creation/cancellation.

---

### 1.5 Bookings (Epic 2 Model)

#### Booking Model
- Customer booking within a slot
- Fields:
  - `slotId` (FK to Slot, NOT unique - multiple bookings per slot)
  - `businessServiceId` (FK to BusinessService)
  - `customerId` (FK to User, nullable for guest booking)
  - `startTime`, `endTime` (exact time within slot, String HH:MM)
  - `customerName`, `customerPhone`, `customerNote`, `price`
  - `status` (BookingStatus enum)

**Rule:** One slot MAY have multiple bookings.

**Rule:** Booking times MUST NOT overlap within same slot.

**Rule:** Booking `startTime` and `endTime` MUST be calculated using `/slots/:id/available-times` API.

**Rule:** Booking creation MUST use atomic transaction with row locking (see `booking.routes.js`).

#### Booking Status (Epic 2)

| Status | Meaning | Next Actions |
|--------|---------|--------------|
| `PENDING` | Awaiting provider confirmation | Provider can confirm/reject |
| `CONFIRMED` | Provider confirmed | Can complete or cancel |
| `REJECTED` | Provider rejected | Terminal state |
| `COMPLETED` | Service delivered | Terminal state |
| `CANCELLED_BY_CUSTOMER` | Customer cancelled | Terminal state |
| `CANCELLED_BY_BUSINESS` | Provider cancelled | Terminal state |
| `NO_SHOW` | Customer didn't show | Terminal state |

**DEPRECATED Statuses:**
- `APPROVED` (use `CONFIRMED`)
- `CANCELLED` (ambiguous, use specific cancellation status)

**Rule:** Status transitions MUST follow allowed state machine (see booking.routes.js comments).

**Rule:** Cancellation MUST specify who cancelled (customer vs provider).

---

### 1.6 ServiceProviderApproval (Phase 1)

#### ServiceProviderApproval Model
- Admin approval workflow for new service provider registrations
- Fields:
  - `serviceProviderId` (FK to Business.id)
  - `status` (RegistrationStatus: DRAFT/PENDING_APPROVAL/APPROVED/REJECTED)
  - `adminNote` (visible to provider)
  - `reviewedById`, `reviewedAt`

**Rule:** New registrations MUST create ServiceProviderApproval record with `status = DRAFT`.

**Rule:** After registration submission, status changes to `PENDING_APPROVAL`.

**Rule:** Only ADMIN can approve/reject.

**Rule:** Approval status MUST be visible in ServiceProviderWorkspace header.

---

## Part 2: Active Frontend Structure

### 2.1 Role-Based Routing

**File:** `client/src/main.jsx`

#### Logged-Out Users
- Default view: `landing` (LandingPage)
- Can access: `customer` (browse/search), `auth` (login), registration flow

#### Logged-In Users

| Role | Home View | Component | Layout |
|------|-----------|-----------|--------|
| `ADMIN` | `admin` | AdminPage | AppLayout |
| `SERVICE_PROVIDER` | `service-provider` | ServiceProviderWorkspace | Own layout |
| `BUSINESS` (legacy) | `business` | BusinessPage | AppLayout |
| `CUSTOMER` | `customer` | CustomerPage | AppLayout |

**Rule:** Use `getHomeView(user)` from `useNavigation.js` to determine home view.

**Rule:** Use `getNavItems(user)` from `useNavigation.js` to generate navigation items.

**Rule:** Do NOT hardcode role-based routing logic in multiple places.

---

### 2.2 Active Provider Workspace

**Component:** `ServiceProviderWorkspace`
**File:** `client/src/features/service-provider/ServiceProviderWorkspace.jsx`
**Role:** `SERVICE_PROVIDER`

**Pages:**

| Page ID | Label | Component | Status | Purpose |
|---------|-------|-----------|--------|---------|
| `dashboard` | לוח בקרה | DashboardPage | ✅ Active | Overview, KPIs |
| `business` | פרטי העסק | BusinessProfilePage | ✅ Active | Edit business profile |
| `services` | שירותים | ServicesPage | ✅ Active | Manage services |
| `service-groups` | קבוצות שירותים | ServiceGroupsPage | ✅ Active | Manage service groups |
| `calendar` | תורים | CalendarPage | ✅ Active | Slot management (Epic 2) |
| `bookings` | הזמנות | BookingsPage | ✅ Active | Booking management (Epic 2) |
| `customers` | לקוחות | ComingSoonPage | 🚧 Planned | Customer list |
| `reports` | דוחות | ComingSoonPage | 🚧 Planned | Reports/analytics |
| `settings` | הגדרות | SettingsPage | ✅ Active | User settings |

**Rule:** All SERVICE_PROVIDER features MUST be built in ServiceProviderWorkspace, NOT in BusinessPage.

**Rule:** ServiceProviderWorkspace has its own layout and internal routing (NOT using main.jsx routing).

**Rule:** Approval status badge MUST be visible in workspace header.

---

### 2.3 Legacy Provider Workspace (To Deprecate)

**Component:** `BusinessPage`
**File:** `client/src/features/business/BusinessPage.jsx`
**Role:** `BUSINESS` (legacy)
**Status:** ⚠️ LEGACY - Supported during migration, will deprecate

**Rule:** Do NOT build new features in BusinessPage.

**Rule:** Do NOT route new SERVICE_PROVIDER users to BusinessPage.

**Rule:** After BUSINESS → SERVICE_PROVIDER migration, deprecate BusinessPage.

---

### 2.4 Admin Workspace

**Component:** `AdminPage`
**File:** `client/src/pages/AdminPage.jsx`
**Role:** `ADMIN` only
**Layout:** `AppLayout`

**Sections:**
- Dashboard (KPIs, stats)
- Users (UsersPage)
- Categories (inline)
- Business approvals (inline)
- CRM (CRMPage, separate view)

**Rule:** Only ADMIN role can access admin workspace.

**Rule:** Admin can view/manage all businesses, users, categories.

**Rule:** Admin MUST approve new service provider registrations.

---

### 2.5 Customer Flow

**Component:** `CustomerPage`
**File:** `client/src/features/customer/CustomerPage.jsx`
**Role:** Any (logged in or not)
**Layout:** `PublicLayout` (logged out) or `AppLayout` (logged in)

**Flow:**
1. Location selection (optional)
2. Search filters (category, city, date)
3. Search results (slot cards)
4. Booking dialog (select service, select time, enter details, submit)

**Rule:** Customers MUST only see slots with `status = 'OPEN'`.

**Rule:** Booking MUST call `/slots/:id/available-times` to get legal start times.

**Rule:** Booking submission MUST use POST `/bookings` with atomic transaction.

---

## Part 3: API Usage Rules

### 3.1 Centralized API Helper

**File:** `client/src/api.js`

**Functions:**
- `getToken()` - Get JWT token from localStorage
- `setSession(token, user)` - Store token and user
- `getUser()` - Get user object from localStorage
- `clearSession()` - Clear token and user
- `api(path, options)` - Make authenticated API call

**Rule:** ALWAYS use `api(path, options)` for API calls, NOT raw `fetch()`.

**Rule:** ALWAYS use `getToken()` to retrieve token, NOT `localStorage.getItem('token')`.

**Rule:** Token storage key is `onovi_token` (not `token`).

**Rule:** User storage key is `onovi_user` (not `user`).

---

### 3.2 API Endpoint Conventions

#### Backend Route Mounting

**Routes WITHOUT `/api` prefix:**
- `/auth/*`
- `/users/*`
- `/categories/*`
- `/businesses/*`
- `/services/*`
- `/slots/*`
- `/bookings/*`
- `/admin/*`

**Routes WITH `/api` prefix:**
- `/api/admin/users/*`
- `/api/admin/fields/*`
- `/api/admin/professions/*`
- `/api/admin/service-templates/*`
- `/api/service-provider/*`
- `/api/addresses/*`
- `/api/calendar/*`
- `/api/register/*`
- `/api/registration/*`

**Rule:** Frontend MUST use exact path as mounted in backend.

**Rule:** Do NOT blindly add or remove `/api` prefix without checking backend route registration.

**Rule:** Always check `server/src/app.js` for correct route prefix.

---

### 3.3 Common API Endpoint Errors

❌ **WRONG:**
```javascript
await api('/api/bookings');        // Backend route is /bookings
await api('/service-provider/business');  // Backend route is /api/service-provider/business
```

✅ **CORRECT:**
```javascript
await api('/bookings');            // Matches backend: app.use('/bookings', ...)
await api('/api/service-provider/business');  // Matches backend: app.use('/api/service-provider', ...)
```

**Rule:** When you see `Unexpected token '<', "<!doctype "... is not valid JSON`, it means:
1. Frontend called wrong endpoint (404)
2. Vite dev server returned HTML 404 page
3. Frontend tried to parse HTML as JSON

**Fix:** Check backend route registration and fix frontend call.

---

## Part 4: UI Verification Rules

### 4.1 The Five States of UI Code

Understand the difference:

1. **Code exists** - File is on disk → Does NOT mean it's compiled/served/executed
2. **Component is imported** - Import statement exists → Does NOT mean component is rendered
3. **Component is routed** - Route exists in config → Does NOT mean route is active
4. **Component is rendered** - React.createElement was called → Does NOT mean it's visible
5. **User can see and use it** ✅ - Component is visible and interactive → **ONLY state that matters**

**Rule:** A UI change is NOT complete until visible and functional in the browser.

**Rule:** Do NOT claim "verified" without actual browser verification.

---

### 4.2 Proof of Execution Requirement

Before claiming a UI fix is complete:

1. ✅ Dev server reloaded after file save
2. ✅ Hard refresh browser (Cmd+Shift+R / Ctrl+Shift+R)
3. ✅ Changed UI is visible in browser
4. ✅ User can interact with it (buttons work, state updates, API calls succeed)
5. ✅ No console errors
6. ✅ Network tab shows correct API calls (correct URL, 200 status, JSON response)

**Rule:** If unsure whether code is active, add a temporary debug banner:
```jsx
<div style={{
  position: 'fixed', top: 0, left: 0, background: 'red', color: 'white',
  padding: '10px', zIndex: 9999
}}>
  DEBUG: Updated at {new Date().toISOString()}
</div>
```

**Rule:** Build success ≠ feature works. Only browser verification proves it works.

---

### 4.3 Before Commit Checklist

```
□ Frontend build passes (cd client && npm run build)
□ Backend syntax check passes (cd server && node --check src/routes/*.js)
□ Relevant tests pass
□ Browser smoke test completed:
  □ Open browser at http://localhost:5173
  □ Hard refresh (Cmd+Shift+R)
  □ Test changed UI flow
  □ Check console for errors
  □ Check network tab for API calls
□ No `Unexpected token '<'` errors
□ No "טוען..." stuck loading states
□ All user interactions work (buttons, forms, state updates)
```

**Rule:** Do NOT commit until all checks pass.

---

### 4.4 Before Push Requirements

**Rule:** Do NOT push until:
- ✅ User confirms browser UI works
- ✅ User approves push

**Rule:** Even if build passes and tests pass, WAIT for user browser verification.

---

## Part 5: Commit and Push Rules

### 5.1 Commit Message Format

**Good commit messages:**
- `feat: implement epic 2 booking engine`
- `fix: correct booking status update API endpoint`
- `refactor: consolidate slot management to ServiceProviderWorkspace`
- `docs: add codebase audit report`

**Bad commit messages:**
- `update`
- `fix bug`
- `changes`

**Rule:** Use conventional commit format: `type: description`

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `refactor` - Code restructure without behavior change
- `docs` - Documentation
- `test` - Test changes
- `chore` - Build/tooling changes

---

### 5.2 Sprint Planning Rules

**Rule:** Do NOT start Sprint D until:
- ✅ Sprint C is fully complete
- ✅ All Sprint C code is pushed
- ✅ User approves moving to next sprint

**Rule:** Do NOT mix feature work from different sprints in one commit.

**Rule:** Do NOT push half-finished features.

---

### 5.3 Firefighting vs Systematic Work

**Firefighting (AVOID):**
- Fix individual UI bug → Push → Find another bug → Fix → Push → Repeat
- No overall plan
- Reactive, not proactive

**Systematic Work (PREFERRED):**
- Stop and audit entire system
- Identify all problems
- Prioritize by severity
- Fix blockers first
- Test thoroughly
- Push once with confidence

**Rule:** If you find yourself in a firefighting cycle, STOP and do a full audit.

---

## Part 6: Active Workspace Rule

### 6.1 ServiceProviderWorkspace is Active

**Rule:** For SERVICE_PROVIDER role, the active workspace is `ServiceProviderWorkspace`.

**Rule:** Do NOT implement provider features only in legacy `BusinessPage` unless that route is confirmed active.

---

### 6.2 Before Editing UI

1. ✅ Identify which user role is logged in
2. ✅ Identify which route/view is active
3. ✅ Identify which layout is rendered
4. ✅ Identify which component file is actually rendered
5. ✅ Check for duplicate/legacy components with similar names

**Example:**
```
User role: SERVICE_PROVIDER
Active view: service-provider
Layout: ServiceProviderWorkspace (own layout, NOT AppLayout)
Active page: calendar
Component: client/src/features/service-provider/pages/CalendarPage.jsx

Therefore, edit CalendarPage.jsx, NOT SlotsTab.jsx (legacy)
```

**Rule:** Verify which component is active before editing.

**Rule:** Do NOT edit BusinessPage when user is SERVICE_PROVIDER.

---

## Part 7: Epic 2 Booking Engine Rules

### 7.1 Slot Availability Model

**Rule:** Lomea uses **opt-in availability** model, NOT calculated availability.

**What this means:**
- ✅ Customers see only explicitly published slots (`status = OPEN`)
- ❌ Do NOT calculate availability from working hours
- ❌ Do NOT show external calendar appointments as available slots
- ❌ Do NOT auto-generate slots

**Rule:** Service providers MUST explicitly publish each slot.

---

### 7.2 Multi-Service Slots

**Rule:** One slot MAY support multiple services.

**Rule:** Slot → allowed services is managed via `SlotAllowedService` junction table.

**Rule:** Frontend slot form MUST allow selecting multiple services.

**Rule:** Slot MUST have at least one allowed service.

---

### 7.3 Multiple Bookings Per Slot

**Rule:** One slot MAY have multiple bookings (Epic 2 model).

**Rule:** Bookings MUST NOT overlap in time.

**Rule:** Booking times MUST fit within slot duration.

**Rule:** Use `/slots/:id/available-times?serviceId=X` to get legal start times for a service.

---

### 7.4 Booking Creation Atomicity

**Rule:** Booking creation MUST use atomic transaction with row locking.

**Rule:** Backend MUST:
1. Lock slot row (`SELECT ... FOR UPDATE`)
2. Validate times are still available
3. Create booking
4. Recalculate slot status
5. Commit or rollback

**Rule:** Frontend MUST handle concurrency errors (409 Conflict) gracefully.

---

## Part 8: Phase 1 Registration Flow Rules

### 8.1 Service Catalog

**Rule:** Service catalog (Field → Profession → ServiceTemplate) is admin-managed.

**Rule:** Service providers choose from catalog during registration (cannot create custom services without template).

---

### 8.2 Registration Steps

1. Choose role (service provider or service recipient)
2. Select field (e.g., "Beauty")
3. Select profession (e.g., "Hairdresser")
4. Select services (e.g., "Haircut", "Coloring")
5. Review service groups (can add more profession+services)
6. Enter business details (name, address, identifier, etc.)
7. Upload documents (licenses, certifications)
8. Accept legal consent
9. Submit registration

**Rule:** Registration MUST create:
- User account (role = SERVICE_PROVIDER)
- Business record (status = PENDING_APPROVAL)
- ServiceProviderApproval record (status = PENDING_APPROVAL)
- BusinessService records (one per selected service)
- BusinessProfession records (one per selected profession)

---

### 8.3 Post-Registration

**Rule:** After registration, user is logged in but business is PENDING_APPROVAL.

**Rule:** ServiceProviderWorkspace MUST show approval status in header.

**Rule:** Service provider CANNOT publish slots until approved.

---

## Part 9: Known Anti-Patterns (AVOID)

### 9.1 Building Features Only in Legacy Components

❌ **WRONG:**
```
User reported slot management is broken.
I will fix SlotsTab.jsx (in BusinessPage).
```

✅ **CORRECT:**
```
User reported slot management is broken.
User role is SERVICE_PROVIDER.
Active workspace is ServiceProviderWorkspace.
Active component is CalendarPage.jsx.
I will fix CalendarPage.jsx.
```

---

### 9.2 Using Raw localStorage for Auth

❌ **WRONG:**
```javascript
const token = localStorage.getItem('token');  // Wrong key
```

✅ **CORRECT:**
```javascript
import { getToken } from '../api';
const token = getToken();  // Uses correct key: onovi_token
```

---

### 9.3 Hardcoding API Prefixes

❌ **WRONG:**
```javascript
await fetch('/api/bookings');  // Blindly adding /api
```

✅ **CORRECT:**
```javascript
// Check backend route registration first:
// app.use('/bookings', bookingRoutes) → Use /bookings
// app.use('/api/service-provider', ...) → Use /api/service-provider

await api('/bookings');  // Matches backend mounting
```

---

### 9.4 Claiming UI is Fixed Without Browser Verification

❌ **WRONG:**
```
I edited the component. Build passes. UI is fixed.
```

✅ **CORRECT:**
```
I edited the component. Build passes.
I cannot verify in browser.
Please:
- Hard refresh browser
- Test the flow
- Check console for errors
- Confirm it works
Then I will commit and push.
```

---

## Part 10: Future Deprecations and Migrations

### 10.1 Planned Deprecations

| Item | Status | Replacement | Target Sprint |
|------|--------|-------------|---------------|
| BUSINESS role | ⚠️ Legacy | SERVICE_PROVIDER | Sprint D |
| BusinessPage | ⚠️ Legacy | ServiceProviderWorkspace | Sprint D |
| SlotsTab | ⚠️ Legacy | CalendarPage | Sprint D |
| BookingsTab | ⚠️ Legacy | BookingsPage | Sprint D |
| Legacy calendar | ⚠️ Legacy | - | Sprint E |
| `onovi_*` storage keys | 🤷 Low priority | `lomea_*` | Sprint E+ |

---

### 10.2 Migration Checklist (Sprint D)

#### Migrate BUSINESS → SERVICE_PROVIDER

1. ✅ Create data migration script:
   ```sql
   UPDATE "User" SET role = 'SERVICE_PROVIDER' WHERE role = 'BUSINESS';
   ```
2. ✅ Update all auth checks to only check SERVICE_PROVIDER
3. ✅ Update frontend routing to only route SERVICE_PROVIDER to ServiceProviderWorkspace
4. ✅ Update admin UI to treat SERVICE_PROVIDER as "business owner" role
5. ✅ Remove BUSINESS from UserRole enum (breaking change)
6. ✅ Remove BusinessPage component
7. ✅ Test thoroughly in browser

---

## Appendix: Quick Reference

### Active Components by Role

| Role | Workspace Component | Layout | File |
|------|---------------------|--------|------|
| ADMIN | AdminPage | AppLayout | `client/src/pages/AdminPage.jsx` |
| SERVICE_PROVIDER | ServiceProviderWorkspace | Own | `client/src/features/service-provider/ServiceProviderWorkspace.jsx` |
| CUSTOMER | CustomerPage | AppLayout or PublicLayout | `client/src/features/customer/CustomerPage.jsx` |

---

### API Endpoint Quick Reference

| Resource | Prefix | Example | File |
|----------|--------|---------|------|
| Auth | None | `/auth/login` | `server/src/routes/auth.routes.js` |
| Businesses | None | `/businesses` | `server/src/routes/business.routes.js` |
| Services | None | `/services` | `server/src/routes/service.routes.js` |
| Slots | None | `/slots` | `server/src/routes/slot.routes.js` |
| Bookings | None | `/bookings` | `server/src/routes/booking.routes.js` |
| Admin | None | `/admin/dashboard` | `server/src/routes/admin.routes.js` |
| Service Provider | `/api` | `/api/service-provider/business` | `server/src/routes/service-provider-*.routes.js` |
| Admin Catalog | `/api` | `/api/admin/fields` | `server/src/routes/admin-*.routes.js` |
| Registration | `/api` | `/api/register` | `server/src/routes/registration.routes.js` |

---

### Booking Status State Machine

```
PENDING → CONFIRMED → COMPLETED
        → REJECTED
        → CANCELLED_BY_CUSTOMER
        → CANCELLED_BY_BUSINESS
        → NO_SHOW
```

---

### Slot Status State Machine

```
OPEN → FULL (all times booked)
     → CANCELLED (provider cancelled)
     → EXPIRED (time passed)
```

---

**End of Draft Architecture Rules**

## Review Checklist

Before marking this document as mandatory:

- [ ] Product owner review: Business rules correct?
- [ ] Tech lead review: Architecture sound?
- [ ] Team discussion: Any objections or suggestions?
- [ ] Update status to MANDATORY
- [ ] Communicate to all developers
- [ ] Add to onboarding documentation

---

**Status:** 🚧 DRAFT - Awaiting Review
