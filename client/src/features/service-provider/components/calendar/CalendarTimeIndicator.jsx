import { useState, useEffect } from 'react';

/**
 * CalendarTimeIndicator - Shows current time as a red line
 * Only renders when viewing today
 */

// Format Date to YYYY-MM-DD in local timezone
function formatDateLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Get current time in minutes since midnight
function getCurrentMinutes() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

// Format time as HH:MM
function formatTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

export default function CalendarTimeIndicator({ currentDate }) {
  const [currentMinutes, setCurrentMinutes] = useState(getCurrentMinutes());

  // Check if viewing today
  const today = formatDateLocal(new Date());
  const viewingDate = formatDateLocal(currentDate);
  const isToday = today === viewingDate;

  // Update current time every minute
  useEffect(() => {
    if (!isToday) return;

    const interval = setInterval(() => {
      setCurrentMinutes(getCurrentMinutes());
    }, 60000); // Update every 60 seconds

    return () => clearInterval(interval);
  }, [isToday]);

  // Don't render if not viewing today
  if (!isToday) return null;

  const top = currentMinutes; // 1px per minute
  const timeLabel = formatTime(currentMinutes);

  return (
    <div
      style={{
        position: 'absolute',
        top: `${top}px`,
        left: 0,
        right: 0,
        height: '2px',
        background: '#ef4444',
        zIndex: 5,
        pointerEvents: 'none'
      }}
    >
      {/* Time label */}
      <div
        style={{
          position: 'absolute',
          left: '-50px',
          top: '-8px',
          fontSize: '11px',
          fontWeight: 'var(--font-semibold)',
          color: '#ef4444',
          background: 'var(--bg-primary)',
          padding: '2px 4px',
          borderRadius: '3px',
          whiteSpace: 'nowrap'
        }}
      >
        {timeLabel}
      </div>

      {/* Red dot at the start of line */}
      <div
        style={{
          position: 'absolute',
          left: '-6px',
          top: '-4px',
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          background: '#ef4444',
          border: '2px solid var(--bg-primary)'
        }}
      />
    </div>
  );
}
