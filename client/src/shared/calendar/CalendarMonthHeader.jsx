import React from 'react';
import { formatMonthYearHebrew, isThisMonth, addMonths } from './utils/calendarUtils';

/**
 * CalendarMonthHeader - Month navigation controls
 * Shows month/year title and navigation buttons
 */
export default function CalendarMonthHeader({ currentMonth, onPrevious, onNext, onToday }) {
  const monthTitle = formatMonthYearHebrew(currentMonth);
  const isCurrentMonth = isThisMonth(currentMonth);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 'var(--space-4)',
      background: 'var(--bg-primary)',
      borderRadius: 'var(--radius-lg)',
      marginBottom: 'var(--space-4)',
      border: '1px solid var(--border-subtle)'
    }}>
      {/* Month/Year Title */}
      <h2 style={{
        fontSize: 'var(--text-xl)',
        fontWeight: 'var(--font-bold)',
        margin: 0,
        color: 'var(--text-primary)'
      }}>
        {monthTitle}
      </h2>

      {/* Navigation Buttons */}
      <div style={{
        display: 'flex',
        gap: 'var(--space-2)'
      }}>
        <button
          onClick={onPrevious}
          className="btn-secondary"
          style={{ minWidth: '36px' }}
          title="חודש קודם"
        >
          ←
        </button>

        <button
          onClick={onToday}
          className="btn-secondary"
          disabled={isCurrentMonth}
          style={{
            opacity: isCurrentMonth ? 0.5 : 1,
            cursor: isCurrentMonth ? 'not-allowed' : 'pointer'
          }}
        >
          החודש
        </button>

        <button
          onClick={onNext}
          className="btn-secondary"
          style={{ minWidth: '36px' }}
          title="חודש הבא"
        >
          →
        </button>
      </div>
    </div>
  );
}
