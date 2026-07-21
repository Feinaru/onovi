# Lomea Codebase Audit Report

**Generated:** 2026-07-06
**Branch:** develop
**HEAD:** 9e81538 feat: implement epic 2 booking engine

---

## Executive Summary

This audit reveals a codebase in transition between multiple naming conventions, role systems, and architectural patterns. Critical findings:

1. **Role system is duplicated**: `BUSINESS` (legacy) and `SERVICE_PROVIDER` (active) both exist
2. **Two parallel business management UIs**: `BusinessPage` (legacy) and `ServiceProviderWorkspace` (active)
3. **API prefix inconsistency**: Some routes use `/api/`, others don't
4. **Mixed terminology**: PickMe, Onovi, Lomea all present in code
5. **Active Epic 2 booking engine** implemented but with UI/backend mismatches

**Status:** System functional but contains significant technical debt and confusion points.

---

## Part 1: Backend Audit

### 1.1 Prisma Data Model

#### User Model (ACTIVE)
**File:** `server/prisma/schema.prisma:137-167`

**Purpose:** Central authentication and user management

**Key Fields:**
- `id` (Int, PK)
- `fullName`, `phone` (unique), `email` (nullable, unique)
- `passwordHash`
- `role` (UserRole enum)
- `status` (UserStatus enum, default: ACTIVE)
- `lastLoginAt`, `createdAt`, `updatedAt`

**Relations:**
- `businesses` → Business[] (as owner)
- `bookings` → Booking[]
- `approvalReviews` → ServiceProviderApproval[] (as admin reviewer)
- Multiple admin/note/tag relations

**Status:** ✅ ACTIVE

**Known Issues:**
- None critical

---

#### UserRole Enum (MIXED - LEGACY + ACTIVE)

> **Terminology note:** this section describes historical/current-code `CUSTOMER` /
> `SERVICE_RECIPIENT` naming as-built. The canonical target terminology is defined in
> `docs/LOMEA_ROLE_TERMINOLOGY.md`: `CUSTOMER` maps to `SERVICE_BOOKER`, while
> `SERVICE_RECIPIENT` is the booking recipient identity, not the replacement for `CUSTOMER`.

**File:** `server/prisma/schema.prisma:12-18`

```prisma
enum UserRole {
  CUSTOMER              // Legacy - will migrate to SERVICE_RECIPIENT
  BUSINESS              // Legacy - will migrate to SERVICE_PROVIDER
  SERVICE_RECIPIENT     // New - not yet used
  SERVICE_PROVIDER      // New - active
  ADMIN                 // Active
}
```

**Status:** ⚠️ MIXED

**Problems:**
- `BUSINESS` and `SERVICE_PROVIDER` both exist and are both used
- `CUSTOMER` is active; `SERVICE_RECIPIENT` not yet used
- Comments say "will migrate" but no migration has occurred
- Frontend routing checks for both `BUSINESS` and `SERVICE_PROVIDER`
- Admin dashboard may count providers incorrectly

**Active Roles:**
- ✅ `ADMIN` - fully active
- ✅ `SERVICE_PROVIDER` - active, preferred for new service providers
- ⚠️ `BUSINESS` - legacy, still supported for backward compatibility
- ✅ `CUSTOMER` - active
- ❌ `SERVICE_RECIPIENT` - defined but not used

---

#### Business Model (ACTIVE)
**File:** `server/prisma/schema.prisma:182-249`

**Purpose:** Represents a service provider's business profile

**Key Fields:**
- `id` (Int, PK)
- `publicId` (String, unique, UUID)
- `ownerId` (Int, FK → User)
- `categoryId` (Int, nullable, FK → Category)
- `name`, `description`, `phone`, `phoneNormalized`
- `identifierType` (IdentifierType enum - MANDATORY)
- `identifierValue` (String - MANDATORY, unique per type)
- Address fields:
  - Code-based (preferred): `cityCode`, `cityNameHebrew`, `streetCode`, `streetNameHebrew`, `houseNumber`
  - Legacy (kept for backward compat): `city`, `street`, `address`
- Location: `latitude`, `longitude`, `hasExactCoordinates`, `isEstimatedLocation`, `locationVerifiedByBusiness`
- Media (Epic 1): `logoUrl`, `coverImageUrl`, `galleryImages` (JSON)
- Settings: `language`, `timezone`, `defaultAppointmentBufferMins`, `defaultBookingBehavior`
- `status` (BusinessStatus enum, default: PENDING_APPROVAL)
- `sourceLeadId` (nullable, unique, FK → Lead)

**Relations:**
- `owner` → User (business owner)
- `category` → Category
- `services` → BusinessService[]
- `slots` → Slot[]
- `bookings` → Booking[]
- `professions` → BusinessProfession[] (Phase 1 junction)
- `approvals` → ServiceProviderApproval[]

**Status:** ✅ ACTIVE

**Known Issues:**
- Dual address system (code-based vs legacy) creates confusion
- `categoryId` made nullable for migration but still widely assumed required

---

#### BusinessService Model (ACTIVE)
**File:** `server/prisma/schema.prisma:251-286`

**Purpose:** Services offered by a business (ties to ServiceTemplate from catalog)

**Key Fields:**
- `id` (Int, PK)
- `publicId` (String, unique, UUID)
- `businessId` (Int, FK → Business)
- `name`, `description`, `durationMinutes`, `regularPrice`
- `active` (Boolean, default: true)
- `serviceTemplateId` (Int, nullable, FK → ServiceTemplate)
- `customName` (String, nullable)
- `approvalStatus` (ApprovalStatus, default: PENDING)
- `approvedAt`, `approvedById`
- `visibleToCustomers` (Boolean, default: true)
- `calendarColor` (String, nullable)

**Relations:**
- `business` → Business
- `serviceTemplate` → ServiceTemplate (Phase 1 catalog)
- `approvedBy` → User (admin)
- `slots` → Slot[] (legacy, single-service slots)
- `bookingsLegacy` → Booking[] (old relation)
- `bookings` → Booking[] (new relation via `businessServiceId`)
- `slotAllowedServices` → SlotAllowedService[] (Epic 2 multi-service)

**Status:** ✅ ACTIVE

**Known Issues:**
- Legacy `slots` relation still present (slots used to be single-service)
- Dual booking relations (`bookingsLegacy` via `serviceId`, new via `businessServiceId`)

---

#### Slot Model (ACTIVE - Epic 2)
**File:** `server/prisma/schema.prisma:288-320`

**Purpose:** Time slot published by business for booking (opt-in availability model)

**Key Fields:**
- `id` (Int, PK)
- `publicId` (String, unique, UUID)
- `businessId` (Int, FK → Business)
- `serviceId` (Int, nullable, FK → BusinessService) - **LEGACY FIELD**
- `date` (String, format: YYYY-MM-DD)
- `startTime`, `endTime` (String, format: HH:MM)
- `regularPrice`, `dealPrice` (Int, nullable)
- `status` (SlotStatus enum, default: OPEN)
- `note` (String, nullable)
- `color`, `title` (calendar metadata)
- External sync: `externalSource`, `externalId`, `importedAt`

**Relations:**
- `business` → Business
- `service` → BusinessService (legacy, nullable)
- `bookings` → Booking[] (Epic 2: multiple bookings per slot)
- `allowedServices` → SlotAllowedService[] (Epic 2: slot can support multiple services)

**Status:** ✅ ACTIVE (Epic 2 model)

**Known Issues:**
- `serviceId` field is legacy, should eventually be removed
- `regularPrice` optional (since multi-service slots may have variable pricing)

---

#### SlotAllowedService Model (ACTIVE - Epic 2)
**File:** `server/prisma/schema.prisma:322-332`

**Purpose:** Junction table - which services a slot supports

**Key Fields:**
- `id` (Int, PK)
- `slotId` (Int, FK → Slot)
- `businessServiceId` (Int, FK → BusinessService)

**Relations:**
- `slot` → Slot
- `businessService` → BusinessService

**Status:** ✅ ACTIVE (Epic 2)

