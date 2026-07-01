import React, { useState } from 'react';
import StatusBadge from '../../../../../shared/ui/StatusBadge';
import ReadinessIndicator from '../ReadinessIndicator';
import StatusManager from '../StatusManager';
import TagManager from '../TagManager';
import './UserOverviewTab.css';

/**
 * UserOverviewTab - Overview of user details, status, tags, readiness
 */
function UserOverviewTab({
  user,
  readiness,
  availableTags,
  onUpdateUser,
  onChangeStatus,
  onAddTag,
  onRemoveTag,
  onUserUpdated
}) {
  const [showStatusManager, setShowStatusManager] = useState(false);
  const [showTagManager, setShowTagManager] = useState(false);

  function formatDate(dateString) {
    if (!dateString) return 'אף פעם';
    return new Date(dateString).toLocaleString('he-IL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
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

  async function handleStatusChange(status, reason) {
    try {
      await onChangeStatus(status, reason);
      setShowStatusManager(false);
      onUserUpdated();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleAddTag(tagId) {
    try {
      await onAddTag(tagId);
      onUserUpdated();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleRemoveTag(tagId) {
    try {
      await onRemoveTag(tagId);
      onUserUpdated();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="user-overview-tab">
      <div className="overview-section">
        <h3 className="overview-section-title">פרטי משתמש</h3>
        <div className="overview-details">
          <div className="overview-detail-row">
            <span className="overview-detail-label">שם מלא:</span>
            <span className="overview-detail-value">{user.fullName}</span>
          </div>
          <div className="overview-detail-row">
            <span className="overview-detail-label">סוג משתמש:</span>
            <span className="overview-detail-value">{getRoleLabel(user.role)}</span>
          </div>
          <div className="overview-detail-row">
            <span className="overview-detail-label">טלפון:</span>
            <span className="overview-detail-value">{user.phone}</span>
          </div>
          <div className="overview-detail-row">
            <span className="overview-detail-label">אימייל:</span>
            <span className="overview-detail-value">{user.email || 'לא הוזן'}</span>
          </div>
          <div className="overview-detail-row">
            <span className="overview-detail-label">תאריך הרשמה:</span>
            <span className="overview-detail-value">{formatDate(user.createdAt)}</span>
          </div>
          <div className="overview-detail-row">
            <span className="overview-detail-label">כניסה אחרונה:</span>
            <span className="overview-detail-value">{formatDate(user.lastLoginAt)}</span>
          </div>
        </div>
      </div>

      <div className="overview-section">
        <div className="overview-section-header">
          <h3 className="overview-section-title">סטטוס</h3>
          <button
            className="overview-section-action"
            onClick={() => setShowStatusManager(true)}
          >
            שנה סטטוס
          </button>
        </div>
        <div className="overview-status-display">
          <StatusBadge status={user.status} size="large" />
        </div>
      </div>

      {readiness && (
        <div className="overview-section">
          <h3 className="overview-section-title">מוכנות</h3>
          <ReadinessIndicator readiness={readiness} />
        </div>
      )}

      <div className="overview-section">
        <div className="overview-section-header">
          <h3 className="overview-section-title">תגיות</h3>
          <button
            className="overview-section-action"
            onClick={() => setShowTagManager(true)}
          >
            נהל תגיות
          </button>
        </div>
        <div className="overview-tags">
          {user.tags && user.tags.length > 0 ? (
            user.tags.map(ut => (
              <span
                key={ut.tag.id}
                className="overview-tag"
                style={{ borderColor: ut.tag.color, color: ut.tag.color }}
              >
                {ut.tag.name}
              </span>
            ))
          ) : (
            <div className="overview-empty">אין תגיות</div>
          )}
        </div>
      </div>

      {showStatusManager && (
        <StatusManager
          currentStatus={user.status}
          onSubmit={handleStatusChange}
          onClose={() => setShowStatusManager(false)}
        />
      )}

      {showTagManager && (
        <TagManager
          userTags={user.tags || []}
          availableTags={availableTags}
          onAddTag={handleAddTag}
          onRemoveTag={handleRemoveTag}
          onClose={() => setShowTagManager(false)}
        />
      )}
    </div>
  );
}

export default UserOverviewTab;
