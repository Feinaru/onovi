import React, { useState } from 'react';
import CalendarShell from '../../../shared/calendar/CalendarShell';
import CalendarMonthGrid from '../../../shared/calendar/CalendarMonthGrid';
import CalendarEventCard from '../../../shared/calendar/CalendarEventCard';
import CalendarTimeGrid from '../../../shared/calendar/CalendarTimeGrid';
import CalendarTimeIndicator from '../../../shared/calendar/CalendarTimeIndicator';
import { formatDateLocal, formatDateDisplayHebrew, addMonths, addDays, getHebrewDayName } from '../../../shared/calendar/utils/calendarUtils';

/**
 * CustomerCalendarView - Read-only calendar view for customer bookings
 * Supports month/week/day views with shared calendar shell
 */
export default function CustomerCalendarView({ bookings, setView }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState('month');
  const [selectedDate, setSelectedDate] = useState(null);

  // Map bookings to calendar events
  const calendarEvents = bookings
    .filter(booking => booking.slot?.date)
    .map(booking => ({
      id: booking.id,
      date: booking.slot.date,
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
  function handlePrevious() {
    if (currentView === 'month') {
      setCurrentDate(prev => addMonths(prev, -1));
    } else if (currentView === 'week') {
      setCurrentDate(prev => addDays(prev, -7));
    } else {
      setCurrentDate(prev => addDays(prev, -1));
    }
  }

  function handleNext() {
    if (currentView === 'month') {
      setCurrentDate(prev => addMonths(prev, 1));
    } else if (currentView === 'week') {
      setCurrentDate(prev => addDays(prev, 7));
    } else {
      setCurrentDate(prev => addDays(prev, 1));
    }
  }

  function handleToday() {
    setCurrentDate(new Date());
  }

  function handleDateClick(date) {
    setSelectedDate(date);
  }

  // Month view content
  const renderMonthView = () => {
    const monthYear = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    const hasBookingsInMonth = calendarEvents.some(e => e.date.startsWith(monthYear));

    return (
      <div>
        <CalendarMonthGrid
          currentMonth={currentDate}
          events={calendarEvents}
          selectedDate={selectedDate}
          onDateClick={handleDateClick}
        />

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

            {(() => {
              const selectedDateStr = formatDateLocal(selectedDate);
              const selectedDateEvents = calendarEvents.filter(e => e.date === selectedDateStr);

              return selectedDateEvents.length > 0 ? (
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
              );
            })()}
          </div>
        )}
      </div>
    );
  };

  // Week view content
  const renderWeekView = () => {
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay());

    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      return day;
    });

    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: 'var(--space-2)',
        marginTop: 'var(--space-4)'
      }}>
        {weekDays.map(day => {
          const dayStr = formatDateLocal(day);
          const dayEvents = calendarEvents.filter(e => e.date === dayStr);
          const isToday = formatDateLocal(new Date()) === dayStr;

          return (
            <div
              key={dayStr}
              style={{
                background: 'var(--bg-primary)',
                borderRadius: 'var(--radius-lg)',
                border: isToday ? '2px solid var(--primary-color)' : '1px solid var(--border-subtle)',
                padding: 'var(--space-3)'
              }}
            >
              <div style={{
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-semibold)',
                marginBottom: 'var(--space-2)',
                color: isToday ? 'var(--primary-color)' : 'var(--text-primary)'
              }}>
                {getHebrewDayName(day)}
              </div>
              <div style={{
                fontSize: 'var(--text-2xl)',
                fontWeight: 'var(--font-bold)',
                marginBottom: 'var(--space-3)',
                color: isToday ? 'var(--primary-color)' : 'var(--text-primary)'
              }}>
                {day.getDate()}
              </div>

              {dayEvents.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {dayEvents.map(event => (
                    <CalendarEventCard
                      key={event.id}
                      event={event}
                      compact={true}
                    />
                  ))}
                </div>
              ) : (
                <div style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-secondary)',
                  textAlign: 'center',
                  padding: 'var(--space-2)'
                }}>
                  אין תורים
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Day view content
  const renderDayView = () => {
    const dayStr = formatDateLocal(currentDate);
    const dayEvents = calendarEvents.filter(e => e.date === dayStr);

    return (
      <div style={{ marginTop: 'var(--space-4)' }}>
        {dayEvents.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {dayEvents.map(event => (
              <CalendarEventCard
                key={event.id}
                event={event}
                compact={false}
              />
            ))}
          </div>
        ) : (
          <div style={{
            padding: 'var(--space-8)',
            textAlign: 'center',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            color: 'var(--text-secondary)'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: 'var(--space-2)' }}>📅</div>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-medium)' }}>
              אין תורים ביום זה
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ padding: 'var(--space-2) 0' }}>
      <CalendarShell
        currentDate={currentDate}
        currentView={currentView}
        availableViews={['day', 'week', 'month']}
        onViewChange={setCurrentView}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onToday={handleToday}
      >
        {currentView === 'month' && renderMonthView()}
        {currentView === 'week' && renderWeekView()}
        {currentView === 'day' && renderDayView()}
      </CalendarShell>
    </div>
  );
}
