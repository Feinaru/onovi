import React from 'react';
import { formatMonthYearHebrew, getHebrewDayName, isToday as checkIsToday } from './utils/calendarUtils';

/**
 * CalendarToolbar - Reusable calendar navigation toolbar
 * Supports day/week/month views with Hebrew formatting
 */

// Format week range display
function formatWeekRange(date) {
  const weekStart = new Date(date);
  weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6); // End of week (Saturday)

  const startDay = weekStart.getDate();
  const endDay = weekEnd.getDate();
  const month = weekStart.getMonth() + 1;
  const year = weekStart.getFullYear();

  // If week spans two months, show both
  if (weekStart.getMonth() !== weekEnd.getMonth()) {
    const endMonth = weekEnd.getMonth() + 1;
    return `${startDay}.${month} - ${endDay}.${endMonth}.${year}`;
  }

  return `${startDay}-${endDay}.${month}.${year}`;
}

// Format day view display
function formatDayDisplay(date) {
  const dayName = getHebrewDayName(date);
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  return `${dayName}, ${day}.${month}.${year}`;
}

// Get formatted date label based on view type
function getDateLabel(date, viewType) {
  switch (viewType) {
    case 'day':
      return formatDayDisplay(date);
    case 'week':
      return formatWeekRange(date);
    case 'month':
      return formatMonthYearHebrew(date);
    default:
      return formatDayDisplay(date);
  }
}

export default function CalendarToolbar({
  currentDate,
  currentView,
  onPrevious,
  onNext,
  onToday,
  title,
  subtitle,
  className = ''
}) {
  const dateLabel = getDateLabel(currentDate, currentView);
  const isCurrentToday = checkIsToday(currentDate);

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 'var(--space-4)',
        background: 'var(--bg-primary)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        marginBottom: 'var(--space-4)',
        flexWrap: 'wrap',
        gap: 'var(--space-3)'
      }}
    >
      {/* Date Display */}
      <div>
        {title && (
          <div style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--text-secondary)',
            marginBottom: 'var(--space-1)'
          }}>
            {title}
          </div>
        )}
        <div style={{
          fontSize: title ? 'var(--text-lg)' : 'var(--text-xl)',
          fontWeight: 'var(--font-semibold)',
          color: 'var(--text-primary)'
        }}>
          {dateLabel}
        </div>
        {subtitle && (
          <div style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--text-secondary)',
            marginTop: 'var(--space-1)'
          }}>
            {subtitle}
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div style={{
        display: 'flex',
        gap: 'var(--space-2)'
      }}>
        <button
          className="btn-secondary"
          onClick={onPrevious}
          title="קודם"
          style={{ minWidth: '36px' }}
        >
          ←
        </button>

        <button
          className="btn-secondary"
          onClick={onToday}
          disabled={isCurrentToday}
          style={{
            opacity: isCurrentToday ? 0.5 : 1,
            cursor: isCurrentToday ? 'not-allowed' : 'pointer'
          }}
        >
          היום
        </button>

        <button
          className="btn-secondary"
          onClick={onNext}
          title="הבא"
          style={{ minWidth: '36px' }}
        >
          →
        </button>
      </div>
    </div>
  );
}
