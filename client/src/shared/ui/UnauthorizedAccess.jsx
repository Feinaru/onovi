import React from 'react';

/**
 * UnauthorizedAccess - Display when user doesn't have permission
 */
function UnauthorizedAccess({ message = 'אין לך הרשאה לגשת לדף זה', onNavigateHome }) {
  return (
    <div style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
      <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }}>🚫</div>
      <h1 style={{ marginBottom: 'var(--space-3)' }}>אין הרשאה</h1>
      <p style={{ marginBottom: 'var(--space-4)', color: '#666' }}>
        {message}
      </p>
      <button className="btn-primary" onClick={onNavigateHome}>
        חזרה לדף הבית
      </button>
    </div>
  );
}

export default UnauthorizedAccess;
