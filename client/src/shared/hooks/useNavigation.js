/**
 * useNavigation - Custom hook for role-based navigation
 */
export function getNavItems(user) {
  if (!user) return [];

  const items = [];

  // Customer navigation
  if (user.role === 'CUSTOMER') {
    items.push({ id: 'customer', label: 'מצא תורים', icon: '🔍' });
    items.push({ id: 'my-bookings', label: 'התורים שלי', icon: '📅' });
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
    items.push({ id: 'crm', label: 'CRM', icon: '📋' });
    items.push({ id: 'business', label: 'ניהול עסק', icon: '💼' });
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
  if (view === 'admin' || view === 'crm') {
    return userRole === 'ADMIN';
  }
  return true;
}