**Known Issues:** None

---

#### SlotStatus Enum (MIXED - Epic 2 + Legacy)
**File:** `server/prisma/schema.prisma:34-41`

```prisma
enum SlotStatus {
  OPEN      // At least one legal booking time remains
  RESERVED  // Legacy - avoid using for new code
  BOOKED    // Legacy - avoid using for new code
  FULL      // No legal booking time remains for any allowed service
  CANCELLED // Provider cancelled the slot
  EXPIRED   // Slot date/time has passed
}
```

**Status:** ⚠️ MIXED

**Active Values (Epic 2):**
- `OPEN` - slot has available booking windows
- `FULL` - slot completely booked
- `CANCELLED` - provider cancelled
- `EXPIRED` - time passed

**Legacy Values (avoid):**
- `RESERVED` - old single-booking model
- `BOOKED` - old single-booking model

---

#### Booking Model (ACTIVE - Epic 2)
**File:** `server/prisma/schema.prisma:334-366`

**Purpose:** Customer booking within a slot

**Key Fields:**
- `id` (Int, PK)
- `publicId` (String, unique, UUID)
- `customerId` (Int, nullable, FK → User)
- `businessId` (Int, FK → Business)
- `serviceId` (Int, nullable) - **LEGACY FIELD**
- `businessServiceId` (Int, nullable) - **NEW FIELD**
- `slotId` (Int, FK → Slot) - **No longer unique** (Epic 2: multiple bookings per slot)
- `startTime`, `endTime` (String, nullable) - exact time within slot
- `customerName`, `customerPhone`, `customerNote`, `price`
- `status` (BookingStatus enum, default: PENDING)
- `createdAt`, `confirmedAt`, `cancelledAt`, `updatedAt`

**Relations:**
- `customer` → User (nullable, guest booking supported)
- `business` → Business
- `service` → BusinessService (legacy relation)
- `businessService` → BusinessService (new relation)
- `slot` → Slot

**Status:** ✅ ACTIVE (Epic 2)

**Known Issues:**
- Dual service relations (`serviceId` legacy, `businessServiceId` new)
- `slotId` no longer unique - multiple bookings per slot allowed

---

#### BookingStatus Enum (MIXED - Epic 2 + Legacy)
**File:** `server/prisma/schema.prisma:43-53`

```prisma
enum BookingStatus {
  PENDING
  APPROVED          // Legacy
  REJECTED
  COMPLETED
  CANCELLED         // Legacy - ambiguous
  CONFIRMED
  CANCELLED_BY_CUSTOMER
  CANCELLED_BY_BUSINESS
  NO_SHOW
}
```

**Status:** ⚠️ MIXED

**Active Statuses (Epic 2):**
- `PENDING` - awaiting provider confirmation
- `CONFIRMED` - provider confirmed
- `REJECTED` - provider rejected
- `COMPLETED` - service delivered
- `CANCELLED_BY_CUSTOMER` - customer cancelled
- `CANCELLED_BY_BUSINESS` - provider cancelled
- `NO_SHOW` - customer didn't show

**Legacy Statuses (avoid):**
- `APPROVED` - use `CONFIRMED` instead
- `CANCELLED` - ambiguous, use specific cancellation status

---

#### ServiceProviderApproval Model (ACTIVE - Phase 1)
**File:** `server/prisma/schema.prisma:560-577`

**Purpose:** Admin approval workflow for new service provider registrations

**Key Fields:**
- `id` (Int, PK)
- `publicId` (String, unique, UUID)
- `serviceProviderId` (Int, FK → Business.id)
- `status` (RegistrationStatus enum, default: DRAFT)
- `adminNote` (String, nullable)
- `reviewedById` (Int, nullable, FK → User)
- `reviewedAt` (DateTime, nullable)

**Relations:**
- `serviceProvider` → Business
- `reviewedBy` → User (admin)

**Status:** ✅ ACTIVE (Phase 1)

**Known Issues:**
- Status query in ServiceProviderWorkspace may be stuck on "טוען..." if API call fails silently

---

#### Phase 1 Catalog Models (ACTIVE)

**Field** → **Profession** → **ServiceTemplate** hierarchy

**Field** (schema.prisma:426-438):
- Top-level service category (e.g., "Health", "Beauty")
- `name` (unique), `nameHebrew`, `icon`, `displayOrder`
- `status` (LifecycleStatus: DRAFT/ACTIVE/ARCHIVED)

**Profession** (schema.prisma:440-456):
- Profession within a field (e.g., "Hairdresser" in "Beauty")
- `fieldId` (FK → Field)
- `name`, `nameHebrew`, `displayOrder`
- `status` (LifecycleStatus)

**ServiceTemplate** (schema.prisma:458-477):
- Specific service template (e.g., "Haircut" under "Hairdresser")
- `professionId` (FK → Profession)
- `name`, `nameHebrew`, `description`
- `defaultDurationMinutes`, `defaultPrice`
- `colorLevel` (ServiceColor: GREEN/YELLOW/RED - risk/complexity level)
- `status` (LifecycleStatus)

**Status:** ✅ ACTIVE (Phase 1)

**Known Issues:** None

---

#### Legacy/Deprecated Fields Still Present

**In Business model:**
- `city`, `street`, `address` - kept for backward compat, prefer code-based fields

**In Slot model:**
- `serviceId` - legacy single-service model, prefer `allowedServices` junction

**In Booking model:**
- `serviceId` - legacy, prefer `businessServiceId`

**In UserRole enum:**
- `BUSINESS` - legacy, prefer `SERVICE_PROVIDER`
- `SERVICE_RECIPIENT` - defined but not used yet

**In SlotStatus enum:**
- `RESERVED`, `BOOKED` - old single-booking model

**In BookingStatus enum:**
- `APPROVED` - prefer `CONFIRMED`
- `CANCELLED` - ambiguous, prefer specific cancellation statuses

---

### 1.2 Auth and Roles

#### Login Endpoint
**Route:** `/auth/login` (POST)
**File:** `server/src/routes/auth.routes.js:6`
**Controller:** `server/src/controllers/auth.controller.js` (login function)

**Returns:**
- `token` (JWT)
- `user` object with `role` field

**Token Storage:**
- Key: `onovi_token` (not `token`)
- Handled by `client/src/api.js:getToken()`

---

#### Active Roles in System

| Role | Status | Used By | Home View |
|------|--------|---------|-----------|
| `ADMIN` | ✅ Active | Admin users | `admin` |
| `SERVICE_PROVIDER` | ✅ Active (preferred) | New service providers | `service-provider` |
| `BUSINESS` | ⚠️ Legacy (still supported) | Old service providers | `business` |
| `CUSTOMER` | ✅ Active | Service recipients | `customer` |
| `SERVICE_RECIPIENT` | ❌ Not used | - | - |

**File references:**
- `client/src/shared/hooks/useNavigation.js:10-41` - role-based routing
- `client/src/main.jsx:407-413` - SERVICE_PROVIDER → ServiceProviderWorkspace
- `client/src/main.jsx:430` - BUSINESS → BusinessPage (wrapped in AppLayout)
- `client/src/features/business/BusinessPage.jsx:56` - checks for `BUSINESS` or `ADMIN`
- `client/src/layouts/AppLayout.jsx:14,42,45` - displays "עסק" for BUSINESS role

---

#### Auth Middleware
**File:** `server/src/middleware/auth.js`

**Functions:**
- `auth(required = true)` - JWT validation, attaches `req.user`
- `requireRole(roles)` - Checks `req.user.role` against allowed roles

**Used in routes:**
- Most routes use `auth()` or `auth(false)` for optional auth
- Admin routes use `requireRole(['ADMIN'])`
- Service provider routes may check `SERVICE_PROVIDER` or owner match

---

#### Role Mismatch Issues

**Problem locations:**
1. `AppLayout.jsx:42` - hardcoded "עסק" label for BUSINESS role, doesn't handle SERVICE_PROVIDER
2. Admin dashboard counting - may count BUSINESS and SERVICE_PROVIDER separately, causing confusion
3. User filters/tables in admin - may show raw enum values instead of Hebrew labels
4. Navigation items - BUSINESS users get different sidebar than SERVICE_PROVIDER users

