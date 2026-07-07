# Lomea AI Agent Workflow

**Mandatory rules for all AI/Codex tasks in this project.**

Last updated: 2026-07-05

---

## 1. Never claim UI is fixed without proof

A frontend change is **not complete** just because:

* ❌ Build passes
* ❌ A file was edited
* ❌ A component exists
* ❌ A route appears correct
* ❌ Tests pass

A frontend change is **complete only when**:

* ✅ The active browser UI shows the change
* ✅ The user can interact with it
* ✅ API calls succeed
* ✅ State updates correctly
* ✅ No console errors

---

## 2. Always identify the active route and active component

Before editing UI, verify:

* Which user role is logged in
* Which route/view is active
* Which layout is actually rendered
* Which component file is actually rendered
* Whether there are duplicate/legacy components with similar names

**Example:**
- ❌ Editing `BusinessPage.jsx` when SERVICE_PROVIDER uses `ServiceProviderWorkspace.jsx`
- ✅ Editing the component that is actually rendered for the active route

---

## 3. Proof-of-execution requirement

When UI changes do not appear, first **prove** that the running browser uses the code being edited.

### Required verification steps:

1. **Check dev server reloaded:**
   ```bash
   # Look for Vite hot-reload output:
   # "page reload client/src/..."
   ```

2. **Hard refresh browser:**
   - Mac: `Cmd + Shift + R`
   - Windows/Linux: `Ctrl + Shift + R`

3. **Add a debug banner if needed:**
   ```jsx
   <div style={{
     position: 'fixed',
     top: 0,
     left: 0,
     background: 'red',
     color: 'white',
     padding: '10px',
     zIndex: 9999
   }}>
     DEBUG: Code updated at {new Date().toISOString()}
   </div>
   ```

4. **Report proof:**
   - Frontend URL: `http://localhost:5173`
   - Backend URL: `http://localhost:3000`
   - Git branch: `develop`
   - Git HEAD hash: `9e81538`
   - Debug banner visible: YES/NO
   - Screenshot or description of what is visible in browser

**Do not continue feature work until this proof passes.**

---

## 4. Build is not QA

A successful build only proves **compilation**.

It does **not** prove:

* ❌ Routes are connected
* ❌ Props are correct
* ❌ API calls work
* ❌ Buttons fire handlers
* ❌ State updates
* ❌ User can complete the flow

**Build success = code compiles**
**Browser verification = feature works**

---

## 5. Browser / network / console QA is mandatory for UI work

For **every** frontend task, check:

### Browser Console
- No errors (red messages)
- No warnings that indicate broken functionality
- React DevTools shows expected component tree

### Network Tab
- Request URL is correct (`/api/...` not `/...`)
- Response status is 200/201 (not 404/500)
- Response content-type is `application/json` (not `text/html`)
- Request payload is correct

### UI Behavior
- Buttons are clickable
- Clicking buttons triggers expected actions
- State updates after API calls
- Success/error messages appear
- Lists refresh after create/update/delete

---

## 6. API JSON rule

**If the frontend expects JSON but receives HTML, STOP and fix the route/API mismatch.**

Common causes:

* Missing `/api` prefix in API call
* Extra `/api` prefix (double `/api/api/...`)
* Wrong backend port
* Vite fallback returning `index.html` for 404
* Auth redirect returning login page HTML
* Stale server (code not reloaded)
* Wrong token storage key (`'token'` vs `'onovi_token'`)

### This error is a BLOCKER, not a warning:

```
Unexpected token '<', "<!doctype "... is not valid JSON
```

**Required action:**
1. Open browser Network tab
2. Find the failing request
3. Check response Preview/Response tab
4. Identify why HTML was returned instead of JSON
5. Fix the root cause (URL, auth, route, etc.)

---

## 7. Active workspace rule

For Lomea, **SERVICE_PROVIDER users use the Service Provider Workspace**.

**Do not** implement provider UI only in old legacy `BusinessPage` components unless the active route actually uses them.

### Before editing:

1. Identify which component is actually rendered:
   - Check `main.jsx` routing
   - Check which layout wraps the component
   - Check if there are duplicate components with similar names

2. If there are duplicate components:
   - `SlotCard` vs `SlotCardV2`
   - `SlotsTab` vs `CalendarPage`
   - `BookingsTab` vs `BookingsPage`

   **Verify which one is imported and rendered by the active route.**

### Example:

```jsx
// main.jsx - SERVICE_PROVIDER route
{view === 'service-provider' && <ServiceProviderWorkspace />}

// ServiceProviderWorkspace.jsx
{activePage === 'calendar' && <CalendarPage />}

// Therefore, edit CalendarPage.jsx, NOT SlotsTab.jsx
```

---

## 8. Manual verification wording

**Do not say** "verified in browser" unless it was actually verified in the browser.

### Correct wording:

✅ "I have made code changes and the build passes. Please verify in the browser."
✅ "I verified in the browser: clicked the button, saw the success message, and the list refreshed."
✅ "I cannot verify in the browser. Here are the code changes and test results."

