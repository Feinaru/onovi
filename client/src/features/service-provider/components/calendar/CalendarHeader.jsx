/**
 * CalendarHeader - Navigation controls for day view calendar
 * Previous day / Next day / Today buttons with date display
 */

// Format date to Hebrew-friendly display
function formatDateDisplay(date) {
  const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  const dayName = days[date.getDay()];
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  return `${dayName}, ${day}.${month}.${year}`;
}

export default function CalendarHeader({ currentDate, onPreviousDay, onNextDay, onToday }) {
  const isToday = currentDate.toDateString() === new Date().toDateString();

  return (
    <div style={{
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
    }}>
      {/* Date Display */}
      <div style={{
        fontSize: 'var(--text-lg)',
        fontWeight: 'var(--font-semibold)',
        color: 'var(--text-primary)'
      }}>
        {formatDateDisplay(currentDate)}
      </div>

      {/* Navigation Buttons */}
      <div style={{
        display: 'flex',
        gap: 'var(--space-2)'
      }}>
        <button
          className="btn-secondary"
          onClick={onPreviousDay}
          title="יום קודם"
        >
          ←
        </button>

        <button
          className="btn-secondary"
          onClick={onToday}
          disabled={isToday}
          style={{
            opacity: isToday ? 0.5 : 1,
            cursor: isToday ? 'not-allowed' : 'pointer'
          }}
        >
          היום
        </button>

        <button
          className="btn-secondary"
          onClick={onNextDay}
          title="יום הבא"
        >
          →
        </button>
      </div>
    </div>
  );
}
