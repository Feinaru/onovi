import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

import { clearSession, getUser, setSession } from './api';
import AuthPanel from './components/AuthPanel';
import CustomerPage from './features/customer/CustomerPage';
import BusinessPage from './features/business/BusinessPage';
import AdminPage from './pages/AdminPage';
import LandingPage from './pages/LandingPage';
import CRMPage from './pages/CRMPage';

import AppLayout from './layouts/AppLayout';
import PublicLayout from './layouts/PublicLayout';
import Toast from './shared/ui/Toast';
import UnauthorizedAccess from './shared/ui/UnauthorizedAccess';
import { getNavItems, getHomeView, isAuthorized } from './shared/hooks/useNavigation';

import './styles.css';

function App() {
  const [view, setView] = useState('landing');
  const [user, setUser] = useState(getUser());
  const [message, setMessage] = useState('');

  // Auto-route based on user role on mount
  useEffect(() => {
    if (user) {
      setView(getHomeView(user));
    } else {
      setView('landing');
    }
  }, []);

  function logout() {
    clearSession();
    setUser(null);
    setView('landing');
    showMessage('התנתקת בהצלחה');
  }

  function handleLogin(u, token) {
    setSession(token, u);
    setUser(u);
    showMessage('התחברת בהצלחה');
    setView(getHomeView(u));
  }

  function showMessage(msg) {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  }

  function handleNavigate(newView) {
    setView(newView);
  }

  function handleNavigateHome() {
    setView(user ? getHomeView(user) : 'landing');
  }

  const navItems = getNavItems(user);

  // Show landing page for logged-out users
  if (!user && view === 'landing') {
    return (
      <>
        <LandingPage setView={setView} />
        <Toast message={message} />
      </>
    );
  }

  // Show auth page
  if (view === 'auth') {
    return (
      <>
        <PublicLayout
          user={user}
          onNavigate={handleNavigate}
          onLogout={logout}
          showBackButton={!user}
        >
          <AuthPanel onLogin={handleLogin} />
        </PublicLayout>
        <Toast message={message} />
      </>
    );
  }

  // Show app shell with role-based navigation for logged-in users
  return (
    <>
      <AppLayout
        user={user}
        view={view}
        navItems={navItems}
        onNavigate={handleNavigate}
        onLogout={logout}
      >
        {/* Customer View */}
        {view === 'customer' && <CustomerPage user={user} setView={setView} />}

        {/* Business View */}
        {view === 'business' && <BusinessPage user={user} setView={setView} />}

        {/* Admin View */}
        {view === 'admin' && user.role === 'ADMIN' && <AdminPage user={user} setView={setView} />}
        {view === 'admin' && user.role !== 'ADMIN' && (
          <UnauthorizedAccess onNavigateHome={handleNavigateHome} />
        )}

        {/* CRM View */}
        {view === 'crm' && user.role === 'ADMIN' && <CRMPage user={user} setView={setView} />}
        {view === 'crm' && user.role !== 'ADMIN' && (
          <UnauthorizedAccess
            message="ה-CRM מיועד לשימוש מנהלים בלבד"
            onNavigateHome={handleNavigateHome}
          />
        )}
      </AppLayout>

      <Toast message={message} />
    </>
  );
}

createRoot(document.getElementById('root')).render(<App />);
