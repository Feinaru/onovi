# Frontend Refactoring Plan

## Objective
Refactor the React frontend into a scalable feature-based architecture with no page component exceeding 250 lines.

## Current State Analysis

### File Sizes (Lines of Code)
**Pages:**
- ❌ BusinessPage.jsx: **958 lines** (target: <250)
- ❌ CustomerPage.jsx: **659 lines** (target: <250)
- ✅ AdminPage.jsx: 365 lines (needs minor refactoring)
- ✅ CRMPage.jsx: 129 lines (OK)
- ✅ LandingPage.jsx: 126 lines (OK)

**Components:**
- ❌ LeadDetailsView.jsx: **1129 lines** (target: <250)
- ❌ BusinessAddressForm.jsx: **662 lines** (target: <250)
- ⚠️ LocationSelector.jsx: 411 lines (could be split)
- ⚠️ WorkQueue.jsx: 292 lines (borderline)
- ⚠️ LiveAvailability.jsx: 283 lines (borderline)
- ⚠️ CreateLeadForm.jsx: 279 lines (borderline)
- ⚠️ OpenStreetMapView.jsx: 272 lines (borderline)
- ✅ Other components: <250 lines (OK)

**Main App:**
- ✅ main.jsx: 232→128 lines (REFACTORED)

## Completed Refactoring

### ✅ Phase 1: Architecture & Layouts (DONE)

1. **Created Feature-Based Folder Structure:**
```
src/
├── layouts/           # Layout components
├── features/          # Feature modules
├── shared/            # Shared utilities
│   ├── ui/           # Reusable UI components
│   ├── hooks/        # Custom hooks
│   └── utils/        # Utility functions
├── components/        # Legacy components (to be migrated)
├── pages/            # Page components
└── services/         # API services
```

2. **Created Layout Components:**
- `layouts/AppLayout.jsx` - Authenticated user layout with sidebar
- `layouts/PublicLayout.jsx` - Public layout for landing/auth

3. **Created Shared UI Components:**
- `shared/ui/Toast.jsx` - Global notifications
- `shared/ui/UnauthorizedAccess.jsx` - Permission denied view

4. **Created Navigation Utilities:**
- `shared/hooks/useNavigation.js` - Navigation logic extraction

5. **Refactored main.jsx:**
- **Before:** 232 lines
- **After:** 128 lines ✅
- Extracted layouts, UI components, and navigation logic
- Cleaner, more maintainable structure

## Refactoring Strategy

### Phase 2: BusinessPage (958 lines)

**Current Structure:**
- 5 tabs: dashboard, services, slots, bookings, settings
- Multiple CRUD operations
- Complex state management

**Refactoring Approach:**
Create `features/business/` with:

1. **Main Page (< 250 lines):**
```
features/business/BusinessPage.jsx
```
- Tab navigation
- Shared state and data loading
- Delegates to tab components

2. **Tab Components (each < 250 lines):**
```
features/business/tabs/
├── DashboardTab.jsx      # Business overview
├── ServicesTab.jsx       # Service management
├── SlotsTab.jsx          # Slot management
├── BookingsTab.jsx       # Booking management
└── SettingsTab.jsx       # Business settings
```

3. **Shared Components:**
```
features/business/components/
├── BusinessForm.jsx      # Create/edit business
├── ServiceForm.jsx       # Create/edit service
├── SlotForm.jsx          # Create/edit slot
└── BusinessStats.jsx     # Dashboard statistics
```

4. **Custom Hooks:**
```
features/business/hooks/
├── useBusinessData.js    # Data fetching and management
├── useBusinessForms.js   # Form state management
└── useBookingActions.js  # Booking operations
```

**Expected Result:**
- BusinessPage.jsx: ~180 lines (main container + routing)
- Each tab: 100-200 lines
- Each form: 80-150 lines

### Phase 3: CustomerPage (659 lines)

**Current Structure:**
- Location selection
- Business search and filtering
- Service browsing
- Booking flow

**Refactoring Approach:**
Create `features/customer/` with:

1. **Main Page (< 250 lines):**
```
features/customer/CustomerPage.jsx
```

2. **View Components:**
```
features/customer/views/
├── LocationView.jsx      # Location selection
├── BusinessListView.jsx  # Browse businesses
├── BusinessDetailView.jsx # Business + services
└── BookingView.jsx       # Booking confirmation
```

3. **Shared Components:**
```
features/customer/components/
├── BusinessCard.jsx
├── ServiceList.jsx
├── BookingForm.jsx
└── SearchFilters.jsx
```

