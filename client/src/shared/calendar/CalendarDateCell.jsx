import React from 'react';
import { formatDateLocal, isToday, isSameDate, isInMonth } from './utils/calendarUtils';
import { getCalendarStatusMeta } from './utils/statusColors';

/**
 * CalendarDateCell - Individual date cell in month grid
 * Shows date number and event indicators (dots/badges)
 */
export default function CalendarDateCell({
  date,
  events,
  currentMonth,
  selectedDate,
  onClick
}) {
  const dateStr = formatDateLocal(date);
  const dayEvents = events.filter(e => e.date === dateStr);
  const isCurrentMonth = isInMonth(date, currentMonth);
  const isTodayDate = isToday(date);
  const isSelected = selectedDate && isSameDate(selectedDate, date);

  // Get unique statuses for dot colors
  const uniqueStatuses = [...new Set(dayEvents.map(e => e.status))];
  const eventDots = uniqueStatuses.slice(0, 3).map(status =>
    getCalendarStatusMeta(status).dotColor
  );

  return (
    <div
      onClick={() => onClick(date)}
      style={{
        background: isSelected ? '#e0f2fe' : 'var(--bg-primary)',
        padding: 'var(--space-2)',
        minHeight: '80px',
        cursor: 'pointer',
        transition: 'background 0.2s',
        display: 'flex',
        flexDirection: 'column',
        border: isSelected ? '2px solid #3b82f6' : 'none',
        opacity: isCurrentMonth ? 1 : 0.4,
        position: 'relative'
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.background = 'var(--bg-secondary)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.background = 'var(--bg-primary)';
        }
      }}
    >
      {/* Date Number */}
      <div style={{
        fontSize: 'var(--text-sm)',
        fontWeight: 'var(--font-semibold)',
        marginBottom: 'var(--space-1)',
        ...(isTodayDate && {
          background: '#3b82f6',
          color: 'white',
          borderRadius: '50%',
          width: '24px',
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        })
      }}>
        {date.getDate()}
      </div>

      {/* Event Indicators */}
      {dayEvents.length > 0 && (
        <div style={{
          display: 'flex',
          gap: '2px',
          flexWrap: 'wrap',
          marginTop: 'auto'
        }}>
          {eventDots.map((color, i) => (
            <div
              key={i}
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: color
              }}
            />
          ))}
          {dayEvents.length > 3 && (
            <span style={{
              fontSize: '10px',
              color: 'var(--text-secondary)',
              marginRight: '4px'
            }}>
              +{dayEvents.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
