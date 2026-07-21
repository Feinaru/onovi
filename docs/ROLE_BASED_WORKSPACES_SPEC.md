# Role-Based Workspaces Specification

**Project:** Lomea - Appointment Booking Platform
**Document Version:** 1.0
**Date:** 2026-07-06
**Status:** PLANNING / DRAFT
**Author:** AI Agent (Claude)

---

## Table of Contents

1. [Current Active Architecture](#1-current-active-architecture)
2. [ServiceProviderWorkspace as Reference Pattern](#2-serviceproviderworkspace-as-reference-pattern)
3. [CustomerWorkspace Specification](#3-customerworkspace-specification)
4. [AdminWorkspace Specification](#4-adminworkspace-specification)
5. [Unified Workspace Architecture Proposal](#5-unified-workspace-architecture-proposal)
6. [Data Model Review and Required Adaptations](#6-data-model-review-and-required-adaptations)
7. [API Contract Review](#7-api-contract-review)
8. [Permission Matrix](#8-permission-matrix)
9. [UI/UX Consistency Plan](#9-uiux-consistency-plan)
10. [Migration / Implementation Plan](#10-migration--implementation-plan)
11. [Deliverables and Next Steps](#11-deliverables-and-next-steps)

---

## 1. Current Active Architecture

### 1.1 Overview

> **Terminology note:** this document may describe historical/current-code `CUSTOMER` /
> `SERVICE_RECIPIENT` naming. The canonical target terminology is defined in
> `docs/LOMEA_ROLE_TERMINOLOGY.md`: `CUSTOMER` maps to `SERVICE_BOOKER`, while
> `SERVICE_RECIPIENT` is the booking recipient identity, not the replacement for `CUSTOMER`.

The Lomea platform currently has **three main user roles** with different levels of workspace maturity:

- **SERVICE_PROVIDER**: Fully implemented workspace with dedicated layout and routing
- **CUSTOMER**: Partial implementation using shared AppLayout with single-page experience
- **ADMIN**: Partial implementation using shared AppLayout with section-based navigation

### 1.2 SERVICE_PROVIDER Role (Active Workspace)

**Status:** ✅ FULLY ACTIVE

**Component:** `client/src/features/service-provider/ServiceProviderWorkspace.jsx`

**Routing Entry Point:** `client/src/main.jsx:407-413`

**Architecture:**
- **Own Layout**: Does NOT use AppLayout - has dedicated workspace shell
- **Internal Routing**: State-based page navigation (`activePage` state)
- **Navigation Structure**: 9 pages total
  - Active: dashboard, business, services, service-groups, calendar, bookings, settings
  - Coming Soon: customers, reports
- **Sidebar**: Desktop sidebar with logo, nav items, approval status badge, logout button
- **Mobile Nav**: Bottom navigation bar with first 5 pages
- **Header**: Sticky header showing current page title and approval status badge
- **Status Management**: Fetches approval status on mount from `/api/service-provider/business/status`

**Active Pages:**
- `DashboardPage.jsx` - Overview stats and quick actions
- `BusinessProfilePage.jsx` - Business details management
- `ServicesPage.jsx` - Individual services CRUD
- `ServiceGroupsPage.jsx` - Service groups CRUD
- `CalendarPage.jsx` - Slot management and availability (Epic 2)
- `BookingsPage.jsx` - Booking list and status updates (Epic 2)
- `SettingsPage.jsx` - Workspace settings
- `ComingSoonPage.jsx` - Placeholder for customers and reports

### 1.3 CUSTOMER Role (Partial Implementation)

**Status:** ⚠️ PARTIAL - Uses AppLayout, not a dedicated workspace

**Component:** `client/src/features/customer/CustomerPage.jsx`

**Current Architecture:**
- **Layout**: Uses shared `AppLayout.jsx`
- **Navigation**: AppLayout sidebar with limited nav items
- **Structure**: Single-page component with multiple sections
  - LocationHeader
  - SearchFilters
  - SearchResults
  - BookingDialog (modal overlay)
- **State Management**: Uses custom hooks (`useSearchData`, `useBooking`)
- **Main Flow**: Search → Filter → Book

**Limitations:**
- No dedicated workspace structure
- No internal page navigation
- No bookings history view
- No profile management
- Limited to single-page experience

### 1.4 ADMIN Role (Partial Implementation)

**Status:** ⚠️ PARTIAL - Uses AppLayout, section-based navigation

**Component:** `client/src/pages/AdminPage.jsx`

**Current Architecture:**
- **Layout**: Uses shared `AppLayout.jsx`
- **Navigation**: Section toggle buttons (dashboard, users)
- **Structure**: Conditional rendering based on `activeSection` state
- **Components**:
  - Dashboard section with KPI cards
  - Users section renders `UsersPage` component
  - Inline category management form
  - Pending businesses approval table

**Limitations:**
- No dedicated workspace structure
- Limited navigation (only 2 sections)
- Mixed responsibilities (dashboard + inline CRUD)
- No dedicated pages for categories, businesses, fields, professions
- No reports or analytics pages


---

## 2. ServiceProviderWorkspace as Reference Pattern

### 2.1 What Makes ServiceProviderWorkspace Work

**Key Design Decisions:**

1. **Self-Contained Workspace Shell**
   - Does NOT rely on external layouts
   - Complete control over navigation, header, sidebar
   - Own mobile responsive design

2. **State-Based Internal Routing**
   - `activePage` state controls which page renders
   - Navigation items defined as config array
   - Easy to add/disable pages

3. **Role-Specific Header**
   - Displays current page title
   - Shows approval status badge
   - Sticky positioning for persistent context

4. **Progressive Feature Rollout**
   - `active: true/false` flag per navigation item
   - Disabled items render `ComingSoonPage`
   - Clear visual feedback for unavailable features

### 2.2 What Should Be Shared Across All Workspaces

**Shared Elements:**

1. **Workspace Shell Structure**
   - Sidebar with logo, nav, footer
   - Main content area with header
   - Mobile bottom navigation
   - Responsive breakpoints

2. **Navigation Config Pattern**
   - Array of navigation items with id, label, icon, active flag
   - Conditional rendering based on active status
   - ComingSoonPage for disabled features

3. **Status Badge System**
   - Consistent badge styling
   - Role-appropriate status indicators
   - Header placement

**Role-Specific Elements:**

1. **Navigation Items** - Each role has different pages
2. **Header Content** - Different status badges per role
3. **Page Components** - Completely different pages per role
4. **API Integration** - Role-specific endpoints

### 2.3 Proposed Abstraction: WorkspaceShell

**Component Name:** `WorkspaceShell.jsx`

**Props:**
```javascript
{
  user: object,              // Current user with role
  activePage: string,        // Current page ID
  onNavigate: function,      // Navigate to page ID
  navigationItems: array,    // Nav config array
  headerContent: node,       // Optional extra header content (badges, actions)
  onLogout: function,        // Logout handler
  children: node             // Page content
}
```

**Responsibilities:**
- Render sidebar with logo, nav items, user info, logout
- Render header with page title and optional content
- Render main content area with children
- Render mobile bottom nav
- Handle responsive layout

---

## 3. CustomerWorkspace Specification

### 3.1 Goals and Rationale

**Why Upgrade CUSTOMER to Workspace Pattern?**

1. **Consistency**: All roles should have similar UX patterns
2. **Scalability**: Easy to add new customer features (history, profile, favorites)
3. **Navigation**: Clear separation between search, bookings, profile
4. **Mobile UX**: Better mobile navigation with bottom bar
5. **Future Features**: Easier to add favorites, reviews, notifications

### 3.2 Navigation Structure

**Proposed Pages:**

```javascript
[
  { id: 'search', label: 'חיפוש תורים', icon: '🔍', active: true },
  { id: 'my-bookings', label: 'התורים שלי', icon: '📅', active: true },
  { id: 'favorites', label: 'מועדפים', icon: '⭐', active: false },
  { id: 'history', label: 'היסטוריה', icon: '📜', active: false },
  { id: 'profile', label: 'הפרופיל שלי', icon: '👤', active: true }
]
```

### 3.3 Page Specifications

#### 3.3.1 Search Page (search)

**Purpose:** Find and book available appointment slots

**Reuse Existing Components:**
- `LocationHeader` - Location selection
- `SearchFilters` - Category, city, date filters
- `SearchResults` - Slot cards with booking button
- `BookingDialog` - Booking creation modal

**Data Sources:**
- `/slots` - Available slots (existing endpoint)
- `/categories` - Category filter options
- `/api/addresses` - Location autocomplete

**State Management:**
- Use existing `useSearchData` hook
- Use existing `useBooking` hook

#### 3.3.2 My Bookings Page (my-bookings)

**Purpose:** View and manage customer's bookings

**New Component:** `client/src/features/customer/pages/MyBookingsPage.jsx`

**Data Source:**
- New endpoint: `GET /api/customer/bookings/my-bookings`
- Returns: Customer's bookings with slot, service, business details

**Filters:**
- Status: All, Confirmed, Cancelled, Completed
- Date: Upcoming, Past, This Week, This Month

**Actions:**
- Cancel booking → Confirm modal → API call → Refresh list
- View details → Expand card inline or modal

**Backend Requirements:**
- New route: `GET /api/customer/bookings/my-bookings`
  - Query params: `?status=CONFIRMED&timeframe=upcoming`
  - Each booking includes: slot, service, business details

- New route: `PATCH /api/customer/bookings/:id/cancel`
  - Body: `{ reason: string }`
  - Updates booking status to CANCELLED

#### 3.3.3 Profile Page (profile)

**Purpose:** Manage customer account details

**New Component:** `client/src/features/customer/pages/ProfilePage.jsx`

**Form Fields:**
- Full Name (editable)
- Phone (read-only)
- Email (editable, optional)

**Actions:**
- Save profile → Validate → API call
- Change password → Modal with old/new password fields
- Delete account → Confirmation modal

**Backend Requirements:**
- Existing route: `PATCH /users/me`
- New route: `POST /users/me/change-password`
- New route: `DELETE /users/me`


---

## 4. AdminWorkspace Specification

### 4.1 Goals and Rationale

**Why Upgrade ADMIN to Workspace Pattern?**

1. **Scalability**: Admin panel needs many more features
2. **Organization**: Current AdminPage mixes dashboard + inline CRUD
3. **Consistency**: All roles follow same workspace pattern
4. **Navigation**: Clear separation of concerns
5. **Future Growth**: Analytics, logs, configuration, support tools

### 4.2 Navigation Structure

**Proposed Pages:**

```javascript
[
  { id: 'dashboard', label: 'לוח בקרה', icon: '📊', active: true },
  { id: 'users', label: 'משתמשים', icon: '👥', active: true },
  { id: 'businesses', label: 'עסקים', icon: '🏢', active: true },
  { id: 'categories', label: 'קטגוריות', icon: '🏷️', active: true },
  { id: 'fields', label: 'תחומים', icon: '📚', active: true },
  { id: 'professions', label: 'מקצועות', icon: '💼', active: true },
  { id: 'service-templates', label: 'תבניות שירות', icon: '📝', active: true },
  { id: 'documents', label: 'מסמכים', icon: '📄', active: true },
  { id: 'legal', label: 'תקנון ותנאים', icon: '⚖️', active: true },
  { id: 'reports', label: 'דוחות', icon: '📈', active: false },
  { id: 'logs', label: 'לוגים', icon: '📋', active: false },
  { id: 'settings', label: 'הגדרות מערכת', icon: '⚙️', active: true }
]
```

### 4.3 Page Specifications Summary

**Phase 1 Pages (Must Have):**

1. **Dashboard** - System KPIs and quick actions (migrate from AdminPage)
2. **Users** - User management (existing UsersPage component)
3. **Businesses** - Business approval workflow (migrate from AdminPage)
4. **Categories** - Category CRUD (migrate from AdminPage inline form)
5. **Fields** - Field management (new dedicated page)
6. **Professions** - Profession management (new dedicated page)
7. **Service Templates** - Template management (new dedicated page)
8. **Documents** - Document types configuration (new dedicated page)
9. **Legal** - Legal texts editor (new dedicated page)
10. **Settings** - System-wide configuration (new dedicated page)

**Phase 2 Pages (Nice to Have):**
- Reports - Analytics and reporting
- Logs - System logs and audit trail

**Key Migration Notes:**
- Move pending businesses table from AdminPage to BusinessesPage
- Move category form from AdminPage to CategoriesPage (as modal)
- Keep existing UsersPage component as-is
- All existing API endpoints work without changes

---

## 5. Unified Workspace Architecture Proposal

### 5.1 Proposed File Structure

```
client/src/
├── layouts/
│   ├── AppLayout.jsx (LEGACY - keep for backward compat)
│   └── WorkspaceShell.jsx (NEW - shared workspace layout)
│
├── features/
│   ├── service-provider/
│   │   ├── ServiceProviderWorkspace.jsx (REFACTOR to use WorkspaceShell)
│   │   └── pages/ (existing pages)
│   │
│   ├── customer/
│   │   ├── CustomerWorkspace.jsx (NEW)
│   │   ├── CustomerPage.jsx (LEGACY - keep temporarily)
│   │   └── pages/
│   │       ├── SearchPage.jsx (NEW - migrate from CustomerPage)
│   │       ├── MyBookingsPage.jsx (NEW)
│   │       └── ProfilePage.jsx (NEW)
│   │
│   └── admin/
│       ├── AdminWorkspace.jsx (NEW)
│       ├── AdminPage.jsx (LEGACY - keep temporarily)
│       └── pages/
│           ├── DashboardPage.jsx (NEW - migrate from AdminPage)
│           ├── UsersPage.jsx (EXISTS - keep)
│           ├── BusinessesPage.jsx (NEW)
│           ├── CategoriesPage.jsx (NEW)
│           ├── FieldsPage.jsx (NEW)
│           ├── ProfessionsPage.jsx (NEW)
│           ├── ServiceTemplatesPage.jsx (NEW)
│           ├── DocumentsPage.jsx (NEW)
│           ├── LegalPage.jsx (NEW)
│           └── SettingsPage.jsx (NEW)
│
└── components/
    └── workspace/
        └── ComingSoonPage.jsx (MOVE - shared by all workspaces)
```

### 5.2 WorkspaceShell Component Specification

**File:** `client/src/layouts/WorkspaceShell.jsx`

**Responsibilities:**
1. Render desktop sidebar with logo, nav items, user info, logout
2. Render sticky header with page title and optional content
3. Render main content area (scrollable)
4. Render mobile bottom navigation
5. Handle responsive breakpoints

**Example Usage:**
```javascript
<WorkspaceShell
  user={user}
  activePage={activePage}
  onNavigate={setActivePage}
  navigationItems={navigationItems}
  headerContent={<StatusBadge />}
  onLogout={logout}
>
  {renderPage()}
</WorkspaceShell>
```

### 5.3 Routing in main.jsx

**Updated Structure:**

```javascript
// No user → Auth page
if (!user) return <AuthPage />;

// Role-based workspaces (NO AppLayout wrapper)
if (user.role === 'SERVICE_PROVIDER') {
  return <ServiceProviderWorkspace user={user} onLogout={logout} />;
}

if (user.role === 'CUSTOMER') {
  return <CustomerWorkspace user={user} onLogout={logout} />;
}

if (user.role === 'ADMIN') {
  return <AdminWorkspace user={user} onLogout={logout} />;
}

// Legacy roles - keep using AppLayout temporarily
if (user.role === 'BUSINESS' || user.role === 'CRM') {
  return <AppLayout ...>{/* Legacy pages */}</AppLayout>;
}
```

**Key Changes:**
- Remove `view` state (each workspace manages own `activePage`)
- Each workspace is fully self-contained
- No AppLayout wrapper for new workspaces


---

## 6. Data Model Review and Required Adaptations

### 6.1 Current Schema Status

**Relevant Models:** User, Booking, Business, Category, Slot

**Key Enums:**
- UserRole: CUSTOMER, BUSINESS (legacy), ADMIN, SERVICE_PROVIDER (active), SERVICE_RECIPIENT (legacy), CRM (legacy)
- BookingStatus: CONFIRMED, CANCELLED, COMPLETED, NO_SHOW
- BusinessStatus: ACTIVE, INACTIVE, SUSPENDED, PENDING_APPROVAL
- BusinessApprovalStatus: DRAFT, PENDING_APPROVAL, APPROVED, REJECTED

### 6.2 CustomerWorkspace Data Requirements

**No Schema Changes Needed**

**Required New API Endpoints:**

1. `GET /api/customer/bookings/my-bookings`
   - Query params: `?status=CONFIRMED&timeframe=upcoming`
   - Returns: Bookings with full slot, service, business details

2. `PATCH /api/customer/bookings/:id/cancel`
   - Permission: Only customer's own bookings
   - Updates: `status = CANCELLED`

3. `POST /users/me/change-password`
   - Validates old password, updates to new password

4. `DELETE /users/me`
   - Soft or hard delete user account
   - Constraint: Cannot delete if has confirmed future bookings

### 6.3 AdminWorkspace Data Requirements

**Minor Schema Enhancements (Optional):**

1. **SystemSettings Table (NEW - Optional)**
```prisma
model SystemSettings {
  id                        Int      @id @default(autoincrement())
  platformName              String   @default("Lomea")
  supportEmail              String?
  supportPhone              String?
  defaultBookingDuration    Int      @default(60)
  maxAdvanceBookingDays     Int      @default(90)
  cancellationDeadlineHours Int      @default(24)
  autoApproveBusinesses     Boolean  @default(false)
  requireDocumentUpload     Boolean  @default(true)
  updatedAt                 DateTime @updatedAt
}
```

**Required New API Endpoints (Optional):**
- `GET /api/admin/settings`
- `PUT /api/admin/settings`

**Recommendation:** Implement workspaces with existing schema first, add enhancements later if needed.

---

## 7. API Contract Review

### 7.1 API Prefix Inconsistency

**Current State:**
- Legacy routes WITHOUT `/api` prefix: `/auth`, `/users`, `/categories`, `/businesses`, etc.
- New routes WITH `/api` prefix: `/api/admin/*`, `/api/service-provider/*`, `/api/customer/*`

**Recommendation:** All new routes use `/api` prefix for consistency

### 7.2 Required New Endpoints

**For CustomerWorkspace:**
1. `GET /api/customer/bookings/my-bookings` - Get customer's bookings
2. `PATCH /api/customer/bookings/:id/cancel` - Cancel booking
3. `POST /users/me/change-password` - Change password
4. `DELETE /users/me` - Delete account

**For AdminWorkspace (Optional):**
1. `GET /api/admin/settings` - Get system settings
2. `PUT /api/admin/settings` - Update system settings

### 7.3 Role-Based API Access

**CUSTOMER Role:**
- `/api/customer/bookings/my-bookings` (NEW)
- `/api/customer/bookings/:id/cancel` (NEW)
- `/users/me` (existing)
- `/slots` (existing - public)
- `/categories` (existing - public)
- `/bookings` (existing - create)

**SERVICE_PROVIDER Role:**
- All `/api/service-provider/*` routes (existing)
- `/users/me` (existing)

**ADMIN Role:**
- All `/api/admin/*` routes (existing + new)
- All `/admin/*` routes (legacy)
- Full system access

---

## 8. Permission Matrix

### 8.1 Key Access Rules

| Resource | CUSTOMER | SERVICE_PROVIDER | ADMIN |
|----------|----------|------------------|-------|
| View own profile | ✅ | ✅ | ✅ |
| Edit own profile | ✅ | ✅ | ✅ |
| View all users | ❌ | ❌ | ✅ |
| View own bookings | ✅ | ❌ | ✅ |
| Cancel own booking | ✅ | ❌ | ✅ |
| View business bookings | ❌ | ✅ | ✅ |
| Update booking status | ❌ | ✅ | ✅ |
| Approve businesses | ❌ | ❌ | ✅ |
| Manage categories | ❌ | ❌ | ✅ |
| Manage system | ❌ | ❌ | ✅ |

### 8.2 Middleware Pattern

**Current:** `requireAuth`, `requireRole(['ADMIN'])`

**Proposed Addition:**
```javascript
function requireOwnership(Model, userIdField = 'userId') {
  return async (req, res, next) => {
    const resource = await Model.findUnique({ 
      where: { id: parseInt(req.params.id) } 
    });
    
    if (!resource || resource[userIdField] !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    req.resource = resource;
    next();
  };
}
```

**Example:**
```javascript
router.patch(
  '/bookings/:id/cancel',
  requireAuth,
  requireRole(['CUSTOMER']),
  requireOwnership(Booking, 'userId'),
  cancelBooking
);
```

---

## 9. UI/UX Consistency Plan

### 9.1 Shared Design System

**Color Palette:** Use existing CSS variables
- Primary: `var(--primary-600)`
- Success: `var(--success-600)`
- Danger: `var(--danger-600)`
- Warning: `var(--warning-600)`

**Typography:** Use existing text sizes
- Headings: `var(--text-xl)`, `var(--text-2xl)`
- Body: `var(--text-base)`
- Small: `var(--text-sm)`

**Spacing:** Use existing space scale
- `var(--space-1)` to `var(--space-12)`

### 9.2 Component Library

**Reuse Existing:**
- Cards: `.card`, `.card-header`, `.kpi-card`
- Buttons: `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-sm`
- Forms: `.form-group`, `.form-label`, inputs
- Tables: `.table-container`, table elements
- Badges: `.badge`, `.badge-primary`, `.badge-success`, etc.
- Grids: `.grid`, `.grid-2`, `.grid-3`, `.grid-4`
- Empty states: `.empty-state` components
- Toasts: `.toast`, `.toast-success`, `.toast-error`

### 9.3 Mobile Responsiveness

**Breakpoints:**
- Desktop: > 768px (show sidebar, hide mobile nav)
- Mobile: <= 768px (hide sidebar, show mobile nav)

**Mobile Adaptations:**
- Stack grid columns
- Reduce spacing
- Scroll tables horizontally
- Full-width buttons

### 9.4 RTL Support

**All new components must:**
- Use logical CSS properties when possible
- Test with RTL layout
- Use Hebrew labels

### 9.5 Accessibility

**Required Standards:**
- Semantic HTML (`<button>`, `<nav>`, `<main>`, `<aside>`)
- Keyboard navigation (all interactive elements accessible)
- ARIA labels (icon-only buttons, status messages)
- Color contrast (WCAG AA standards)
- Form validation (clear error messages)


---

## 10. Migration / Implementation Plan

### 10.1 Implementation Phases

**Phase 0: Stabilize Active ServiceProviderWorkspace** ⚠️ CRITICAL BLOCKER
- **Priority:** MUST complete before any workspace refactoring
- **Blockers Identified:**
  1. BookingsPage.jsx API routes mismatch (lines 54, 69)
  2. Approval status stuck loading ("טוען...")
  3. Unexpected token '<' errors in booking status updates
- **Required Actions:**
  1. Fix BookingsPage API endpoint calls
  2. Fix approval status loading behavior
  3. Browser verification required
- **Success Criteria:**
  - ✅ Approval status displays correctly (not stuck on "טוען...")
  - ✅ הזמנות page loads without errors
  - ✅ Changing booking status works and persists
  - ✅ No "Unexpected token '<'" errors
- **Duration:** 1-2 days
- **Status:** NOT STARTED - awaiting Phase 0 completion before proceeding

**Phase 1: WorkspaceShell Foundation**
- **Prerequisites:** Phase 0 must be complete and browser-verified
- Create `client/src/layouts/WorkspaceShell.jsx`
- Extract common workspace logic from ServiceProviderWorkspace
- Create reusable ComingSoonPage component
- Test WorkspaceShell in isolation
- Duration: 2-3 days

**Phase 2: Refactor ServiceProviderWorkspace**
- **Prerequisites:** Phase 0 complete, Phase 1 complete
- **Risk Level:** HIGH - affects active production workspace
- Refactor ServiceProviderWorkspace to use WorkspaceShell
- Ensure no regressions (visual + functional testing)
- Feature flag: `const useWorkspaceShell = true` with easy rollback
- Commit: "refactor: migrate ServiceProviderWorkspace to use WorkspaceShell"
- Duration: 1-2 days

**Phase 3: CustomerWorkspace Implementation**
- **Prerequisites:** Phase 2 complete and verified stable
- Create CustomerWorkspace component
- Create pages: SearchPage, MyBookingsPage, ProfilePage
- Create backend routes:
  - `GET /api/customer/bookings/my-bookings`
  - `PATCH /api/customer/bookings/:id/cancel`
  - `POST /users/me/change-password`
  - ~~`DELETE /users/me`~~ (REMOVED per stakeholder decision #1)
- Add feature flag in main.jsx
- Test all pages
- Commit: "feat: implement CustomerWorkspace"
- Duration: 5-7 days

**Phase 4: AdminWorkspace Implementation**
- **Prerequisites:** Phase 3 complete
- **Scope Reduced:** Remove Settings page (per stakeholder decision #2)
- Create AdminWorkspace component
- Create 9 page components (dashboard, users, businesses, categories, fields, professions, service-templates, documents, legal)
- ~~Create backend routes for settings~~ (REMOVED - defer to Phase 2+)
- Add feature flag in main.jsx
- Test all pages
- Commit: "feat: implement AdminWorkspace"
- Duration: 8-12 days (reduced from 10-14)

**Phase 5: Cleanup and Documentation**
- Remove feature flags
- Mark AppLayout as legacy
- Update documentation
- Commit: "docs: update documentation for workspace architecture"
- Duration: 1-2 days

**Phase 6: Testing and QA**
- Full regression testing (all roles)
- Mobile testing (verify "עוד" button pattern per decision #3)
- Accessibility audit (Hebrew RTL, WCAG AA)
- Performance testing
- Browser testing
- Fix bugs
- Duration: 3-5 days

**Phase 7: Production Deployment**
- Merge to develop → staging → main → production
- Monitor logs
- Duration: 1 day

### 10.2 Timeline Estimate

**Total: 24-36 days (5-7 weeks)** assuming 1 full-time developer

**Updated with Phase 0:**
- Phase 0: 1-2 days (stabilize current workspace - CRITICAL)
- Phase 1: 2-3 days (WorkspaceShell foundation)
- Phase 2: 1-2 days (refactor ServiceProviderWorkspace)
- Phase 3: 5-7 days (CustomerWorkspace)
- Phase 4: 8-12 days (AdminWorkspace - scope reduced)
- Phase 5: 1-2 days (cleanup)
- Phase 6: 3-5 days (QA)
- Phase 7: 1 day (deployment)

**Critical Path:**
1. **Phase 0 MUST complete first** - no workspace work until current blockers fixed and browser-verified
2. WorkspaceShell must be complete before ServiceProviderWorkspace refactoring
3. Backend endpoints must be complete before frontend pages
4. Testing must be complete before deployment

### 10.3 Rollback Strategy

**If issues found during Phase 0:**
- Revert any bug fix attempts
- Document blocker for deeper investigation
- Do NOT proceed to Phase 1 until verified stable

**If issues found during Phase 2:**
- Revert feature flag: `const useWorkspaceShell = false;`
- ServiceProviderWorkspace continues using original layout
- Fix issues in separate branch

**If issues found during Phase 3-4:**
- Revert feature flag: `const useCustomerWorkspace = false;` or `const useAdminWorkspace = false;`
- System continues using legacy pages
- Fix issues in separate branch

**If issues found after Phase 5:**
- Revert entire commit
- Deploy previous version
- Fix issues offline

### 10.4 Risk Assessment

**High Risk:**
- Breaking existing SERVICE_PROVIDER workspace
  - Mitigation: Extensive testing, feature flag

**Medium Risk:**
- Breaking CUSTOMER search/booking flow
  - Mitigation: Keep CustomerPage as fallback
- Breaking ADMIN approvals
  - Mitigation: Keep AdminPage as fallback

**Low Risk:**
- New pages (no existing equivalent)
  - Mitigation: Additive changes only

**Performance Risk:**
- Increased bundle size
  - Mitigation: Code splitting, lazy load pages

---

## 11. Deliverables and Next Steps

### 11.1 Deliverables from This Specification

✅ **docs/ROLE_BASED_WORKSPACES_SPEC.md** (this document)
- Comprehensive product and technical specification
- All 11 required sections completed
- Ready for stakeholder review

### 11.2 Pending Deliverables

**Documentation:**
- API documentation for new endpoints
- Component documentation for WorkspaceShell
- Testing documentation
- User documentation

**Code:**
- WorkspaceShell component + styles
- CustomerWorkspace + pages
- AdminWorkspace + pages
- Backend routes and controllers
- Tests (unit, integration, E2E)

### 11.3 Stakeholder Decisions ✅ APPROVED

1. **Customer Account Deletion**
   - **Decision:** Not Phase 1. Customers should not self-delete accounts in MVP.
   - **Future:** Customer may request account deletion through support.
   - **Data Retention:** Booking history preserved for operational/legal/accounting reasons, with anonymization considered later if needed.
   - **Action:** Remove `DELETE /users/me` endpoint from Phase 3 scope.

2. **Admin Settings**
   - **Decision:** Not Phase 1. Critical system settings remain in env/code.
   - **Rationale:** Secrets, integrations, infrastructure configuration should not be in UI.
   - **Future:** Admin UI may manage only safe product settings (e.g., platform name, support contacts).
   - **Action:** Defer SystemSettings table and settings page to Phase 2+.

3. **Mobile Navigation**
   - **Decision:** Top 5 primary items + "עוד" (More) button.
   - **Rationale:** Do not show all workspace pages directly in mobile navigation.
   - **Implementation:** First 5 nav items in bottom bar, remaining pages accessible via "עוד" menu.

4. **Favorites Feature**
   - **Decision:** Defer to Phase 2.
   - **Rationale:** Not needed for MVP workspace launch.
   - **Action:** Keep in CustomerWorkspace nav as `active: false`.

5. **Reports Feature**
   - **Decision:** Defer advanced reports.
   - **Rationale:** Admin Phase 1 uses only basic dashboard metrics. Detailed reports defined later based on real business needs.
   - **Action:** Keep reports page as `active: false` in AdminWorkspace nav.

6. **Notifications**
   - **Decision:** Not Phase 1. No in-app notification system yet.
   - **Action:** Do not add bell icon. No notification infrastructure in workspace headers.

7. **Dark Mode**
   - **Decision:** Not required. Do not implement dark mode.
   - **Focus:** Hebrew RTL, mobile responsiveness, consistency, and stability.

### 11.4 Recommended Next Steps

**Immediate (This Week):**
1. ✅ Complete this specification document
2. ✅ Review specification with stakeholders
3. ✅ Answer open questions (7 stakeholder decisions recorded)
4. ✅ Approve specification with Phase 0 blocker requirement

**Next (Immediate Priority):**
1. **Begin Phase 0:** Fix ServiceProviderWorkspace blockers
   - Fix BookingsPage.jsx API routes (lines 54, 69)
   - Fix approval status loading behavior
   - Browser verification required before proceeding
2. Do NOT start Phase 1 until Phase 0 is browser-verified

**After Phase 0 Complete:**
1. Create GitHub issues for Phase 1-7
2. Assign issues to developer(s)
3. Set up project board
4. Begin Phase 1: WorkspaceShell implementation

**Before Starting Phase 1:**
1. Set up testing framework (Jest + React Testing Library)
2. Set up CI/CD pipeline
3. Create feature branch: `feature/role-based-workspaces`

### 11.5 Success Criteria

**This project will be successful when:**

✅ All three roles use consistent workspace pattern

✅ No regressions in existing functionality

✅ All new pages work as specified

✅ Mobile responsive design works

✅ Performance meets/exceeds current metrics

✅ Accessibility standards met (WCAG AA)

✅ All tests passing

✅ Code review approved

✅ QA testing passed

✅ Deployed to production without critical bugs

### 11.6 Post-Implementation Tasks

**After deployment:**
- Gather user feedback
- Monitor error logs
- Measure performance metrics
- Measure user engagement
- Plan Phase 2 features
- Conduct retrospective

---

## Appendix A: Files Inspected

1. `docs/AI_AGENT_WORKFLOW.md`
2. `docs/CODEBASE_AUDIT.md`
3. `docs/LOMEA_ARCHITECTURE_RULES_DRAFT.md`
4. `client/src/main.jsx`
5. `client/src/features/service-provider/ServiceProviderWorkspace.jsx`
6. `client/src/features/customer/CustomerPage.jsx`
7. `client/src/pages/AdminPage.jsx`
8. `client/src/layouts/AppLayout.jsx`
9. `server/src/app.js`
10. `server/prisma/schema.prisma` (referenced from audit)

---

## Appendix B: Terminology Glossary

**Workspace:** Self-contained area for a role with own navigation and layout

**WorkspaceShell:** Reusable layout component for workspaces

**Navigation Item:** Config object: `{ id, label, icon, active }`

**Active Page:** Current page in workspace (`activePage` state)

**Role:** User role determining workspace (ADMIN, SERVICE_PROVIDER, CUSTOMER)

**Legacy Components:** Old components to be replaced (AppLayout, CustomerPage, AdminPage)

**Feature Flag:** Boolean to toggle old/new during migration

**RTL:** Right-to-Left layout for Hebrew

**Epic 2:** Project epic for booking engine and calendar

**Phase 1 Registration:** Onboarding via Field → Profession → ServiceTemplate

**Approval Status:** Business approval state (DRAFT, PENDING_APPROVAL, APPROVED, REJECTED)

---

## Appendix C: Related Documents

1. **docs/AI_AGENT_WORKFLOW.md** - Workflow rules
2. **docs/CODEBASE_AUDIT.md** - Codebase audit and inventory
3. **docs/LOMEA_ARCHITECTURE_RULES_DRAFT.md** - Architectural principles

---

**End of Specification**

---

**Document Status:** ✅ APPROVED - Phase 0 Required Before Implementation
**Next Action:** Begin Phase 0 - Fix ServiceProviderWorkspace blockers
**Created:** 2026-07-06
**Last Updated:** 2026-07-06 (Stakeholder decisions and Phase 0 added)
