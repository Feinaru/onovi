/**
 * CalendarTimeGrid - 24-hour background grid for day view calendar
 * Displays hourly rows from 00:00 to 23:00
 */
export default function CalendarTimeGrid() {
  // Generate 24 hours (0-23)
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '60px 1fr',
      minHeight: '1440px', // 24 hours * 60px
      position: 'relative',
      background: 'var(--bg-primary)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden'
    }}>
      {/* Time labels column */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        borderLeft: '1px solid var(--border-subtle)'
      }}>
        {hours.map(hour => (
          <div
            key={hour}
            style={{
              height: '60px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'var(--text-sm)',
              color: 'var(--text-secondary)',
              borderBottom: '1px solid var(--border-subtle)',
              fontWeight: hour % 3 === 0 ? 'var(--font-semibold)' : 'normal'
            }}
          >
            {String(hour).padStart(2, '0')}:00
          </div>
        ))}
      </div>

      {/* Calendar grid area */}
      <div style={{
        position: 'relative',
        borderRight: '1px solid var(--border-subtle)'
      }}>
        {/* Grid lines */}
        {hours.map(hour => (
          <div
            key={hour}
            style={{
              position: 'absolute',
              top: `${hour * 60}px`,
              left: 0,
              right: 0,
              height: '60px',
              borderBottom: '1px solid var(--border-subtle)',
              pointerEvents: 'none'
            }}
          />
        ))}
      </div>
    </div>
  );
}