**Recommendation:** Consolidate to SERVICE_PROVIDER, migrate existing BUSINESS users

---

### 1.3 Backend Routes Inventory

**Mounting:** `server/src/app.js:38-62`

#### Routes WITHOUT `/api` prefix:
```javascript
app.use('/auth', authRoutes);              // → /auth/*
app.use('/users', userRoutes);             // → /users/*
app.use('/categories', categoryRoutes);     // → /categories/*
app.use('/businesses', businessRoutes);     // → /businesses/*
app.use('/services', serviceRoutes);        // → /services/*
app.use('/slots', slotRoutes);              // → /slots/*
app.use('/bookings', bookingRoutes);        // → /bookings/*
app.use('/admin', adminRoutes);             // → /admin/*
```

#### Routes WITH `/api` prefix:
```javascript
app.use('/api/admin/users', adminUsersRoutes);
app.use('/api/admin/fields', adminFieldRoutes);
app.use('/api/admin/professions', adminProfessionRoutes);
app.use('/api/admin/service-templates', adminServiceTemplateRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/register', registrationRoutes);
app.use('/api/registration', registrationCatalogRoutes);
app.use('/api/admin/documents', adminDocumentsRoutes);
app.use('/api/service-provider/documents', serviceProviderDocumentsRoutes);
app.use('/api/admin/legal', adminLegalRoutes);
app.use('/api/service-provider/legal', serviceProviderLegalRoutes);
app.use('/api/service-provider/business', serviceProviderBusinessRoutes);
app.use('/api/service-provider/registration', serviceProviderRegistrationRoutes);
app.use('/api/service-provider/service-groups', serviceProviderServiceGroupsRoutes);
app.use('/api/service-provider/services', serviceProviderServicesRoutes);
```

---

#### Route Details

**Auth Routes** (`/auth/*`)
- POST `/auth/register` - User registration
- POST `/auth/login` - User login
- GET `/auth/me` - Get current user (requires auth)

**Business Routes** (`/businesses/*`)
- GET `/businesses` - List all businesses
- POST `/businesses` - Create business (requires auth)
- GET `/businesses/:id` - Get business details
- PUT `/businesses/:id` - Update business (requires auth, owner or admin)
- DELETE `/businesses/:id` - Delete business (requires auth, owner or admin)

**Service Routes** (`/services/*`)
- GET `/services` - List all services
- POST `/services` - Create service (requires auth)
- GET `/services/:id` - Get service
- PUT `/services/:id` - Update service (requires auth)
- DELETE `/services/:id` - Delete service (requires auth)

**Slot Routes** (`/slots/*`)
- GET `/slots` - Customer slot discovery (OPEN slots only, unless `includeAll=true`)
- POST `/slots` - Create slot (requires auth, owner or admin)
- GET `/slots/:id` - Get slot details
- PUT `/slots/:id` - Update slot (requires auth, owner or admin)
- DELETE `/slots/:id` - Delete slot (requires auth, owner or admin)
- GET `/slots/:id/available-times` - Get legal booking times for slot/service (Epic 2)

**Booking Routes** (`/bookings/*`)
- GET `/bookings` - List bookings (filter by `mine=true` or `businessId`)
- POST `/bookings` - Create booking (Epic 2: atomic with row locking)
- GET `/bookings/:id` - Get booking details
- PATCH `/bookings/:id/status` - Update booking status (Epic 2)
- PATCH `/bookings/:id/cancel` - Cancel booking (Epic 2)
- DELETE `/bookings/:id` - Delete booking (legacy, use cancel instead)

**Admin Routes** (`/admin/*`)
- GET `/admin/dashboard` - Admin dashboard stats
- GET `/admin/businesses` - List all businesses (admin only)
- PATCH `/admin/businesses/:id/approve` - Approve business (admin only)
- PATCH `/admin/businesses/:id/suspend` - Suspend business (admin only)
- GET `/admin/categories` - List categories
- POST `/admin/categories` - Create category (admin only)
- PUT `/admin/categories/:id` - Update category (admin only)
- DELETE `/admin/categories/:id` - Delete category (admin only)

**Service Provider Routes** (`/api/service-provider/*`)
- GET `/api/service-provider/business/status` - Get approval status
- GET `/api/service-provider/business` - Get business profile
- PUT `/api/service-provider/business` - Update business profile
- GET `/api/service-provider/services` - List services
- POST `/api/service-provider/services` - Create service
- PUT `/api/service-provider/services/:id` - Update service
- DELETE `/api/service-provider/services/:id` - Delete service
- GET `/api/service-provider/service-groups` - List service groups
- POST `/api/service-provider/service-groups` - Create service group
- PUT `/api/service-provider/service-groups/:id` - Update service group
- DELETE `/api/service-provider/service-groups/:id` - Delete service group

**Registration Routes** (`/api/register/*`, `/api/registration/*`)
- Phase 1 registration flow endpoints
- Catalog endpoints (fields, professions, service templates)

**Calendar Routes** (`/api/calendar/*`)
- External calendar import/sync (Google Calendar, etc.)

**Admin Management Routes** (`/api/admin/users/*`, `/api/admin/fields/*`, etc.)
- Phase 1 admin management for catalog, documents, legal consent

---

### 1.4 API Prefix Consistency Audit

#### The Problem

Frontend code calls APIs in **three different ways**:

1. **Without `/api` prefix:** `/businesses`, `/services`, `/slots`, `/bookings`
2. **With `/api` prefix:** `/api/service-provider/business`, `/api/admin/users`
3. **Mixed/incorrect:** Sometimes calls `/api/bookings` when route is actually `/bookings`

#### Current Backend Route Registration

**In `server/src/app.js`:**

```javascript
// NO /api prefix
app.use('/auth', authRoutes);              // Mounted at /auth
app.use('/businesses', businessRoutes);     // Mounted at /businesses
app.use('/services', serviceRoutes);        // Mounted at /services
app.use('/slots', slotRoutes);              // Mounted at /slots
app.use('/bookings', bookingRoutes);        // Mounted at /bookings

// WITH /api prefix
app.use('/api/admin/users', adminUsersRoutes);
app.use('/api/service-provider/business', serviceProviderBusinessRoutes);
// ... etc
```

**This means:**
- ✅ Correct: `fetch('/businesses')` or `api('/businesses')`
- ❌ Wrong: `fetch('/api/businesses')` → 404
- ✅ Correct: `fetch('/api/service-provider/business')`
- ❌ Wrong: `fetch('/service-provider/business')` → 404

---

#### Frontend API Helper

**File:** `client/src/api.js:57-66`

```javascript
export async function api(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'שגיאת שרת');
  return data;
}
```

**This helper:**
- Prepends `API_BASE_URL` (default: `http://localhost:3000`)
- Does **NOT** automatically add `/api` prefix
- Path must be passed exactly as backend expects

---

#### Known Mismatches

**File:** `client/src/features/service-provider/pages/BookingsPage.jsx`

```javascript
// Line 24: Correct (no /api prefix)
const bookingsRes = await api('/bookings');

// Line 54: INCORRECT (adds /api when route is /bookings)
await api(`/api/bookings/${id}/status`, { ... });

// Line 69: INCORRECT
await api(`/api/bookings/${id}/cancel`, { ... });
```

**Actual backend routes:**
- `/bookings` ✅
- `/bookings/:id/status` ✅
- `/bookings/:id/cancel` ✅

**Frontend calls:**
- `/api/bookings/:id/status` ❌ → 404
- `/api/bookings/:id/cancel` ❌ → 404

**This causes:** `Unexpected token '<', "<!doctype "... is not valid JSON`
(Vite dev server returns HTML 404 page when route not found)

---

#### Recommendation

**Option A (Minimal Change):**
- Fix frontend calls to match current backend routes
- Update `BookingsPage.jsx:54,69` to use `/bookings/...` not `/api/bookings/...`

