import React from 'react';

/**
 * AppLayout - Main authenticated layout with sidebar and mobile nav
 * Used for: Customer, Business, Admin views
 */
function AppLayout({ user, view, navItems, onNavigate, onLogout, children }) {
  return (
    <div className="app-shell">
      {/* Desktop Sidebar */}
      <aside className="app-sidebar">
        <div
          className="sidebar-logo"
          onClick={() => onNavigate(user.role === 'ADMIN' ? 'admin' : user.role === 'BUSINESS' ? 'business' : 'customer')}
          style={{ cursor: 'pointer' }}
        >
          <img src="/assets/onovi-logo.png" alt="Onovi" style={{ height: '36px' }} />
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <button
              key={item.id}
              className={`sidebar-nav-item ${view === item.id ? 'active' : ''}`}
              onClick={() => onNavigate(item.id)}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div style={{ marginBottom: 'var(--space-3)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            <div style={{ fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)' }}>
              {user.fullName}
            </div>
            <div>{user.phone}</div>
            <div style={{ fontSize: 'var(--text-xs)', marginTop: 'var(--space-1)' }}>
              <span className={`badge ${
                user.role === 'ADMIN' ? 'badge-danger' :
                user.role === 'BUSINESS' ? 'badge-primary' :
                'badge-success'
              }`}>
                {user.role === 'ADMIN' ? 'אדמין' : user.role === 'BUSINESS' ? 'עסק' : 'לקוח'}
              </span>
            </div>
          </div>
          <button className="btn-secondary" style={{ width: '100%' }} onClick={onLogout}>
            יציאה
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="app-main">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-nav">
        <div className="mobile-nav-items">
          {navItems.map(item => (
            <button
              key={item.id}
              className={`mobile-nav-item ${view === item.id ? 'active' : ''}`}
              onClick={() => onNavigate(item.id)}
            >
              <span style={{ fontSize: '20px' }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
          <button className="mobile-nav-item" onClick={onLogout}>
            <span style={{ fontSize: '20px' }}>🚪</span>
            <span>יציאה</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

export default AppLayout;
