/**
 * useNavigation - Custom hook for role-based navigation
 */
export function getNavItems(user) {
  if (!user) return [];

  const items = [];

  // Customer navigation
  if (user.role === 'CUSTOMER') {
    items.push({ id: 'customer', label: 'מצא תורים', icon: '🔍' });
    items.push({ id: 'my-bookings', label: 'התורים שלי', icon: '📋' });
    items.push({ id: 'customer-calendar', label: 'יומן', icon: '📅' });
  }

  // Business navigation (legacy)
  if (user.role === 'BUSINESS') {
    items.push({ id: 'business', label: 'ניהול עסק', icon: '💼' });
  }

  // Service Provider navigation
  if (user.role === 'SERVICE_PROVIDER') {
    items.push({ id: 'service-provider', label: 'אזור העבודה', icon: '💼' });
  }

  // Admin navigation
  if (user.role === 'ADMIN') {
    items.push({ id: 'admin', label: 'ניהול מערכת', icon: '⚙️' });
    items.push({ id: 'admin-catalog', label: 'קטלוג', icon: '🗂️' });
    items.push({ id: 'admin-users', label: 'משתמשים', icon: '👥' });
    items.push({ id: 'admin-approvals', label: 'אישורי נותני שירות', icon: '✓' });
    items.push({ id: 'admin-bookings', label: 'ניהול הזמנות', icon: '📋' });
    items.push({ id: 'crm', label: 'CRM', icon: '📋' });
    items.push({ id: 'customer', label: 'מצא תורים', icon: '🔍' });
  }

  return items;
}

export function getHomeView(user) {
  if (!user) return 'landing';
  if (user.role === 'ADMIN') return 'admin';
  if (user.role === 'SERVICE_PROVIDER') return 'service-provider';
  if (user.role === 'BUSINESS') return 'business';
  return 'customer';
}

export function isAuthorized(view, userRole) {
  if (view === 'admin' || view === 'admin-catalog' || view === 'admin-users' || view === 'crm' || view === 'admin-approvals' || view === 'admin-bookings') {
    return userRole === 'ADMIN';
  }
  return true;
}

/**
 * INERT Phase 1 helper — intentionally NOT wired into routing yet.
 *
 * Computes where a user *would* be routed once the onboarding stepper exists (Phase 2).
 * In Phase 1 there is no onboarding UI and no onboarding redirect: current dashboards must
 * continue exactly as today, so this function is not called from any active route/redirect.
 *
 * Rules:
 *  - Missing/undefined onboardingStatus is treated as COMPLETED (non-breaking).
 *  - Blocked accounts use only existing UserStatus values (BLOCKED, SUSPENDED).
 *  - ADMIN never onboards.
 *  - Returns null when the user should proceed to their normal dashboard (no onboarding redirect).
 *
 * @returns {null | { type: 'blocked' } | { type: 'onboarding', step: 'role-selection' | 'resume' }}
 */
export function resolveOnboardingRedirect(user) {
  if (!user) return null;

  // Blocked/suspended accounts (existing statuses only; no DISABLED in Phase 1).
  if (user.status === 'BLOCKED' || user.status === 'SUSPENDED') {
    return { type: 'blocked' };
  }

  // Admins never enter onboarding.
  if (user.role === 'ADMIN') return null;

  // Non-breaking default: an absent status behaves as COMPLETED.
  const onboardingStatus = user.onboardingStatus || 'COMPLETED';
  if (onboardingStatus === 'COMPLETED') return null;
  if (onboardingStatus === 'IN_PROGRESS') return { type: 'onboarding', step: 'resume' };
  return { type: 'onboarding', step: 'role-selection' }; // NOT_STARTED
}
