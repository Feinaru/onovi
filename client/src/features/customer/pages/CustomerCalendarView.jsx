import React, { useState } from 'react';
import CalendarMonthHeader from '../../../shared/calendar/CalendarMonthHeader';
import CalendarMonthGrid from '../../../shared/calendar/CalendarMonthGrid';
import CalendarEventCard from '../../../shared/calendar/CalendarEventCard';
import { formatDateLocal, formatDateDisplayHebrew, addMonths } from '../../../shared/calendar/utils/calendarUtils';

/**
 * CustomerCalendarView - Read-only calendar view for customer bookings
 * Shows bookings in month grid, click date to see that day's bookings
 */
export default function CustomerCalendarView({ bookings, setView }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  // Map bookings to calendar events
  const calendarEvents = bookings
    .filter(booking => booking.slot?.date) // Only bookings with valid dates
    .map(booking => ({
      id: booking.id,
      date: booking.slot.date, // YYYY-MM-DD from slot
      startTime: booking.startTime,
      endTime: booking.endTime,
      title: booking.business?.name || 'עסק',
      subtitle: booking.businessService?.serviceTemplate?.name ||
                booking.businessService?.name ||
                booking.service?.name ||
                'שירות',
      status: booking.status,
      onClick: () => setView({ view: 'booking-details', bookingId: booking.id })
    }));

  // Navigation handlers
  function handlePreviousMonth() {
    setCurrentMonth(prev => addMonths(prev, -1));
  }

  function handleNextMonth() {
    setCurrentMonth(prev => addMonths(prev, 1));
  }

  function handleToday() {
    setCurrentMonth(new Date());
  }

  function handleDateClick(date) {
    setSelectedDate(date);
  }

  // Filter events for selected date
  const selectedDateStr = selectedDate ? formatDateLocal(selectedDate) : null;
  const selectedDateEvents = selectedDateStr
    ? calendarEvents.filter(e => e.date === selectedDateStr)
    : [];

  // Check if current month has any bookings
  const monthYear = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
  const hasBookingsInMonth = calendarEvents.some(e => e.date.startsWith(monthYear));

  return (
    <div style={{ padding: 'var(--space-2) 0' }}>
      {/* Month Navigation */}
      <CalendarMonthHeader
        currentMonth={currentMonth}
        onPrevious={handlePreviousMonth}
        onNext={handleNextMonth}
        onToday={handleToday}
      />

      {/* Month Grid */}
      <CalendarMonthGrid
        currentMonth={currentMonth}
        events={calendarEvents}
        selectedDate={selectedDate}
        onDateClick={handleDateClick}
      />

      {/* Empty State - No bookings in month */}
      {!hasBookingsInMonth && !selectedDate && (
        <div style={{
          marginTop: 'var(--space-4)',
          padding: 'var(--space-6)',
          textAlign: 'center',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          color: 'var(--text-secondary)'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: 'var(--space-2)' }}>📅</div>
          <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-medium)' }}>
            אין תורים בחודש זה
          </div>
        </div>
      )}

      {/* Selected Date Bookings */}
      {selectedDate && (
        <div style={{ marginTop: 'var(--space-4)' }}>
          <h3 style={{
            fontSize: 'var(--text-lg)',
            fontWeight: 'var(--font-semibold)',
            marginBottom: 'var(--space-3)',
            color: 'var(--text-primary)'
          }}>
            תורים ב־{formatDateDisplayHebrew(selectedDate)}
          </h3>

          {selectedDateEvents.length > 0 ? (
            <div>
              {selectedDateEvents.map(event => (
                <CalendarEventCard
                  key={event.id}
                  event={event}
                  compact={false}
                />
              ))}
            </div>
          ) : (
            <div style={{
              padding: 'var(--space-4)',
              textAlign: 'center',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-lg)',
              color: 'var(--text-secondary)'
            }}>
              אין תורים ביום זה
            </div>
          )}
        </div>
      )}
    </div>
  );
}