4. **Custom Hooks:**
```
features/customer/hooks/
├── useLocation.js
├── useBusinessSearch.js
└── useBooking.js
```

### Phase 4: Large Components

#### LeadDetailsView.jsx (1129 lines)

**Refactoring:**
Create `features/crm/lead-details/`:

```
LeadDetailsView.jsx (< 250 lines) - Main container
components/
├── LeadHeader.jsx        # Basic info
├── LeadTimeline.jsx      # Activity timeline
├── LeadNotes.jsx         # Notes section
├── LeadActions.jsx       # Action buttons
└── LeadForms.jsx         # Edit forms
hooks/
├── useLeadData.js
├── useTimelineEvents.js
└── useLeadActions.js
```

#### BusinessAddressForm.jsx (662 lines)

**Refactoring:**
Create `features/business/address/`:

```
BusinessAddressForm.jsx (< 250 lines) - Main form
components/
├── AddressFields.jsx     # Address input fields
├── MapSelector.jsx       # Map interaction
└── AddressPreview.jsx    # Preview/summary
hooks/
├── useAddressSearch.js
├── useAddressValidation.js
└── useMapInteraction.js
```

### Phase 5: Medium-Sized Components

For components 250-400 lines, apply similar splitting:

- **LocationSelector.jsx (411 lines)** → Split into:
  - LocationSelector.jsx (main)
  - GPSSelector.jsx
  - ManualAddressSelector.jsx

- **WorkQueue.jsx (292 lines)** → Split into:
  - WorkQueue.jsx (main)
  - QueueFilters.jsx
  - QueueItem.jsx

- **LiveAvailability.jsx (283 lines)** → Split into:
  - LiveAvailability.jsx (main)
  - AvailabilityCalendar.jsx
  - TimeSlotPicker.jsx

## Migration Guidelines

### DO:
✅ Extract layout and UI components first
✅ Create custom hooks for complex logic
✅ Break pages into logical feature modules
✅ Keep components focused on single responsibility
✅ Maintain all existing functionality
✅ Preserve all API calls unchanged
✅ Keep styling classes identical

### DON'T:
❌ Change business logic
❌ Modify API calls or responses
❌ Alter user-facing functionality
❌ Break existing features
❌ Change component behavior
❌ Modify data flow logic

## Testing Checklist

After refactoring each component:
- [ ] Component renders without errors
- [ ] All functionality works as before
- [ ] Forms submit correctly
- [ ] API calls execute properly
- [ ] Navigation works
- [ ] State management intact
- [ ] Styling preserved
- [ ] No console errors
- [ ] Build succeeds

## Benefits of New Architecture

### Scalability
- Easy to add new features
- Clear separation of concerns
- Reusable components across features

### Maintainability
- Smaller, focused files (<250 lines)
- Easier to understand and modify
- Clear folder structure

### Developer Experience
- Faster to locate code
- Less merge conflicts
- Better code organization

### Performance
- Easier to implement code splitting
- Better tree-shaking opportunities
- Lazy loading of features

## Progress Tracking

### Completed ✅
- [x] Feature-based folder structure
- [x] Layout components (AppLayout, PublicLayout)
- [x] Shared UI components (Toast, UnauthorizedAccess)
- [x] Navigation utilities
- [x] main.jsx refactoring (232 → 128 lines)

### In Progress 🔄
- [ ] BusinessPage refactoring (958 lines)
- [ ] CustomerPage refactoring (659 lines)

### Pending ⏳
- [ ] LeadDetailsView refactoring (1129 lines)
- [ ] BusinessAddressForm refactoring (662 lines)
- [ ] AdminPage optimization (365 lines)
- [ ] Medium components (LocationSelector, WorkQueue, etc.)
- [ ] Final testing and validation

## Estimated Timeline

- Phase 1 (Architecture & Layouts): ✅ **COMPLETED**
- Phase 2 (BusinessPage): ~4-6 hours
- Phase 3 (CustomerPage): ~3-4 hours
- Phase 4 (Large Components): ~4-5 hours
- Phase 5 (Medium Components): ~3-4 hours
- Testing & Bug Fixes: ~2-3 hours

**Total Estimate:** 16-22 hours

## Next Steps

1. Complete BusinessPage refactoring
2. Create feature modules for customer
3. Break down LeadDetailsView
4. Refactor BusinessAddressForm
5. Optimize remaining components
6. Comprehensive testing
7. Update documentation

---

**Note:** This is a living document. Update as refactoring progresses.
