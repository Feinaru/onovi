import React from 'react';
import StatusBadge from '../../../../shared/ui/StatusBadge';
import './UserTable.css';

/**
 * UserTable - User listing with pagination
 */
function UserTable({ users, loading, pagination, onUserClick, onPageChange }) {
  function formatDate(dateString) {
    if (!dateString) return 'אף פעם';
    return new Date(dateString).toLocaleDateString('he-IL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  function getRoleLabel(role) {
    const labels = {
      CUSTOMER: 'לקוח',
      BUSINESS: 'בעל עסק',
      ADMIN: 'מנהל'
    };
    return labels[role] || role;
  }

  if (loading) {
    return (
      <div className="user-table-container">
        <div className="user-table-loading">טוען משתמשים...</div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="user-table-container">
        <div className="user-table-empty">
          <div className="user-table-empty-icon">👥</div>
          <div className="user-table-empty-title">לא נמצאו משתמשים</div>
          <div className="user-table-empty-description">
            נסה לשנות את הפילטרים או את החיפוש
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="user-table-container">
      <div className="user-table-wrapper">
        <table className="user-table">
          <thead>
            <tr>
              <th>שם מלא</th>
              <th>סוג משתמש</th>
              <th>טלפון</th>
              <th>אימייל</th>
              <th>תאריך הרשמה</th>
              <th>כניסה אחרונה</th>
              <th>סטטוס</th>
              <th>פעולות</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="user-table-row">
                <td className="user-table-name">{user.fullName}</td>
                <td>{getRoleLabel(user.role)}</td>
                <td className="user-table-phone">{user.phone}</td>
                <td className="user-table-email">{user.email || '-'}</td>
                <td>{formatDate(user.createdAt)}</td>
                <td>{formatDate(user.lastLoginAt)}</td>
                <td>
                  <StatusBadge status={user.status} size="small" />
                </td>
                <td>
                  <button
                    className="user-table-action-btn"
                    onClick={() => onUserClick(user.id)}
                  >
                    פרטים
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="user-table-pagination">
          <button
            className="pagination-btn"
            disabled={pagination.page === 1}
            onClick={() => onPageChange(pagination.page - 1)}
          >
            ← הקודם
          </button>

          <span className="pagination-info">
            עמוד {pagination.page} מתוך {pagination.totalPages}
            {' '}
            ({pagination.total} משתמשים)
          </span>

          <button
            className="pagination-btn"
            disabled={pagination.page === pagination.totalPages}
            onClick={() => onPageChange(pagination.page + 1)}
          >
            הבא →
          </button>
        </div>
      )}
    </div>
  );
}

export default UserTable;