**Option B (Standardization):**
- Mount ALL routes under `/api` prefix in backend
- Update `server/src/app.js` to use `/api/businesses`, `/api/services`, etc.
- Update frontend calls accordingly
- More consistent but requires more changes

**For now:** Use Option A (fix frontend to match current backend)

---

## Part 2: Frontend Audit

### 2.1 Main Routing Structure

**File:** `client/src/main.jsx`

#### Logged-Out Routes

| Route | Component | Layout | Description |
|-------|-----------|--------|-------------|
| `landing` | `LandingPage` | None | Home page (default when logged out) |
| `customer` | `CustomerPage` | `PublicLayout` | Browse/search slots (no login required) |
| `auth` | `AuthPanel` | `PublicLayout` | Login/Register |

#### Registration Flow Routes (Logged-Out)

| Route | Component | Layout | Description |
|-------|-----------|--------|-------------|
| `register-entry` | `RegistrationEntryPage` | `PublicLayout` | Choose: service provider or recipient |
| `register-service-recipient` | `ServiceRecipientComingSoon` | `PublicLayout` | Coming soon page |
| `register-field-selection` | `FieldSelectionPage` | `PublicLayout` | Phase 1: Choose field |
| `register-profession-selection` | `ProfessionSelectionPage` | `PublicLayout` | Phase 1: Choose profession |
| `register-service-selection` | `ServiceSelectionPage` | `PublicLayout` | Phase 1: Choose services |
| `register-service-group-summary` | `ServiceGroupSummary` | `PublicLayout` | Phase 1: Review service groups |
| `register-business-details` | `BusinessDetailsPage` | `PublicLayout` | Phase 1: Enter business info |
| `register-document-upload` | `DocumentUploadPage` | `PublicLayout` | Phase 1: Upload documents |
| `register-consent` | `ConsentScreen` | None | Phase 1: Accept terms |
| `register-complete` | `RegistrationComplete` | None | Phase 1: Success screen |

#### Logged-In Routes

**Router logic (main.jsx:407-413):**
```javascript
// Service Provider Workspace has its own layout (not wrapped in AppLayout)
if (user && view === 'service-provider') {
  return (
    <>
      <ServiceProviderWorkspace user={user} setView={setView} onLogout={logout} />
      <Toast message={message} />
    </>
  );
}
```

**Router logic (main.jsx:418-446):**
```javascript
// Show app shell with role-based navigation for logged-in users (Customer, Business, Admin, CRM)
return (
  <>
    <AppLayout user={user} view={view} navItems={navItems} onNavigate={handleNavigate} onLogout={logout}>
      {/* Customer View */}
      {view === 'customer' && <CustomerPage user={user} setView={setView} />}

      {/* Business View */}
      {view === 'business' && <BusinessPage user={user} setView={setView} />}

      {/* Admin View */}
      {view === 'admin' && user.role === 'ADMIN' && <AdminPage user={user} setView={setView} />}

      {/* CRM View */}
      {view === 'crm' && user.role === 'ADMIN' && <CRMPage user={user} setView={setView} />}
    </AppLayout>
    <Toast message={message} />
  </>
);
```

| View | Role | Component | Layout | Description |
|------|------|-----------|--------|-------------|
| `service-provider` | SERVICE_PROVIDER | `ServiceProviderWorkspace` | Own layout | **Active** provider workspace |
| `business` | BUSINESS or ADMIN | `BusinessPage` | `AppLayout` | **Legacy** provider workspace |
| `customer` | CUSTOMER or ADMIN | `CustomerPage` | `AppLayout` (when logged in) | Browse/book slots |
| `admin` | ADMIN only | `AdminPage` | `AppLayout` | Admin dashboard |
| `crm` | ADMIN only | `CRMPage` | `AppLayout` | CRM for leads |

---

#### Home View Assignment

**File:** `client/src/shared/hooks/useNavigation.js:35-41`

```javascript
export function getHomeView(user) {
  if (!user) return 'landing';
  if (user.role === 'ADMIN') return 'admin';
  if (user.role === 'SERVICE_PROVIDER') return 'service-provider';
  if (user.role === 'BUSINESS') return 'business';
  return 'customer';
}
```

**This means:**
- ADMIN → `admin`
- SERVICE_PROVIDER → `service-provider` (ServiceProviderWorkspace)
- BUSINESS → `business` (BusinessPage, legacy)
- CUSTOMER → `customer`

---

### 2.2 Layout Components Inventory

#### AppLayout
**File:** `client/src/layouts/AppLayout.jsx`

**Used by:**
- `customer` view (when logged in)
- `business` view (BUSINESS role, legacy)
- `admin` view
- `crm` view

**Features:**
- Desktop sidebar (`.app-sidebar`)
- Mobile bottom nav (`.mobile-nav`)
- Logo, nav items, user info, logout button

**Sidebar navigation items:** Passed as `navItems` prop from `getNavItems(user)`

**Known Issues:**
- Line 42-45: Hardcoded role labels ("אדמין", "עסק", "לקוח") don't handle SERVICE_PROVIDER gracefully
- Line 14: Assumes BUSINESS role for business home, doesn't handle SERVICE_PROVIDER

---

#### ServiceProviderWorkspace (Own Layout)
**File:** `client/src/features/service-provider/ServiceProviderWorkspace.jsx`

**Used by:**
- `service-provider` view (SERVICE_PROVIDER role)

**Features:**
- Own sidebar (`.app-sidebar`)
- Mobile bottom nav (`.mobile-nav`)
- Approval status badge in header
- Internal navigation state (does NOT use main.jsx routing)

**Navigation items (lines 47-57):**
```javascript
[
  { id: 'dashboard', label: 'לוח בקרה', icon: '📊', active: true },
  { id: 'business', label: 'פרטי העסק', icon: '🏢', active: true },
  { id: 'services', label: 'שירותים', icon: '✂️', active: true },
  { id: 'service-groups', label: 'קבוצות שירותים', icon: '📦', active: true },
  { id: 'calendar', label: 'תורים', icon: '📅', active: true },
  { id: 'bookings', label: 'הזמנות', icon: '📋', active: true },
  { id: 'customers', label: 'לקוחות', icon: '👥', active: false },
  { id: 'reports', label: 'דוחות', icon: '📈', active: false },
  { id: 'settings', label: 'הגדרות', icon: '⚙️', active: true }
]
```

**Pages rendered (lines 88-104):**
- `dashboard` → `DashboardPage`
- `business` → `BusinessProfilePage`
- `services` → `ServicesPage`
- `service-groups` → `ServiceGroupsPage`
- `calendar` → `CalendarPage`
- `bookings` → `BookingsPage`
- `settings` → `SettingsPage`
- Inactive pages → `ComingSoonPage`

**Known Issues:**
- Approval status fetch (line 38): Calls `/api/service-provider/business/status`
  - May get stuck on "טוען..." if API fails silently
  - No error handling shown to user

---

#### PublicLayout
**File:** `client/src/layouts/PublicLayout.jsx`

**Used by:**
- All registration flow screens
- `auth` view
- `customer` view (when NOT logged in)

**Features:**
- Minimal layout
- Optional back button
- Logo in header

---

#### Duplicate Sidebar Issue

**Problem:**
- ServiceProviderWorkspace has its own `.app-sidebar`
- AppLayout also renders `.app-sidebar`
- If both are rendered simultaneously (routing bug), user sees two sidebars

**Root cause:**
- ServiceProviderWorkspace is NOT wrapped in AppLayout (line 407-413)
- If routing logic breaks, both layouts might render

**Recommendation:** Ensure routing is exclusive (already is, but worth monitoring)

---

### 2.3 Service Provider Workspace Audit

**Component:** `ServiceProviderWorkspace`
**File:** `client/src/features/service-provider/ServiceProviderWorkspace.jsx`
**Status:** ✅ ACTIVE (recommended for SERVICE_PROVIDER role)

---

#### Pages and Status