❌ "The UI is fixed." (without browser verification)
❌ "Verified." (ambiguous)
❌ "Should work now." (not verified)

---

## 9. Before commit

Before committing, run:

```bash
# Git status
git status

# Frontend build
cd client && npm run build

# Backend syntax check
cd ../server && node --check src/routes/booking.routes.js

# Relevant tests
npm test -- slotAvailability.test.js
node tests/smoke/test-sprint-c-api.js
node tests/smoke/test-sprint-c-concurrency.js

# Browser smoke test (manual)
# 1. Open browser
# 2. Hard refresh
# 3. Test the changed UI flow
# 4. Check console for errors
# 5. Check network for API calls
```

**Only commit if all checks pass.**

---

## 10. Before push

**Do not push until the user confirms the actual browser UI works.**

Even if:
- ✅ Code is committed
- ✅ Build passes
- ✅ Tests pass

**Wait for:**
- ✅ User browser verification
- ✅ User approval to push

---

## 11. The Five States of UI Code

Understand the difference:

### State 1: Code exists
- File is on disk
- Can be read with `cat` or editor
- **Does NOT mean** it's compiled, served, or executed

### State 2: Component is imported
- Import statement exists in another file
- **Does NOT mean** the component is rendered
- Component might be imported but never used

### State 3: Component is routed
- Route exists in routing config (e.g., `main.jsx`)
- **Does NOT mean** the route is active
- User might be on a different route

### State 4: Component is actually rendered
- `React.createElement` was called
- Component appears in React DevTools component tree
- **Does NOT mean** it's visible (could be `display:none`, off-screen, etc.)

### State 5: User can see and use it in the browser ✅
- Component is rendered
- Component is visible (not hidden/off-screen)
- Component is interactive (buttons work, state updates, API calls succeed)
- **This is the ONLY state that matters for claiming "UI is fixed"**

---

## 12. Debugging checklist when UI doesn't update

When code changes don't appear in the browser:

```
□ 1. Is the dev server running?
   cd client && npm run dev

□ 2. Did the dev server hot-reload after file save?
   Look for Vite console output: "page reload client/src/..."

□ 3. Did you hard-refresh the browser?
   Mac: Cmd+Shift+R | Windows: Ctrl+Shift+R

□ 4. Is browser cache cleared?
   Open DevTools → Network tab → check "Disable cache"

□ 5. Is the correct URL open?
   Should be: http://localhost:5173 (Vite dev server)
   Not: file:/// or http://localhost:3000

□ 6. Are there console errors?
   Open DevTools → Console tab → look for red errors

□ 7. Are API calls reaching the backend?
   Open DevTools → Network tab → filter by "Fetch/XHR"

□ 8. Is the backend running?
   cd server && npm start
   Check: http://localhost:3000/api/health

□ 9. Is the correct component rendered?
   React DevTools → Component tree → find your component

□ 10. Add a debug banner and verify it appears
```

---

## 13. Common Lomea-specific gotchas

### Auth token key
- ✅ Use `getToken()` from `api.js`
- ❌ Do NOT use `localStorage.getItem('token')`
- Actual key: `'onovi_token'`

### API URLs
- ✅ `/api/businesses`
- ❌ `/businesses`

### SERVICE_PROVIDER active UI
- ✅ `ServiceProviderWorkspace.jsx`
- ❌ `BusinessPage.jsx` (different role)

### Booking statuses (Epic 2)
- `PENDING`, `CONFIRMED`, `REJECTED`, `COMPLETED`, `CANCELLED_BY_BUSINESS`, `CANCELLED_BY_CUSTOMER`, `NO_SHOW`
- **Not:** `APPROVED` (old), `CANCELLED` (ambiguous)

### Slot statuses (Epic 2)
- `OPEN`, `FULL`
- **Not:** `RESERVED` (removed in multi-booking model)

---

## Appendix: Example Good Workflow

```markdown
User: "Fix the slot publishing button - it does nothing when clicked."

Agent:
1. I will audit the slot publishing flow.

2. Identifying active component:
   - User role: SERVICE_PROVIDER
   - Active route: service-provider → calendar
   - Active component: CalendarPage.jsx (line 88)

3. Checking SlotForm component:
   - Located at: client/src/features/business/components/SlotForm.jsx
   - onClick handler: calls onSubmit prop
   - CalendarPage passes: onSubmit={createSlot}

4. Checking createSlot function (CalendarPage.jsx:78):
   - Issue found: Missing console.log for debugging
   - Issue found: API call missing /api prefix
   - Issue found: No error handling visible to user

5. Applying fixes:
   [code changes]

6. Testing:
   - ✅ Frontend build: SUCCESS
   - ✅ Backend syntax: VALID
   - ⏸️ Browser verification: NOT DONE

7. I have made code changes but cannot verify in browser.
   Please:
   - Hard refresh browser (Cmd+Shift+R)
   - Click "פרסום תור חדש" button
   - Check browser console for errors
   - Check network tab for POST /api/slots
   - Verify slot appears in list

8. Waiting for your confirmation before committing.
```

---

**This document is mandatory. Violations will result in broken UI and wasted time.**
