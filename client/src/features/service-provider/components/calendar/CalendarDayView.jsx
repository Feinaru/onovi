import { useEffect, useRef } from 'react';
import CalendarTimeGrid from '../../../../shared/calendar/CalendarTimeGrid';
import CalendarSlotBlock from './CalendarSlotBlock';
import CalendarTimeIndicator from '../../../../shared/calendar/CalendarTimeIndicator';

/**
 * CalendarDayView - Main day view calendar container
 * Displays hourly grid with positioned slot blocks
 */

// Format Date to YYYY-MM-DD in local timezone
function formatDateLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Parse "HH:MM" to minutes since midnight
function parseTime(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

// Compute layout metadata for overlapping slots
function computeSlotLayout(slots) {
  if (slots.length === 0) return [];

  // Add start/end minutes to each slot
  const slotsWithTime = slots.map(slot => ({
    ...slot,
    startMinutes: parseTime(slot.startTime),
    endMinutes: parseTime(slot.endTime)
  }));

  // Sort by start time, then by duration (longer first)
  const sorted = [...slotsWithTime].sort((a, b) => {
    if (a.startMinutes !== b.startMinutes) {
      return a.startMinutes - b.startMinutes;
    }
    return (b.endMinutes - b.startMinutes) - (a.endMinutes - a.startMinutes);
  });

  // Assign columns to slots
  const layoutData = [];
  const columns = []; // Track end time of each column

  for (const slot of sorted) {
    // Find first available column (one that ends before this slot starts)
    let columnIndex = columns.findIndex(endTime => endTime <= slot.startMinutes);

    if (columnIndex === -1) {
      // No available column, create new one
      columnIndex = columns.length;
      columns.push(slot.endMinutes);
    } else {
      // Use this column and update its end time
      columns[columnIndex] = slot.endMinutes;
    }

    layoutData.push({
      slot,
      columnIndex,
      totalColumns: 0 // Will be updated after processing all slots
    });
  }

  // Update totalColumns for each overlap group
  // Group slots that share time ranges
  for (let i = 0; i < layoutData.length; i++) {
    const current = layoutData[i];
    let maxColumns = current.columnIndex + 1;

    // Check all slots that overlap with current slot
    for (let j = 0; j < layoutData.length; j++) {
      if (i === j) continue;
      const other = layoutData[j];

      // Check if slots overlap in time
      const overlaps = !(
        current.slot.endMinutes <= other.slot.startMinutes ||
        current.slot.startMinutes >= other.slot.endMinutes
      );

      if (overlaps) {
        maxColumns = Math.max(maxColumns, other.columnIndex + 1);
      }
    }

    layoutData[i].totalColumns = maxColumns;
  }

  return layoutData;
}

export default function CalendarDayView({ slots, currentDate, onSlotClick }) {
  const containerRef = useRef(null);

  // Filter slots for current date
  const dateStr = formatDateLocal(currentDate);
  const todaySlots = slots.filter(slot => slot.date === dateStr);

  // Compute layout for overlapping slots
  const slotLayout = computeSlotLayout(todaySlots);

  // Auto-scroll to 08:00 on mount or date change
  useEffect(() => {
    if (containerRef.current) {
      const scrollPosition = 8 * 60; // 08:00 = 480px
      containerRef.current.scrollTop = scrollPosition;
    }
  }, [dateStr]);

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">תצוגת יום ({todaySlots.length} תורים)</h3>
      </div>

      <div
        ref={containerRef}
        style={{
          height: '600px',
          overflow: 'auto',
          position: 'relative'
        }}
      >
        {/* Background grid */}
        <CalendarTimeGrid />

        {/* Slot blocks overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: '60px', // Offset for time labels
          right: 0,
          height: '1440px', // 24 hours * 60px
          pointerEvents: 'none'
        }}>
          <div style={{
            position: 'relative',
            height: '100%',
            pointerEvents: 'auto'
          }}>
            {/* Current time indicator */}
            <CalendarTimeIndicator currentDate={currentDate} />

            {todaySlots.length === 0 && (
              <div style={{
                position: 'absolute',
                top: '300px',
                left: 0,
                right: 0,
                textAlign: 'center',
                color: 'var(--text-secondary)',
                fontSize: 'var(--text-lg)'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>📅</div>
                <div>אין זמינות ביום זה</div>
                <div style={{ fontSize: 'var(--text-sm)', marginTop: 'var(--space-2)' }}>
                  לחץ על "פתח זמינות חדשה" למעלה כדי ליצור זמינות
                </div>
              </div>
            )}

            {slotLayout.map(({ slot, columnIndex, totalColumns }) => (
              <CalendarSlotBlock
                key={slot.id}
                slot={slot}
                onClick={onSlotClick}
                columnIndex={columnIndex}
                totalColumns={totalColumns}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
