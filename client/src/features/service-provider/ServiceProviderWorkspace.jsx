import { useState, useEffect } from 'react';
import { api } from '../../api';
import DashboardPage from './pages/DashboardPage';
import BusinessProfilePage from './pages/BusinessProfilePage';
import ServicesPage from './pages/ServicesPage';
import ServiceGroupsPage from './pages/ServiceGroupsPage';
import SettingsPage from './pages/SettingsPage';
import ComingSoonPage from './pages/ComingSoonPage';
import CalendarPage from './pages/CalendarPage';
import BookingsPage from './pages/BookingsPage';
import ProviderCustomersPage from './pages/ProviderCustomersPage';

/**
 * ServiceProviderWorkspace - Main workspace for service providers
 *
 * Navigation Structure:
 * - Dashboard (active)
 * - Business (active)
 * - Services (active)
 * - Service Groups (active)
 * - Calendar (active - Epic 2)
 * - Bookings (active - Epic 2)
 * - Customers (coming soon)
 * - Reports (coming soon)
 * - Settings (active)
 */
export default function ServiceProviderWorkspace({ user, setView, onLogout }) {
  const [activePage, setActivePage] = useState('dashboard');
  const [approvalStatus, setApprovalStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch approval status on mount
  useEffect(() => {
    fetchApprovalStatus();
  }, []);

  async function fetchApprovalStatus() {
    try {
      const result = await api('/api/service-provider/business/status');

      // Handle response structure: { success: true, data: { approvalStatus: 'APPROVED', ... } }
      if (result && result.data && result.data.approvalStatus) {
        setApprovalStatus({ status: result.data.approvalStatus });
      } else if (result && result.approvalStatus) {
        // Fallback if data is not nested
        setApprovalStatus({ status: result.approvalStatus });
      } else {
        // No approval status found - business may not exist
        setApprovalStatus({ status: 'NOT_FOUND' });
      }

      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch approval status:', error);
      // Set error state instead of leaving stuck on loading
      setApprovalStatus({ status: 'ERROR' });
      setLoading(false);
    }
  }

  const navigationItems = [
    { id: 'dashboard', label: 'לוח בקרה', icon: '📊', active: true },
    { id: 'business', label: 'פרטי העסק', icon: '🏢', active: true },
    { id: 'services', label: 'שירותים', icon: '✂️', active: true },
    { id: 'service-groups', label: 'קבוצות שירותים', icon: '📦', active: true },
    { id: 'calendar', label: 'תורים', icon: '📅', active: true },
    { id: 'bookings', label: 'הזמנות', icon: '📋', active: true },
    { id: 'customers', label: 'לקוחות', icon: '👥', active: true },
    { id: 'reports', label: 'דוחות', icon: '📈', active: false },
    { id: 'settings', label: 'הגדרות', icon: '⚙️', active: true }
  ];

  function renderApprovalStatusBadge() {
    if (loading || !approvalStatus) {
      return <div className="badge badge-secondary">טוען...</div>;
    }

    const statusConfig = {
      DRAFT: { label: 'טיוטה', className: 'badge-secondary' },
      PENDING_APPROVAL: { label: 'ממתין לאישור', className: 'badge-warning' },
      APPROVED: { label: 'מאושר', className: 'badge-success' },
      REJECTED: { label: 'נדחה', className: 'badge-danger' },
      NOT_FOUND: { label: 'לא נמצא עסק', className: 'badge-secondary' },
      ERROR: { label: 'שגיאה בטעינת סטטוס', className: 'badge-danger' }
    };

    const config = statusConfig[approvalStatus.status] || statusConfig.DRAFT;

    return (
      <div className={`badge ${config.className}`}>
        {config.label}
      </div>
    );
  }

  function renderPage() {
    const item = navigationItems.find(item => item.id === activePage);

    if (!item.active) {
      return <ComingSoonPage pageName={item.label} icon={item.icon} />;
    }

    switch (activePage) {
      case 'dashboard':
        return <DashboardPage user={user} approvalStatus={approvalStatus} />;
      case 'business':
        return <BusinessProfilePage user={user} />;
      case 'services':
        return <ServicesPage user={user} />;
      case 'service-groups':
        return <ServiceGroupsPage user={user} />;
      case 'calendar':
        return <CalendarPage user={user} />;
      case 'bookings':
        return <BookingsPage user={user} />;
      case 'customers':
        return <ProviderCustomersPage user={user} />;
      case 'settings':
        return <SettingsPage user={user} />;
      default:
        return <DashboardPage user={user} approvalStatus={approvalStatus} />;
    }
  }

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className="app-sidebar">
        <div className="sidebar-logo">
          <img src="/assets/lomea-logo.png" alt="Lomea" style={{ height: '36px' }} />
        </div>

        <nav className="sidebar-nav">
          {navigationItems.map(item => (
            <button
              key={item.id}
              className={`sidebar-nav-item ${activePage === item.id ? 'active' : ''} ${!item.active ? 'disabled' : ''}`}
              onClick={() => item.active && setActivePage(item.id)}
              disabled={!item.active}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
              {!item.active && <span className="badge badge-xs badge-secondary" style={{ marginRight: 'auto' }}>בקרוב</span>}
            </button>
          ))}
        </nav>

        {/* Logout button at bottom */}
        <div style={{ marginTop: 'auto', padding: 'var(--space-4)' }}>
          <button
            className="btn-secondary"
            style={{ width: '100%' }}
            onClick={onLogout}
          >
            התנתק
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="app-main">
        {/* Header with approval status */}
        <div className="workspace-header" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 'var(--space-6)',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-primary)',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 'var(--text-xl)', fontWeight: 'var(--font-semibold)' }}>
              {navigationItems.find(item => item.id === activePage)?.label || 'לוח בקרה'}
            </h2>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 'var(--space-1)' }}>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>סטטוס אישור</span>
              {renderApprovalStatusBadge()}
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div style={{ padding: 'var(--space-6)' }}>
          {renderPage()}
        </div>
      </main>

      {/* Mobile bottom navigation */}
      <nav className="mobile-nav">
        {navigationItems.slice(0, 5).map(item => (
          <button
            key={item.id}
            className={`mobile-nav-item ${activePage === item.id ? 'active' : ''}`}
            onClick={() => item.active && setActivePage(item.id)}
            disabled={!item.active}
          >
            <span className="mobile-nav-icon">{item.icon}</span>
            <span className="mobile-nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