| Page ID | Label | Component | Status | Notes |
|---------|-------|-----------|--------|-------|
| `dashboard` | לוח בקרה | `DashboardPage` | ✅ Active | Overview stats |
| `business` | פרטי העסק | `BusinessProfilePage` | ✅ Active | Edit business profile |
| `services` | שירותים | `ServicesPage` | ✅ Active | Manage services |
| `service-groups` | קבוצות שירותים | `ServiceGroupsPage` | ✅ Active | Manage service groups (Phase 1) |
| `calendar` | תורים | `CalendarPage` | ✅ Active | Slot management (Epic 2) |
| `bookings` | הזמנות | `BookingsPage` | ✅ Active | Booking management (Epic 2) |
| `customers` | לקוחות | `ComingSoonPage` | ⏳ Coming soon | Placeholder |
| `reports` | דוחות | `ComingSoonPage` | ⏳ Coming soon | Placeholder |
| `settings` | הגדרות | `SettingsPage` | ✅ Active | User settings |

---

#### CalendarPage (Slots Management)
**File:** `client/src/features/service-provider/pages/CalendarPage.jsx`

**Purpose:** Standalone slot management for Epic 2 multi-service slots

**API Calls:**
- GET `/businesses` - Fetch user's businesses (line 40)
- GET `/services` - Fetch services (line 46)
- GET `/slots` - Fetch slots (line 54)
- POST `/slots` - Create slot (line 88) ✅ Correct endpoint
- PUT `/slots/:id` - Update slot (line 116) ✅ Correct endpoint
- DELETE `/slots/:id` - Delete slot (line 128) ✅ Correct endpoint

**Components used:**
- `SlotForm` (imported from `../../business/components/SlotForm`)
- `SlotCard` (imported from `../../business/components/SlotCard`)

**Known Issues:**
- None critical
- Successfully uses correct endpoints (no `/api/slots` mismatch)

**Status:** ✅ Active, working correctly

---

#### BookingsPage (Bookings Management)
**File:** `client/src/features/service-provider/pages/BookingsPage.jsx`

**Purpose:** Standalone bookings management for Epic 2

**API Calls:**
- GET `/bookings` - Fetch bookings (line 24) ✅ Correct
- GET `/businesses` - Fetch user's businesses (line 29) ✅ Correct
- PATCH `/api/bookings/:id/status` - Update status (line 54) ❌ **WRONG** (should be `/bookings/:id/status`)
- PATCH `/api/bookings/:id/cancel` - Cancel booking (line 69) ❌ **WRONG** (should be `/bookings/:id/cancel`)

**Components used:**
- `BookingCard` (imported from `../../business/components/BookingCard`)

**Known Issues:**
1. **BLOCKER:** Lines 54 and 69 use `/api/bookings/...` but backend route is `/bookings/...`
   - This causes `Unexpected token '<'` error (404 returns HTML)
   - Status updates and cancellations fail
2. No error message shown to user when API fails

**Status:** ⚠️ Active but broken for status updates and cancellations

---

#### BusinessProfilePage
**File:** `client/src/features/service-provider/pages/BusinessProfilePage.jsx`

**Purpose:** Edit business profile and details

**API Calls:**
- GET `/api/service-provider/business` ✅ Correct
- PUT `/api/service-provider/business` ✅ Correct

**Status:** ✅ Active

**Known Issues:** None critical

---

#### ServicesPage
**File:** `client/src/features/service-provider/pages/ServicesPage.jsx`

**Purpose:** Manage services

**API Calls:**
- GET `/api/service-provider/services` ✅ Correct
- POST `/api/service-provider/services` ✅ Correct
- PUT `/api/service-provider/services/:id` ✅ Correct
- DELETE `/api/service-provider/services/:id` ✅ Correct

**Status:** ✅ Active

**Known Issues:** None critical

---

#### ServiceGroupsPage
**File:** `client/src/features/service-provider/pages/ServiceGroupsPage.jsx`

**Purpose:** Manage service groups (Phase 1 registration flow artifact)

**API Calls:**
- GET `/api/service-provider/service-groups` ✅ Correct
- POST `/api/service-provider/service-groups` ✅ Correct
- PUT `/api/service-provider/service-groups/:id` ✅ Correct
- DELETE `/api/service-provider/service-groups/:id` ✅ Correct

**Status:** ✅ Active

**Known Issues:** None critical

---

#### SettingsPage
**File:** `client/src/features/service-provider/pages/SettingsPage.jsx`

**Purpose:** User account settings

**Known Issues:**
- May use `localStorage.getItem('token')` instead of `getToken()` from api.js
  - Grep found this file (line unknown)
  - Should use `getToken()` for correct key (`onovi_token`)

**Status:** ✅ Active (with minor token key issue)

---

### 2.4 Admin Workspace Audit

**Component:** `AdminPage`
**File:** `client/src/pages/AdminPage.jsx`
**Layout:** `AppLayout`
**Status:** ✅ ACTIVE

---

#### Sections

| Section | Component | Status | Description |
|---------|-----------|--------|-------------|
| `dashboard` | Inline (AdminPage) | ✅ Active | Dashboard stats, KPIs |
| `users` | `UsersPage` | ✅ Active | User management (Phase 1) |
| Categories | Inline (AdminPage) | ✅ Active | Manage categories |
| Pending businesses | Inline (AdminPage) | ✅ Active | Approve/reject businesses |

---

#### Dashboard Stats (KPIs)
**Lines:** 187-241

**Stats shown:**
- `usersCount`
- `categoriesCount`
- `businessesCount`
- `pendingBusinessesCount`
- `servicesCount`
- `openSlotsCount` / `slotsCount`
- `bookingsCount`

**API Call:** GET `/admin/dashboard` (line 20)

**Known Issues:**
1. **Business counting may be inaccurate:**
   - If backend counts BUSINESS and SERVICE_PROVIDER separately, number may be confusing
   - May count same business twice if role was migrated
2. **Pending businesses count:**
   - Line 210-213: Shows warning if `pendingBusinessesCount > 0`
   - Useful, but actual pending list is below (line 332)

---

#### User Management
**Component:** `UsersPage`
**File:** `client/src/features/admin/users/UsersPage.jsx`

**Features:**
- User table with filters
- User drawer with details, activity, notes
- Role assignment
- Status management
- Tags

**Known Issues:**
1. **Role labels may show raw enum values:**
   - If user role is `SERVICE_PROVIDER`, UI may show "SERVICE_PROVIDER" instead of Hebrew label
   - Check `UserTable.jsx` and `UserDrawer.jsx` for role display logic
2. **Filter by role:**
   - May not include SERVICE_PROVIDER in "Business" filter
   - May list SERVICE_PROVIDER as separate role, confusing admins

**Status:** ✅ Active (with role display issues)

---

#### Business Approval Flow
**Lines:** 330-384

**Shows:** List of businesses with `status === 'PENDING_APPROVAL'`

**Actions:**
- ✓ Approve (line 371) → PATCH `/admin/businesses/:id/approve`
- ✗ Reject/Suspend (line 374) → PATCH `/admin/businesses/:id/suspend`

**Known Issues:**
- Line 365: Shows `business.category?.name || 'ללא קטגוריה'`
  - If category is null (allowed since migration), shows "ללא קטגוריה"
  - May cause confusion if category is actually required

**Status:** ✅ Active

---

### 2.5 Customer Flow Audit

**Component:** `CustomerPage`
**File:** `client/src/features/customer/CustomerPage.jsx`
**Layout:** `PublicLayout` (when logged out) or `AppLayout` (when logged in)
**Status:** ✅ ACTIVE

---

#### Flow

1. **Location selection** (`LocationHeader` component)
2. **Search filters** (`SearchFilters` component)
   - Category
   - City
   - Date
3. **Search results** (`SearchResults` component)
   - List of slots (SlotCard)
4. **Booking dialog** (`BookingDialog` component)
   - Select service (if multi-service slot)
   - Select time (available times API)
   - Enter customer details
   - Submit booking

---

#### API Calls

**In `useSearchData` hook:**
- GET `/slots` - Fetch OPEN slots (line unknown, in hook)
- GET `/categories` - Fetch categories for filter

