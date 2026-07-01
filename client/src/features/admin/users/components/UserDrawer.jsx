import React, { useState } from 'react';
import Drawer from '../../../../shared/ui/Drawer';
import useUserDetails from '../hooks/useUserDetails';
import UserOverviewTab from './drawer-tabs/UserOverviewTab';
import UserActivityTab from './drawer-tabs/UserActivityTab';
import UserNotesTab from './drawer-tabs/UserNotesTab';
import UserActivityLogTab from './drawer-tabs/UserActivityLogTab';
import './UserDrawer.css';

/**
 * UserDrawer - Full user details with tabbed interface
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

  if (!isOpen) return null;

  const tabs = [
    { id: 'overview', label: 'סקירה', icon: '👤' },
    { id: 'activity', label: 'פעילות', icon: '📊' },
    { id: 'notes', label: 'הערות', icon: '📝' },
    { id: 'log', label: 'יומן פעילות', icon: '📋' }
  ];

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={loading ? 'טוען...' : user?.fullName || 'פרטי משתמש'}
      width="700px"
    >
      {loading ? (
        <div className="user-drawer-loading">טוען פרטי משתמש...</div>
      ) : !user ? (
        <div className="user-drawer-error">שגיאה בטעינת נתוני המשתמש</div>
      ) : (
        <>
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
    </Drawer>
  );
}

export default UserDrawer;
