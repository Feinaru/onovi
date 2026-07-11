import React from 'react';
import { getMonthGrid, getHebrewDayNameShort } from './utils/calendarUtils';
import CalendarDateCell from './CalendarDateCell';

/**
 * CalendarMonthGrid - Month calendar grid display
 * 7 columns (Sunday-Saturday) × 6 rows
 */
export default function CalendarMonthGrid({
  currentMonth,
  events,
  selectedDate,
  onDateClick
}) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const weeks = getMonthGrid(year, month);

  // Day headers (Sunday-Saturday in Hebrew)
  const dayHeaders = [0, 1, 2, 3, 4, 5, 6].map(i => getHebrewDayNameShort(i));

  return (
    <div style={{
      display: 'grid',
      gridTemplateRows: 'auto repeat(6, 1fr)',
      gap: '1px',
      background: 'var(--border-subtle)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden'
    }}>
      {/* Day Headers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        background: 'var(--bg-secondary)',
        gap: '1px'
      }}>
        {dayHeaders.map((day, i) => (
          <div
            key={i}
            style={{
              padding: 'var(--space-2)',
              textAlign: 'center',
              fontWeight: 'var(--font-semibold)',
              fontSize: 'var(--text-sm)',
              color: 'var(--text-secondary)',
              background: 'var(--bg-secondary)'
            }}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Week Rows */}
      {weeks.map((week, weekIndex) => (
        <div
          key={weekIndex}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '1px'
          }}
        >
          {week.map((date, dayIndex) => (
            <CalendarDateCell
              key={dayIndex}
              date={date}
              events={events}
              currentMonth={currentMonth}
              selectedDate={selectedDate}
              onClick={onDateClick}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
