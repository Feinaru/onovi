/**
 * CalendarSlotBlock - Visual representation of a slot in the day view calendar
 * Positioned absolutely based on start/end time
 */

// Parse "HH:MM" to minutes since midnight
function parseTime(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

export default function CalendarSlotBlock({ slot, onClick, columnIndex = 0, totalColumns = 1 }) {
  // Calculate position
  const startMinutes = parseTime(slot.startTime);
  const endMinutes = parseTime(slot.endTime);
  const duration = endMinutes - startMinutes;

  // Position: 1px per minute
  const top = startMinutes;
  const height = Math.max(duration, 30); // Minimum 30px

  // Calculate horizontal position for overlapping slots
  const gapPercent = 0.5; // 0.5% gap between columns
  const widthPercent = (100 / totalColumns) - gapPercent;
  const leftPercent = (columnIndex * 100 / totalColumns) + (gapPercent / 2);

  // Status styling
  const statusColors = {
    OPEN: { bg: '#10b981', text: '#fff', label: 'פנוי' },
    FULL: { bg: '#f59e0b', text: '#fff', label: 'מלא' },
    CANCELLED: { bg: '#6b7280', text: '#fff', label: 'בוטל' }
  };

  const statusStyle = statusColors[slot.status] || statusColors.OPEN;

  // Get service names
  const serviceNames = slot.allowedServices && slot.allowedServices.length > 0
    ? slot.allowedServices.map(s => s.name).join(', ')
    : 'ללא שירותים';

  // Count bookings
  const bookingCount = slot.bookings ? slot.bookings.length : 0;

  // Format booking count in Hebrew
  const bookingLabel = bookingCount === 1 ? '1 הזמנה' : `${bookingCount} הזמנות`;

  // Visual adjustments for status
  const isFull = slot.status === 'FULL';
  const isCancelled = slot.status === 'CANCELLED';

  return (
    <div
      onClick={() => onClick(slot)}
      style={{
        position: 'absolute',
        top: `${top}px`,
        left: `${leftPercent}%`,
        width: `${widthPercent}%`,
        height: `${height}px`,
        background: statusStyle.bg,
        borderRadius: '6px',
        padding: '8px',
        cursor: 'pointer',
        boxShadow: 'var(--shadow-sm)',
        transition: 'transform 0.1s, box-shadow 0.1s',
        color: statusStyle.text,
        fontSize: 'var(--text-sm)',
        overflow: 'hidden',
        zIndex: 10,
        opacity: isCancelled ? 0.6 : 1,
        border: isFull ? '2px solid rgba(0, 0, 0, 0.2)' : 'none'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.02)';
        e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
        e.currentTarget.style.zIndex = '20';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
        e.currentTarget.style.zIndex = '10';
      }}
    >
      {/* Time range */}
      <div style={{
        fontWeight: 'var(--font-semibold)',
        marginBottom: '4px',
        fontSize: 'var(--text-sm)'
      }}>
        {slot.startTime} - {slot.endTime}
      </div>

      {/* Services */}
      {height > 50 && (
        <div style={{
          fontSize: '12px',
          opacity: 0.9,
          marginBottom: '4px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {serviceNames}
        </div>
      )}

      {/* Status & Price */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '11px',
        opacity: 0.85
      }}>
        <span>{statusStyle.label}</span>
        {slot.regularPrice && (
          <span>₪{slot.regularPrice}</span>
        )}
      </div>

      {/* Booking count badge */}
      {bookingCount > 0 && height > 40 && (
        <div style={{
          position: 'absolute',
          top: '4px',
          right: '4px',
          background: 'rgba(255, 255, 255, 0.95)',
          color: statusStyle.bg,
          borderRadius: '10px',
          padding: '2px 6px',
          fontSize: '10px',
          fontWeight: 'var(--font-bold)',
          whiteSpace: 'nowrap',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
        }}>
          {bookingLabel}
        </div>
      )}

      {/* Simple count for smaller slots */}
      {bookingCount > 0 && height <= 40 && (
        <div style={{
          position: 'absolute',
          top: '4px',
          right: '4px',
          background: 'rgba(255, 255, 255, 0.9)',
          color: statusStyle.bg,
          borderRadius: '50%',
          width: '18px',
          height: '18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '11px',
          fontWeight: 'var(--font-bold)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
        }}>
          {bookingCount}
        </div>
      )}
    </div>
  );
}
