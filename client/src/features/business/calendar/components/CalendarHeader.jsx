import React, { useState } from 'react';
import './CalendarHeader.css';

/**
 * CalendarHeader - Top bar with navigation, view switcher, and create event button
 */
function CalendarHeader({ currentDate, view, onViewChange, onPrevious, onNext, onToday, onCreateEvent, showHeatMap, onToggleHeatMap }) {
  const [showCreateMenu, setShowCreateMenu] = useState(false);

  const formatTitle = () => {
    const options = { year: 'numeric', month: 'long' };
    if (view === 'day') {
      return currentDate.toLocaleDateString('he-IL', { ...options, day: 'numeric' });
    }
    return currentDate.toLocaleDateString('he-IL', options);
  };

  const eventTypes = [
    { type: 'SLOT', label: 'פרסם חלון זמן פנוי', icon: '🟢', color: '#10b981' },
    { type: 'CALENDAR_EVENT', label: 'תור טלפוני / פגישה', icon: '⚪', color: '#9ca3af' },
    { type: 'TIME_BLOCK', label: 'הפסקה / זמן אישי', icon: '🟡', color: '#eab308' },
    { type: 'VACATION', label: 'חופשה', icon: '🟣', color: '#a855f7' }
  ];

  function handleCreateClick(eventType) {
    onCreateEvent(eventType, {});
    setShowCreateMenu(false);
  }

  return (
    <div className="calendar-header">
      <div className="calendar-header-left">
        <button className="calendar-today-btn" onClick={onToday}>
          היום
        </button>

        <div className="calendar-nav">
          <button className="calendar-nav-btn" onClick={onPrevious}>
            ›
          </button>
          <button className="calendar-nav-btn" onClick={onNext}>
            ‹
          </button>
        </div>

        <h1 className="calendar-title">{formatTitle()}</h1>
      </div>

      <div className="calendar-header-right">
        <button
          className={`calendar-heatmap-toggle ${showHeatMap ? 'active' : ''}`}
          onClick={onToggleHeatMap}
        >
          🔥 Heat Map: {showHeatMap ? 'ON' : 'OFF'}
        </button>

        <div className="calendar-view-switcher">
          <button
            className={`calendar-view-btn ${view === 'day' ? 'active' : ''}`}
            onClick={() => onViewChange('day')}
          >
            יום
          </button>
          <button
            className={`calendar-view-btn ${view === 'week' ? 'active' : ''}`}
            onClick={() => onViewChange('week')}
            disabled
          >
            שבוע
          </button>
          <button
            className={`calendar-view-btn ${view === 'month' ? 'active' : ''}`}
            onClick={() => onViewChange('month')}
            disabled
          >
            חודש
          </button>
        </div>

        <div className="calendar-create-wrapper">
          <button
            className="calendar-create-btn"
            onClick={() => setShowCreateMenu(!showCreateMenu)}
          >
            + אירוע חדש
          </button>

          {showCreateMenu && (
            <div className="calendar-create-menu">
              {eventTypes.map(({ type, label, icon, color }) => (
                <button
                  key={type}
                  className="calendar-create-menu-item"
                  onClick={() => handleCreateClick(type)}
                >
                  <span className="calendar-create-menu-icon" style={{ color }}>
                    {icon}
                  </span>
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CalendarHeader;
