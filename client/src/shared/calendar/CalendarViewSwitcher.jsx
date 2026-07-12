import React from 'react';

/**
 * CalendarViewSwitcher - Reusable day/week/month view switcher
 * Role-agnostic component for switching between calendar views
 */
export default function CalendarViewSwitcher({
  currentView,
  onViewChange,
  availableViews = ['day', 'week', 'month'],
  disabledViews = [],
  className = ''
}) {
  const viewLabels = {
    day: 'יום',
    week: 'שבוע',
    month: 'חודש'
  };

  const views = ['day', 'week', 'month'];

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        gap: 'var(--space-2)',
        background: 'var(--bg-secondary)',
        padding: 'var(--space-1)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)'
      }}
    >
      {views.map(view => {
        if (!availableViews.includes(view)) return null;

        const isActive = currentView === view;
        const isDisabled = disabledViews.includes(view);

        return (
          <button
            key={view}
            onClick={() => !isActive && !isDisabled && onViewChange(view)}
            disabled={isDisabled}
            style={{
              padding: 'var(--space-2) var(--space-4)',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: isActive ? 'var(--bg-primary)' : 'transparent',
              color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: isActive ? 'var(--font-semibold)' : 'var(--font-normal)',
              cursor: isDisabled ? 'not-allowed' : (isActive ? 'default' : 'pointer'),
              opacity: isDisabled ? 0.5 : 1,
              transition: 'all 0.2s ease',
              fontSize: 'var(--text-sm)',
              boxShadow: isActive ? 'var(--shadow-sm)' : 'none'
            }}
          >
            {viewLabels[view]}
          </button>
        );
      })}
    </div>
  );
}
