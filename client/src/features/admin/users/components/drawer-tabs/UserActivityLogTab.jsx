import React from 'react';
import './UserActivityLogTab.css';

/**
 * UserActivityLogTab - Timeline of all user events
 */
function UserActivityLogTab({ activities }) {
  function formatDate(dateString) {
    return new Date(dateString).toLocaleString('he-IL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getActivityIcon(action) {
    const icons = {
      STATUS_CHANGE: '🔄',
      TAG_ADDED: '🏷️',
      TAG_REMOVED: '❌',
      NOTE_ADDED: '📝',
      PROFILE_UPDATE: '✏️',
      PASSWORD_RESET: '🔑',
      LOGIN: '🔓',
      CREATED: '✨',
      DEFAULT: '📋'
    };
    return icons[action] || icons.DEFAULT;
  }

  if (activities.length === 0) {
    return (
      <div className="activity-log-empty">
        <div className="activity-log-empty-icon">📋</div>
        <p>אין פעילות ביומן</p>
      </div>
    );
  }

  return (
    <div className="user-activity-log-tab">
      <div className="activity-log-timeline">
        {activities.map((activity, index) => (
          <div key={activity.id} className="activity-log-item">
            <div className="activity-log-icon">
              {getActivityIcon(activity.action)}
            </div>
            <div className="activity-log-content">
              <div className="activity-log-header">
                <span className="activity-log-action">{activity.action}</span>
                <span className="activity-log-date">{formatDate(activity.createdAt)}</span>
              </div>
              {activity.description && (
                <div className="activity-log-description">{activity.description}</div>
              )}
              {activity.admin && (
                <div className="activity-log-admin">
                  ביצע: {activity.admin.fullName}
                </div>
              )}
            </div>
            {index < activities.length - 1 && <div className="activity-log-line" />}
          </div>
        ))}
      </div>
    </div>
  );
}

export default UserActivityLogTab;
