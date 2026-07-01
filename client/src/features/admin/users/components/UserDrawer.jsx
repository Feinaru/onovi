import React, { useState, useEffect } from 'react';
import useUserDetails from '../hooks/useUserDetails';
import UserOverviewTab from './drawer-tabs/UserOverviewTab';
import UserActivityTab from './drawer-tabs/UserActivityTab';
import UserNotesTab from './drawer-tabs/UserNotesTab';
import UserActivityLogTab from './drawer-tabs/UserActivityLogTab';
import './UserDrawer.css';

/**
 * UserDrawer - Full user details with tabbed interface
 * Now using modal-v2 (same as booking dialog) for consistency
 */
function UserDrawer({ userId, isOpen, onClose, onUserUpdated, availableTags }) {
  const [activeTab, setActiveTab] = useState('overview');
  const {
    user,
    notes,
    activities,
    readiness,
    loading,
    updateUser,
    changeStatus,
    addNote,
    addTag,
    removeTag,
    refetch
  } = useUserDetails(userId);

  function handleUserUpdated() {
    refetch();
    onUserUpdated();
  }

  // Reset tab when opening new user
  useEffect(() => {
    if (isOpen) {
      setActiveTab('overview');
    }
  }, [userId, isOpen]);

  // ESC key support
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const tabs = [
    { id: 'overview', label: 'סקירה', icon: '👤' },
    { id: 'activity', label: 'פעילות', icon: '📊' },
    { id: 'notes', label: 'הערות', icon: '📝' },
    { id: 'log', label: 'יומן פעילות', icon: '📋' }
  ];

  return (
    <div className="modal-backdrop-v2" onClick={onClose}>
      <div className="modal-v2 user-details-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close-v2" onClick={onClose}>✕</button>

        {loading ? (
          <div className="user-drawer-loading">טוען פרטי משתמש...</div>
        ) : !user ? (
          <div className="user-drawer-error">שגיאה בטעינת נתוני המשתמש</div>
        ) : (
          <>
            {/* Header with user name */}
            <div className="user-drawer-header">
              <h2 className="user-drawer-title">{user.fullName}</h2>
              <div className="user-drawer-subtitle">
                {user.role === 'CUSTOMER' ? 'לקוח' : user.role === 'BUSINESS' ? 'בעל עסק' : 'מנהל'}
              </div>
            </div>

            {/* Tabs */}
            <div className="user-drawer-tabs">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  className={`user-drawer-tab ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span className="user-drawer-tab-icon">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="user-drawer-tab-content">
              {activeTab === 'overview' && (
                <UserOverviewTab
                  user={user}
                  readiness={readiness}
                  availableTags={availableTags}
                  onUpdateUser={updateUser}
                  onChangeStatus={changeStatus}
                  onAddTag={addTag}
                  onRemoveTag={removeTag}
                  onUserUpdated={handleUserUpdated}
                />
              )}

              {activeTab === 'activity' && (
                <UserActivityTab user={user} />
              )}

              {activeTab === 'notes' && (
                <UserNotesTab
                  notes={notes}
                  onAddNote={addNote}
                  onNoteAdded={handleUserUpdated}
                />
              )}

              {activeTab === 'log' && (
                <UserActivityLogTab activities={activities} />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default UserDrawer;