**In `useBooking` hook:**
- GET `/slots/:id/available-times?serviceId=...` - Get legal start times (Epic 2)
- POST `/bookings` - Create booking (Epic 2)

**Known Issues:**
- None critical
- API calls use correct endpoints (no `/api/slots` mismatch)

**Status:** ✅ Active, working correctly

---

#### Components

| Component | File | Purpose | Status |
|-----------|------|---------|--------|
| `CustomerPage` | `customer/CustomerPage.jsx` | Main orchestrator | ✅ Active |
| `LocationHeader` | `customer/location/LocationHeader.jsx` | Location selection | ✅ Active |
| `SearchFilters` | `customer/search/SearchFilters.jsx` | Category/city/date filter | ✅ Active |
| `SearchResults` | `customer/search/SearchResults.jsx` | Slot list | ✅ Active |
| `SlotCard` | `customer/search/SlotCard.jsx` | Slot card for customer view | ✅ Active |
| `BookingDialog` | `customer/booking/BookingDialog.jsx` | Multi-step booking form | ✅ Active |
| `BookingForm` | `customer/booking/BookingForm.jsx` | Customer details form | ✅ Active |
| `BookingSummary` | `customer/booking/BookingSummary.jsx` | Booking confirmation summary | ✅ Active |
| `BookingSuccess` | `customer/booking/BookingSuccess.jsx` | Success screen | ✅ Active |

---

### 2.6 Duplicate Components Audit

---

#### SlotCard (3 versions)

| File | Used By | Purpose | Status |
|------|---------|---------|--------|
| `client/src/features/business/components/SlotCard.jsx` | BusinessPage (legacy), CalendarPage (active) | Display slot for provider | ✅ Active |
| `client/src/features/business/calendar/components/SlotCard.jsx` | CalendarPage (old calendar, unused?) | Display slot in calendar view | ⚠️ Unclear, possibly legacy |
| `client/src/features/customer/search/SlotCard.jsx` | CustomerPage | Display slot for customer | ✅ Active |

**Recommendation:**
- Keep `business/components/SlotCard.jsx` (used by active CalendarPage)
- Keep `customer/search/SlotCard.jsx` (customer view is different)
- Investigate `business/calendar/components/SlotCard.jsx` - may be legacy

---

#### BookingCard (1 version)

| File | Used By | Purpose | Status |
|------|---------|---------|--------|
| `client/src/features/business/components/BookingCard.jsx` | BookingsTab (legacy), BookingsPage (active) | Display booking for provider | ✅ Active |

**Recommendation:** Keep, actively used

---

#### Calendar Components

| File | Purpose | Used By | Status |
|------|---------|---------|--------|
| `client/src/features/business/calendar/CalendarPage.jsx` | Full calendar view with events, time blocks, vacations | BusinessPage (legacy) `calendar` tab | ⚠️ Legacy (BusinessPage is legacy) |
| `client/src/features/service-provider/pages/CalendarPage.jsx` | Slot management (Epic 2) | ServiceProviderWorkspace `calendar` page | ✅ Active |
| `client/src/features/business/calendar/components/CalendarHeader.jsx` | Calendar header (week navigation) | Legacy CalendarPage | ⚠️ Legacy |
| `client/src/features/business/calendar/components/CalendarEventCard.jsx` | Calendar event card | Legacy CalendarPage | ⚠️ Legacy |

**Recommendation:**
- ServiceProviderWorkspace CalendarPage is ACTIVE (Epic 2 slot management)
- BusinessPage CalendarPage is LEGACY (old calendar view)
- After BUSINESS role migration, consider consolidating or removing legacy calendar

---

#### SlotsTab vs CalendarPage

| Component | File | Used By | Purpose | Status |
|-----------|------|---------|---------|--------|
| `SlotsTab` | `business/tabs/SlotsTab.jsx` | BusinessPage (legacy) | Slot management (pre-Epic 2) | ⚠️ Legacy |
| `CalendarPage` | `service-provider/pages/CalendarPage.jsx` | ServiceProviderWorkspace | Slot management (Epic 2) | ✅ Active |

**Recommendation:** After BUSINESS role migration, deprecate SlotsTab

---

#### BookingsTab vs BookingsPage

| Component | File | Used By | Purpose | Status |
|-----------|------|---------|---------|--------|
| `BookingsTab` | `business/tabs/BookingsTab.jsx` | BusinessPage (legacy) | Booking management (pre-Epic 2) | ⚠️ Legacy |
| `BookingsPage` | `service-provider/pages/BookingsPage.jsx` | ServiceProviderWorkspace | Booking management (Epic 2) | ✅ Active |

**Recommendation:** After BUSINESS role migration, deprecate BookingsTab

---

#### BusinessPage vs ServiceProviderWorkspace

| Component | File | Role | Layout | Purpose | Status |
|-----------|------|------|--------|---------|--------|
| `BusinessPage` | `features/business/BusinessPage.jsx` | BUSINESS (legacy) | AppLayout | Old business management UI | ⚠️ Legacy (still supported) |
| `ServiceProviderWorkspace` | `features/service-provider/ServiceProviderWorkspace.jsx` | SERVICE_PROVIDER | Own layout | New service provider workspace | ✅ Active (recommended) |

**Key Differences:**
- BusinessPage uses tab-based navigation within AppLayout
- ServiceProviderWorkspace has own sidebar and internal routing
- ServiceProviderWorkspace supports Epic 2 multi-service slots
- ServiceProviderWorkspace has approval status display

**Recommendation:**
- ServiceProviderWorkspace is the current standard
- Migrate BUSINESS users to SERVICE_PROVIDER role
- Deprecate BusinessPage after migration

---

## Part 3: Terminology Audit

### Search Results

| Term | Locations | Status | Notes |
|------|-----------|--------|-------|
| **PickMe** | `client/src/api.js:7,8` (migration code) | ⚠️ Legacy, safe | Storage key migration only |
| **Onovi** | `client/src/api.js` (storage keys: `onovi_token`, `onovi_user`) | ⚠️ Internal only | Not visible to users |
| **Lomea** | Logos, page titles, API response messages | ✅ Current brand | User-facing |
| **Business** (role) | Prisma schema, auth logic, frontend routing | ⚠️ Legacy role | Should migrate to SERVICE_PROVIDER |
| **SERVICE_PROVIDER** | Prisma schema, auth logic, ServiceProviderWorkspace | ✅ Current role | Recommended |
| **Customer** | Everywhere | ✅ Active | Current customer role |
| **SERVICE_RECIPIENT** | Prisma schema only | ❌ Not used | Placeholder for future |
| **BUSINESS** (code refs) | 20+ files | ⚠️ Legacy | Used in auth checks, routing, role display |

---

### Detailed Terminology Findings

#### "PickMe" References
**Files:**
- `client/src/api.js:7-8` - Migration from `pickme_token` to `onovi_token`

**Status:** ✅ Safe (migration code, runs once, no user-facing text)

---

#### "Onovi" References
**Files:**
- `client/src/api.js:10,13,25,30,39,44,48,53` - Storage keys: `onovi_token`, `onovi_user`

**Status:** ⚠️ Internal only (not user-facing, but inconsistent with "Lomea" brand)

**Recommendation:** Rename storage keys to `lomea_token` and `lomea_user` in future migration

---

#### "Lomea" References
**Files:**
- Logos: `/assets/lomea-logo.png`
- API response: `{ message: 'Lomea API is running' }` (server/src/app.js:35)
- Multiple frontend titles and labels

**Status:** ✅ Current brand, user-facing

---

#### "BUSINESS" Role References (20 files)

**Key files:**
1. `server/prisma/schema.prisma:14` - Enum definition (marked legacy)
2. `client/src/shared/hooks/useNavigation.js:15,39` - Routing logic
3. `client/src/layouts/AppLayout.jsx:14,42` - Role display
4. `client/src/features/business/BusinessPage.jsx:56` - Auth check
5. `server/src/routes/booking.routes.js`, `calendar.routes.js`, `slot.routes.js` - Auth checks

