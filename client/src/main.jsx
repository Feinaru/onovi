import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

import { clearSession, getUser, setSession } from './api';
import AuthPanel from './components/AuthPanel';
import CustomerPage from './pages/CustomerPage';
import BusinessPage from './pages/BusinessPage';
import AdminPage from './pages/AdminPage';
import LandingPage from './pages/LandingPage';
import CRMPage from './pages/CRMPage';

import './styles.css';

function App() {
  const [view, setView] = useState('landing');
  const [user, setUser] = useState(getUser());
  const [message, setMessage] = useState('');

  // Auto-route based on user role on mount
  useEffect(() => {
    if (user) {
      if (user.role === 'ADMIN') setView('admin');
      else if (user.role === 'BUSINESS') setView('business');
      else setView('customer');
    } else {
      setView('landing');
    }
  }, []);

  function logout() {
    clearSession();
    setUser(null);
    setView('landing');
    setMessage('התנתקת בהצלחה');
    setTimeout(() => setMessage(''), 3000);
  }

  function handleLogin(u, token) {
    setSession(token, u);
    setUser(u);
    setMessage('התחברת בהצלחה');
    setTimeout(() => setMessage(''), 3000);

    // Auto-route based on role
    if (u.role === 'ADMIN') setView('admin');
    else if (u.role === 'BUSINESS') setView('business');
    else setView('customer');
  }

  // Get role-specific navigation items
  const getNavItems = () => {
    if (!user) return [];

    const items = [];

    // Customer navigation
    if (user.role === 'CUSTOMER') {
      items.push({ id: 'customer', label: 'מצא תורים', icon: '🔍' });
    }

    // Business navigation
    if (user.role === 'BUSINESS') {
      items.push({ id: 'business', label: 'ניהול עסק', icon: '💼' });
    }

    // Admin navigation
    if (user.role === 'ADMIN') {
      items.push({ id: 'admin', label: 'ניהול מערכת', icon: '⚙️' });
      items.push({ id: 'crm', label: 'CRM', icon: '📋' });
      items.push({ id: 'business', label: 'ניהול עסק', icon: '💼' });
      items.push({ id: 'customer', label: 'מצא תורים', icon: '🔍' });
    }

    return items;
  };

  const navItems = getNavItems();

  // Show landing page for logged-out users
  if (!user && view === 'landing') {
    return (
      <>
        <LandingPage setView={setView} />
        {message && <div className="toast">{message}</div>}
      </>
    );
  }

  // Show auth page
  if (view === 'auth') {
    return (
      <div className="app-shell">
        <header className="app-header-loggedout">
          <div className="app-header-content">
            <div className="app-header-logo" onClick={() => setView(user ? (user.role === 'ADMIN' ? 'admin' : user.role === 'BUSINESS' ? 'business' : 'customer') : 'landing')} style={{ cursor: 'pointer' }}>
              <img src="/assets/onovi-logo.png" alt="Onovi" style={{ height: '40px' }} />
            </div>
            {!user && (
              <button className="btn-secondary" onClick={() => setView('landing')}>
                חזרה
              </button>
            )}
            {user && (
              <button className="btn-secondary" onClick={logout}>
                יציאה
              </button>
            )}
          </div>
        </header>

        <main className="app-main app-main-full app-main-with-header">
          <AuthPanel onLogin={handleLogin} />
        </main>

        {message && <div className="toast">{message}</div>}
      </div>
    );
  }

  // Show app shell with role-based navigation for logged-in users
  return (
    <div className="app-shell">
      {/* Desktop Sidebar */}
      {user && (
        <aside className="app-sidebar">
          <div className="sidebar-logo" onClick={() => setView(user.role === 'ADMIN' ? 'admin' : user.role === 'BUSINESS' ? 'business' : 'customer')} style={{ cursor: 'pointer' }}>
            <img src="/assets/onovi-logo.png" alt="Onovi" style={{ height: '36px' }} />
          </div>

          <nav className="sidebar-nav">
            {navItems.map(item => (
              <button
                key={item.id}
                className={`sidebar-nav-item ${view === item.id ? 'active' : ''}`}
                onClick={() => setView(item.id)}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="sidebar-footer">
            <div style={{ marginBottom: 'var(--space-3)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              <div style={{ fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)' }}>{user.fullName}</div>
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
            <button className="btn-secondary" style={{ width: '100%' }} onClick={logout}>
              יציאה
            </button>
          </div>
        </aside>
      )}

      {/* Main Content */}
      <main className="app-main">
        {view === 'customer' && <CustomerPage user={user} setView={setView} />}
        {view === 'business' && <BusinessPage user={user} setView={setView} />}
        {view === 'admin' && user.role === 'ADMIN' && <AdminPage user={user} setView={setView} />}
        {view === 'crm' && user.role === 'ADMIN' && <CRMPage user={user} setView={setView} />}

        {/* Unauthorized access handling */}
        {view === 'admin' && user.role !== 'ADMIN' && (
          <div style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }}>🚫</div>
            <h1 style={{ marginBottom: 'var(--space-3)' }}>אין הרשאה</h1>
            <p style={{ marginBottom: 'var(--space-4)', color: '#666' }}>
              אין לך הרשאה לגשת לדף זה
            </p>
            <button
              className="btn-primary"
              onClick={() => setView(user.role === 'BUSINESS' ? 'business' : 'customer')}
            >
              חזרה לדף הבית
            </button>
          </div>
        )}
        {view === 'crm' && user.role !== 'ADMIN' && (
          <div style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }}>🚫</div>
            <h1 style={{ marginBottom: 'var(--space-3)' }}>אין הרשאה</h1>
            <p style={{ marginBottom: 'var(--space-4)', color: '#666' }}>
              ה-CRM מיועד לשימוש מנהלים בלבד
            </p>
            <button
              className="btn-primary"
              onClick={() => setView(user.role === 'BUSINESS' ? 'business' : 'customer')}
            >
              חזרה לדף הבית
            </button>
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      {user && (
        <nav className="mobile-nav">
          <div className="mobile-nav-items">
            {navItems.map(item => (
              <button
                key={item.id}
                className={`mobile-nav-item ${view === item.id ? 'active' : ''}`}
                onClick={() => setView(item.id)}
              >
                <span style={{ fontSize: '20px' }}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
            <button className="mobile-nav-item" onClick={logout}>
              <span style={{ fontSize: '20px' }}>🚪</span>
              <span>יציאה</span>
            </button>
          </div>
        </nav>
      )}

      {/* Toast Notifications */}
      {message && <div className="toast">{message}</div>}
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
