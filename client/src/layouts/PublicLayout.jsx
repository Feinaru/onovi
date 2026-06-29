import React from 'react';

/**
 * PublicLayout - Layout for unauthenticated users (landing, auth)
 */
function PublicLayout({ user, onNavigate, onLogout, showBackButton = false, children }) {
  return (
    <div className="app-shell">
      <header className="app-header-loggedout">
        <div className="app-header-content">
          <div
            className="app-header-logo"
            onClick={() => onNavigate(
              user
                ? (user.role === 'ADMIN' ? 'admin' : user.role === 'BUSINESS' ? 'business' : 'customer')
                : 'landing'
            )}
            style={{ cursor: 'pointer' }}
          >
            <img src="/assets/onovi-logo.png" alt="Onovi" style={{ height: '40px' }} />
          </div>
          {!user && showBackButton && (
            <button className="btn-secondary" onClick={() => onNavigate('landing')}>
              חזרה
            </button>
          )}
          {user && (
            <button className="btn-secondary" onClick={onLogout}>
              יציאה
            </button>
          )}
        </div>
      </header>

      <main className="app-main app-main-full app-main-with-header">
        {children}
      </main>
    </div>
  );
}

export default PublicLayout;