**Status:** ⚠️ Legacy but still active

**Problems:**
- Dual role system creates confusion
- Admin dashboard may count businesses incorrectly
- User table may show raw "BUSINESS" enum value instead of Hebrew label
- Navigation inconsistency (BUSINESS gets AppLayout sidebar, SERVICE_PROVIDER gets own sidebar)

**Recommendation:** Migrate all BUSINESS users to SERVICE_PROVIDER role

---

#### "SERVICE_PROVIDER" Role References (20 files)

**Key files:**
1. `server/prisma/schema.prisma:16` - Enum definition
2. `client/src/shared/hooks/useNavigation.js:20,38` - Routing logic
3. `client/src/features/service-provider/ServiceProviderWorkspace.jsx` - Main workspace
4. Multiple service-provider route files

**Status:** ✅ Active, current standard

---

## Part 4: Known Problems List

### Priority Legend
- 🔴 **BLOCKER:** Breaks core functionality
- 🟠 **HIGH:** Significant user impact
- 🟡 **MEDIUM:** Moderate impact
- 🟢 **LOW:** Minor issue

---

### 🔴 BLOCKER #1: Booking Status Update API Mismatch

**File:** `client/src/features/service-provider/pages/BookingsPage.jsx:54,69`

**Problem:**
- Frontend calls `/api/bookings/:id/status` and `/api/bookings/:id/cancel`
- Backend routes are `/bookings/:id/status` and `/bookings/:id/cancel` (no `/api` prefix)
- Results in 404, Vite returns HTML, causes `Unexpected token '<'` JSON parse error

**Impact:**
- Service providers **cannot** update booking status
- Service providers **cannot** cancel bookings from UI
- Bookings stuck in PENDING status

**Affected Screen:** ServiceProviderWorkspace → Bookings page

**Root Cause:** API prefix inconsistency (see Section 1.4)

**Fix:**
```javascript
// Line 54 - BEFORE:
await api(`/api/bookings/${id}/status`, { ... });

// Line 54 - AFTER:
await api(`/bookings/${id}/status`, { ... });

// Line 69 - BEFORE:
await api(`/api/bookings/${id}/cancel`, { ... });

// Line 69 - AFTER:
await api(`/bookings/${id}/cancel`, { ... });
```

**Should Fix Before Push:** ✅ YES

---

### 🟠 HIGH #2: Approval Status Stuck on "טוען..."

**File:** `client/src/features/service-provider/ServiceProviderWorkspace.jsx:36-44`

**Problem:**
- Approval status fetch calls `/api/service-provider/business/status`
- If API fails, `loading` is set to `false` but `approvalStatus` remains `null`
- UI shows "טוען..." indefinitely (line 61)
- No error message shown to user

**Impact:**
- Service providers cannot see their approval status
- May not know if they're approved or pending

**Affected Screen:** ServiceProviderWorkspace (header, all pages)

**Root Cause:**
- Silent error handling (line 42-43 only logs to console)
- No fallback UI for error state

**Fix:**
```javascript
// Add error state
const [error, setError] = useState(null);

// In fetchApprovalStatus:
catch (error) {
  console.error('Failed to fetch approval status:', error);
  setError('לא הצלחנו לטעון את סטטוס האישור');
  setLoading(false);
}

// In renderApprovalStatusBadge:
if (error) {
  return <div className="badge badge-danger">שגיאה</div>;
}
```

**Should Fix Before Push:** ✅ YES

---

### 🟠 HIGH #3: Dual Role System (BUSINESS vs SERVICE_PROVIDER)

**Files:** Multiple (see Section 3: Terminology Audit)

**Problem:**
- Both `BUSINESS` and `SERVICE_PROVIDER` roles exist
- Routing, UI, and backend logic check for both
- Admin dashboard may count them separately
- User tables may show raw enum values
- Inconsistent navigation (BUSINESS gets AppLayout, SERVICE_PROVIDER gets own workspace)

**Impact:**
- Confusion for admins (two provider counts?)
- Inconsistent UX for providers (different workspaces based on role)
- Technical debt and code duplication

**Root Cause:** Incomplete migration from BUSINESS to SERVICE_PROVIDER

**Fix Strategy:**
1. Data migration: UPDATE User SET role = 'SERVICE_PROVIDER' WHERE role = 'BUSINESS'
2. Remove BUSINESS role from enum (breaking change, requires care)
3. Update all code to only check SERVICE_PROVIDER
4. Consolidate BusinessPage into ServiceProviderWorkspace (or deprecate)

**Should Fix Before Push:** ⚠️ NO (requires careful migration, not a quick fix)

**Recommended:** Sprint D task

---

### 🟡 MEDIUM #4: Admin Dashboard Business Count Inaccurate

**File:** `client/src/pages/AdminPage.jsx:209`

**Problem:**
- Dashboard shows `businessesCount`
- If backend counts BUSINESS and SERVICE_PROVIDER users separately, number may be confusing
- May count same business twice if owner role changed

**Impact:**
- Misleading KPI for admins

