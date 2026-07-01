import React, { useState, useEffect, useRef } from 'react';
import SlotCard from './SlotCard';
import CalendarEventCard from './CalendarEventCard';
import TimeBlockCard from './TimeBlockCard';
import './DayView.css';

/**
 * DayView - Real hourly grid calendar view
 *
 * Business workspace showing:
 * - Slots as containers with bookings inside
 * - Calendar Events
 * - Time Blocks
 * - Current time indicator
 * - Heat map overlay (optional)
 */
function DayView({
  currentDate,
  events,
  vacations,
  heatMap,
  showHeatMap,
  onEventClick,
  onEditEvent,
  onDeleteEvent,
  onToggleSlotStatus,
  onCancelBooking,
  onCreateSlot,
  onCreateCalendarEvent,
  onCreateTimeBlock
}) {
  const gridRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to 08:00 on mount
  useEffect(() => {
    if (gridRef.current) {
      const hour8 = gridRef.current.querySelector('[data-hour="8"]');
      if (hour8) {
        hour8.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, []);

  // Generate 24 hours
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Check if viewing today
  const isToday = currentDate.toDateString() === new Date().toDateString();

  // Get current hour and minute for time indicator
  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();
  const currentTimePosition = (currentHour * 60 + currentMinute) * (60 / 60); // 60px per hour

  // Group events by hour for rendering
  const getEventsForHour = (hour) => {
    const hourStart = `${String(hour).padStart(2, '0')}:00`;
    const hourEnd = `${String(hour + 1).padStart(2, '0')}:00`;

    return events.filter(event => {
      const eventStart = event.startTime;
      const eventEnd = event.endTime;

      // Check if event overlaps with this hour
      return eventStart < hourEnd && eventEnd > hourStart;
    });
  };

  // Calculate event position and height
  const getEventStyle = (event) => {
    const [startHour, startMin] = event.startTime.split(':').map(Number);
    const [endHour, endMin] = event.endTime.split(':').map(Number);

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const duration = endMinutes - startMinutes;

    // Position from top of grid (60px per hour = 1px per minute)
    const top = startMinutes;
    const height = Math.max(duration, 30); // Minimum 30px height

    return {
      position: 'absolute',
      top: `${top}px`,
      height: `${height}px`,
      left: '0',
      right: '0',
      zIndex: event.eventType === 'SLOT' ? 1 : 2 // Bookings/events above slots
    };
  };

  // Handle double-click on empty time
  const handleTimeClick = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const y = event.clientY - rect.top;
    const clickedMinute = Math.floor(y);
    const hour = Math.floor(clickedMinute / 60);
    const minute = Math.round((clickedMinute % 60) / 15) * 15; // Round to 15min

    const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

    // Convert Date to YYYY-MM-DD string in local timezone
    const dateStr = typeof currentDate === 'string'
      ? currentDate
      : `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;

    if (onCreateSlot) {
      onCreateSlot({ date: dateStr, startTime: timeStr });
    }
  };

  return (
    <div className="day-view">
      {/* All-day section for vacations */}
      {vacations && vacations.length > 0 && (
        <div className="day-view-allday">
          {vacations.map(vacation => (
            <div
              key={vacation.id}
              className="day-view-vacation"
              style={{ backgroundColor: `${vacation.color}33`, borderColor: vacation.color }}
              onClick={() => onEventClick(vacation)}
            >
              <span className="day-view-vacation-icon">🟣</span>
              <span className="day-view-vacation-title">
                {vacation.title} | {vacation.startDate} - {vacation.endDate}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Main calendar grid */}
      <div className="day-view-container" ref={gridRef}>
        {/* Time column */}
        <div className="day-view-times">
          {hours.map(hour => (
            <div key={hour} className="day-view-time-label" data-hour={hour}>
              {String(hour).padStart(2, '0')}:00
            </div>
          ))}
        </div>

        {/* Events area */}
        <div
          className="day-view-events"
          onDoubleClick={handleTimeClick}
        >
          {/* Heat map overlay */}
          {showHeatMap && heatMap && (
            <div className="day-view-heatmap">
              {hours.map(hour => {
                const data = heatMap[hour];
                if (!data) return null;

                const opacity = data.level === 'high' ? 0.25 : data.level === 'medium' ? 0.20 : 0.15;
                const color = data.level === 'high' ? '#10b981' : data.level === 'medium' ? '#eab308' : '#3b82f6';

                return (
                  <div
                    key={hour}
                    className="day-view-heatmap-hour"
                    style={{
                      top: `${hour * 60}px`,
                      height: '60px',
                      backgroundColor: color,
                      opacity
                    }}
                    title={`${data.demandPercent}% booking rate • ${Math.round(data.avgPerWeek)} bookings/week`}
                  />
                );
              })}
            </div>
          )}

          {/* Hour grid lines */}
          {hours.map(hour => (
            <div
              key={hour}
              className="day-view-hour"
              style={{ top: `${hour * 60}px` }}
            >
              <div className="day-view-hour-line" />
              <div className="day-view-halfhour-line" />
            </div>
          ))}

          {/* Current time indicator */}
          {isToday && (
            <div
              className="day-view-current-time"
              style={{ top: `${currentTimePosition}px` }}
            >
              <div className="day-view-current-time-dot" />
              <div className="day-view-current-time-line" />
            </div>
          )}

          {/* Render events */}
          {events.map(event => {
            const style = getEventStyle(event);

            if (event.eventType === 'SLOT') {
              return (
                <div key={event.id} style={style}>
                  <SlotCard
                    slot={event}
                    onClick={() => onEventClick(event)}
                    onEdit={onEditEvent ? () => onEditEvent(event) : null}
                    onDelete={onDeleteEvent ? () => onDeleteEvent(event) : null}
                    onToggleStatus={onToggleSlotStatus ? () => onToggleSlotStatus(event) : null}
                  />
                </div>
              );
            }

            // Skip standalone BOOKING events - they're already rendered inside SlotCard
            if (event.eventType === 'BOOKING') {
              return null;
            }

            if (event.eventType === 'CALENDAR_EVENT') {
              return (
                <div key={event.id} style={style}>
                  <CalendarEventCard
                    event={event}
                    onClick={() => onEventClick(event)}
                    onEdit={onEditEvent ? () => onEditEvent(event) : null}
                    onDelete={onDeleteEvent ? () => onDeleteEvent(event) : null}
                  />
                </div>
              );
            }

            if (event.eventType === 'TIME_BLOCK') {
              return (
                <div key={event.id} style={style}>
                  <TimeBlockCard
                    block={event}
                    onClick={() => onEventClick(event)}
                    onEdit={onEditEvent ? () => onEditEvent(event) : null}
                    onDelete={onDeleteEvent ? () => onDeleteEvent(event) : null}
                  />
                </div>
              );
            }

            return null;
          })}
        </div>
      </div>
    </div>
  );
}

export default DayView;
