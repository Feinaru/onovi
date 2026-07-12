import React from 'react';
import CalendarViewSwitcher from './CalendarViewSwitcher';
import CalendarToolbar from './CalendarToolbar';

/**
 * CalendarShell - Reusable wrapper for calendar views
 * Combines toolbar, view switcher, and content area
 * Role-agnostic, no internal state or data fetching
 */
export default function CalendarShell({
  children,
  currentDate,
  currentView,
  availableViews = ['day', 'week', 'month'],
  disabledViews = [],
  onViewChange,
  onPrevious,
  onNext,
  onToday,
  title,
  subtitle,
  showViewSwitcher = true,
  className = '',
  contentClassName = ''
}) {
  return (
    <div className={className}>
      {/* View Switcher */}
      {showViewSwitcher && (
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <CalendarViewSwitcher
            currentView={currentView}
            onViewChange={onViewChange}
            availableViews={availableViews}
            disabledViews={disabledViews}
          />
        </div>
      )}

      {/* Toolbar */}
      <CalendarToolbar
        currentDate={currentDate}
        currentView={currentView}
        onPrevious={onPrevious}
        onNext={onNext}
        onToday={onToday}
        title={title}
        subtitle={subtitle}
      />

      {/* Calendar Content */}
      <div className={contentClassName}>
        {children}
      </div>
    </div>
  );
}