**Root Cause:** Dual role system (see #3)

**Fix:** Resolve role system, or adjust dashboard query to count businesses (not users with role)

**Should Fix Before Push:** 🤷 OPTIONAL (not breaking, but confusing)

---

### 🟡 MEDIUM #5: Slot Publish Button May Appear to Fail

**File:** `client/src/features/service-provider/pages/CalendarPage.jsx:88`

**Problem:**
- Slot form submit calls `POST /slots`
- No loading state or confirmation message is immediately visible
- User may think button did nothing

**Impact:**
- User may click multiple times, creating duplicate slots
- Poor UX (no feedback)

**Root Cause:** No immediate user feedback before API response

**Fix:**
- Add loading state on submit button
- Disable button during request
- Show immediate feedback (spinner or message)

**Should Fix Before Push:** 🤷 OPTIONAL (not breaking, but poor UX)

---

### 🟡 MEDIUM #6: Token Storage Key Inconsistency

**Files:**
- `client/src/api.js:39` - Uses `onovi_token`
- `client/src/features/service-provider/pages/SettingsPage.jsx` - May use `localStorage.getItem('token')`

**Problem:**
- Some components may directly call `localStorage.getItem('token')` instead of `getToken()`
- Actual key is `onovi_token`, not `token`
- This breaks authentication in those components

**Impact:**
- Component thinks user is logged out when they're not
- May cause re-login prompts or unauthorized errors

**Root Cause:** Not using centralized `getToken()` helper

**Fix:**
- Grep for all `localStorage.getItem('token')` or `localStorage.getItem("token")`
- Replace with `import { getToken } from '../../api'; ... getToken()`

**Should Fix Before Push:** ⚠️ YES (if SettingsPage is broken)

**Verification Needed:** Check if SettingsPage actually has this issue

---

### 🟡 MEDIUM #7: Category Nullable but Assumed Required

**File:** `server/prisma/schema.prisma:186`

**Problem:**
- Business.categoryId made nullable for migration
- Frontend and admin UI may assume category is always present
- May show "ללא קטגוריה" or cause crashes if null

**Impact:**
- Confusing for admins
- May cause frontend errors if code doesn't handle null

**Root Cause:** Migration to Phase 1 catalog (categories now optional?)

**Fix:**
- Clarify business requirement: is category required or optional?
- If required: add validation in backend and frontend
- If optional: ensure all UI handles null gracefully

**Should Fix Before Push:** 🤷 OPTIONAL (clarify with product owner)

---

### 🟢 LOW #8: Legacy Calendar Components Unused

**Files:**
- `client/src/features/business/calendar/CalendarPage.jsx`
- `client/src/features/business/calendar/components/*`

**Problem:**
- Old calendar view (pre-Epic 2) may still exist in codebase
- No longer used by active SERVICE_PROVIDER workspace
- Only used by legacy BusinessPage

**Impact:**
- Code clutter, confusion about which component is active

**Root Cause:** Incomplete cleanup after Epic 2 implementation

**Fix:**
- After BUSINESS role migration, delete legacy calendar components
- Or clearly mark as legacy/deprecated in comments

**Should Fix Before Push:** ❌ NO (low priority cleanup)

---

### 🟢 LOW #9: Admin User Table Role Display

**File:** `client/src/features/admin/users/components/UserTable.jsx`

**Problem:**
- User role may show raw enum value ("SERVICE_PROVIDER") instead of Hebrew label ("נותן שירות")
- Confusing for Hebrew-speaking admins

**Impact:**
- Poor admin UX

**Root Cause:** No role label mapping in user table

**Fix:**
- Add role label mapping:
  ```javascript
  const roleLabels = {
    ADMIN: 'אדמין',
    SERVICE_PROVIDER: 'נותן שירות',
    BUSINESS: 'עסק (ישן)',
    CUSTOMER: 'לקוח',
    SERVICE_RECIPIENT: 'מקבל שירות'
  };
  ```

**Should Fix Before Push:** 🤷 OPTIONAL (cosmetic issue)

---

### 🟢 LOW #10: Storage Key Still Uses "onovi"

**File:** `client/src/api.js:39,44,48,53`

**Problem:**
- Storage keys are `onovi_token` and `onovi_user`
- Brand is now "Lomea"
- Internal inconsistency

**Impact:**
- None user-facing, but confusing for developers

**Root Cause:** Incomplete rebranding

**Fix:**
- Rename to `lomea_token` and `lomea_user`
- Add migration code (similar to pickme → onovi migration)

**Should Fix Before Push:** ❌ NO (internal only, not urgent)

---

## Part 5: Top 10 Problems Before Push

| # | Priority | Problem | File(s) | Should Fix |
|---|----------|---------|---------|------------|
| 1 | 🔴 BLOCKER | Booking status update API mismatch | `BookingsPage.jsx:54,69` | ✅ YES |
| 2 | 🟠 HIGH | Approval status stuck on "טוען..." | `ServiceProviderWorkspace.jsx:36-44` | ✅ YES |
| 3 | 🟠 HIGH | Dual role system (BUSINESS vs SERVICE_PROVIDER) | Multiple files | ⚠️ Sprint D |
| 4 | 🟡 MEDIUM | Admin dashboard business count inaccurate | `AdminPage.jsx:209` | 🤷 OPTIONAL |
| 5 | 🟡 MEDIUM | Slot publish button no feedback | `CalendarPage.jsx:88` | 🤷 OPTIONAL |
| 6 | 🟡 MEDIUM | Token storage key inconsistency (if real) | `SettingsPage.jsx` | ⚠️ Verify first |
| 7 | 🟡 MEDIUM | Category nullable but assumed required | `schema.prisma:186` | 🤷 Clarify req |
| 8 | 🟢 LOW | Legacy calendar components unused | `business/calendar/*` | ❌ Future cleanup |
| 9 | 🟢 LOW | Admin user table role display | `UserTable.jsx` | 🤷 OPTIONAL |
| 10 | 🟢 LOW | Storage key still uses "onovi" | `api.js` | ❌ Future cleanup |

---

## Recommended Next Strategy

### Immediate (Before Push)
1. ✅ **Fix #1 (BLOCKER):** Update `BookingsPage.jsx` lines 54 and 69 to use correct endpoints
   - Change `/api/bookings/...` to `/bookings/...`
   - Test in browser: update booking status, cancel booking
2. ✅ **Fix #2 (HIGH):** Add error handling for approval status fetch
   - Add error state and error UI in `ServiceProviderWorkspace.jsx`
   - Test in browser: verify error message shows if API fails
3. ⚠️ **Verify #6:** Check if `SettingsPage.jsx` actually has token key issue
   - If yes, fix by using `getToken()` helper
   - If no, remove from problems list

### Sprint D (After Push, Before New Features)
1. **Resolve #3 (Dual Role System):**
   - Create data migration script to convert BUSINESS → SERVICE_PROVIDER
   - Update all auth checks, routing, UI labels
   - Deprecate BusinessPage (or migrate features to ServiceProviderWorkspace)
   - Remove BUSINESS from UserRole enum (breaking change)
2. **Clean up #8 (Legacy Calendar):**
   - After role migration, remove unused legacy calendar components
   - Consolidate slot management to ServiceProviderWorkspace CalendarPage
3. **Standardize #4 (Admin Dashboard):**
   - Update business count logic to count businesses, not provider users
   - Clarify KPI definitions with product owner

### Sprint E+ (Future Enhancements)
1. **Improve #5 (Slot Publish UX):**
   - Add loading states and immediate feedback to all forms
   - Implement optimistic UI updates
2. **Polish #9 (Admin Role Display):**
   - Add Hebrew role labels throughout admin UI
   - Standardize enum-to-label mappings
3. **Rebrand #10 (Storage Keys):**
   - Migrate `onovi_*` keys to `lomea_*`
   - Update migration code

---

## Git Status

```
Current branch: develop

Main branch (you will usually use this for PRs):

Status:
M client/src/features/service-provider/ServiceProviderWorkspace.jsx
 M client/src/features/service-provider/pages/BookingsPage.jsx
 M client/src/features/service-provider/pages/BusinessProfilePage.jsx
 M client/src/features/service-provider/pages/CalendarPage.jsx
 M client/src/features/service-provider/pages/ServiceGroupsPage.jsx
 M client/src/features/service-provider/pages/ServicesPage.jsx
 M client/src/features/service-provider/pages/SettingsPage.jsx
 M server/prisma/seed.js
?? docs/AI_AGENT_WORKFLOW.md

Recent commits:
9e81538 feat: implement epic 2 booking engine
0e80297 feat: complete service provider management workspace
641f1a7 feat: add service provider service groups management
987adb2 feat: add service provider business profile management
4f7e604 feat: add service provider workspace foundation
```

**Modified files (not staged):**
- 7 ServiceProviderWorkspace page files
- 1 seed file
- 1 new documentation file (AI_AGENT_WORKFLOW.md)

**Recommendation:**
- Do NOT commit yet
- Fix BLOCKER #1 first
- Test in browser
- Then stage, commit, and push

---

## Summary

### What Is Active
- ✅ **SERVICE_PROVIDER role** and **ServiceProviderWorkspace** - current standard
- ✅ **Epic 2 booking engine** - multi-service slots, multiple bookings per slot, legal time calculation
- ✅ **Phase 1 registration flow** - field/profession/service catalog
- ✅ **Admin workspace** - dashboard, users, categories, approvals
- ✅ **Customer flow** - search, filter, book slots

### What Is Legacy
- ⚠️ **BUSINESS role** - still supported but should migrate to SERVICE_PROVIDER
- ⚠️ **BusinessPage** - old provider workspace (tab-based, uses AppLayout)
- ⚠️ **Old calendar components** - pre-Epic 2 calendar view
- ⚠️ **Legacy booking/slot fields** - `serviceId`, `RESERVED`, `BOOKED`, `APPROVED`, `CANCELLED` statuses

### What Is Duplicated
- **SlotCard** - 3 versions (business, business/calendar, customer)
- **Role system** - BUSINESS and SERVICE_PROVIDER both exist
- **Provider workspace** - BusinessPage and ServiceProviderWorkspace
- **Slot management** - SlotsTab (legacy) and CalendarPage (active)
- **Booking management** - BookingsTab (legacy) and BookingsPage (active)

### What Is Broken
- 🔴 **Booking status updates** - API endpoint mismatch (BookingsPage lines 54, 69)
- 🟠 **Approval status display** - may show "טוען..." indefinitely if API fails

### Single Source of Truth Going Forward
- **Role:** SERVICE_PROVIDER (not BUSINESS)
- **Workspace:** ServiceProviderWorkspace (not BusinessPage)
- **Slot management:** CalendarPage in ServiceProviderWorkspace (Epic 2 model)
- **Booking management:** BookingsPage in ServiceProviderWorkspace (Epic 2 model)
- **Slot model:** Multi-service via SlotAllowedService junction
- **Booking model:** Multiple bookings per slot with exact start/end times

---

**End of Audit Report**
