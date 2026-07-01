import React, { useState } from 'react';
import './StatusManager.css';

/**
 * StatusManager - Modal for changing user status
 */
function StatusManager({ currentStatus, onSubmit, onClose }) {
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);
  const [reason, setReason] = useState('');

  const statuses = [
    { value: 'ACTIVE', label: 'פעיל', description: 'משתמש פעיל במערכת', color: '#10b981' },
    { value: 'PENDING', label: 'ממתין לאישור', description: 'דורש אישור מנהל', color: '#eab308' },
    { value: 'HIDDEN', label: 'מוסתר', description: 'משתמש יכול להתחבר, עסק לא מוצג ללקוחות', color: '#6b7280' },
    { value: 'SUSPENDED', label: 'מושעה', description: 'משתמש לא יכול לגשת למערכת', color: '#f59e0b' },
    { value: 'BLOCKED', label: 'חסום', description: 'חסימה מלאה', color: '#dc2626' }
  ];

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(selectedStatus, reason.trim() || undefined);
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="status-manager-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        
        <h3 className="status-manager-title">שינוי סטטוס משתמש</h3>
        
        <form className="status-manager-form" onSubmit={handleSubmit}>
          <div className="status-options">
            {statuses.map(status => (
              <label
                key={status.value}
                className={`status-option ${selectedStatus === status.value ? 'selected' : ''}`}
              >
                <input
                  type="radio"
                  name="status"
                  value={status.value}
                  checked={selectedStatus === status.value}
                  onChange={e => setSelectedStatus(e.target.value)}
                />
                <div className="status-option-content">
                  <div className="status-option-header">
                    <span
                      className="status-option-indicator"
                      style={{ backgroundColor: status.color }}
                    />
                    <span className="status-option-label">{status.label}</span>
                  </div>
                  <span className="status-option-description">{status.description}</span>
                </div>
              </label>
            ))}
          </div>

          <div className="status-manager-reason">
            <label className="status-manager-label">סיבה (אופציונלי)</label>
            <textarea
              className="status-manager-textarea"
              placeholder="תאר את הסיבה לשינוי הסטטוס..."
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
            />
          </div>

          <div className="status-manager-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              ביטול
            </button>
            <button type="submit" className="btn-primary">
              שמור שינויים
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default StatusManager;
