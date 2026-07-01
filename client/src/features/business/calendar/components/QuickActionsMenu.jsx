import React, { useState, useRef, useEffect } from 'react';
import './QuickActionsMenu.css';

/**
 * QuickActionsMenu - Context menu for calendar events
 */
function QuickActionsMenu({ event, onView, onEdit, onDelete, onToggleStatus, onCancelBooking }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  function handleAction(action) {
    setIsOpen(false);
    action();
  }

  function getActions() {
    const actions = [];

    // Always allow viewing details
    actions.push({
      icon: '👁️',
      label: 'הצג פרטים',
      onClick: () => handleAction(onView),
    });

    if (event.eventType === 'SLOT') {
      const hasBookings = event.bookings && event.bookings.length > 0;

      if (onEdit && !hasBookings) {
        actions.push({
          icon: '✏️',
          label: 'ערוך',
          onClick: () => handleAction(onEdit),
        });
      }

      if (onToggleStatus) {
        if (event.status === 'OPEN') {
          actions.push({
            icon: '❌',
            label: 'הסר מפרסום',
            onClick: () => handleAction(onToggleStatus),
          });
        } else if (!hasBookings) {
          actions.push({
            icon: '✅',
            label: 'פרסם מחדש',
            onClick: () => handleAction(onToggleStatus),
          });
        }
      }

      if (onDelete && !hasBookings) {
        actions.push({
          icon: '🗑️',
          label: 'מחק',
          onClick: () => handleAction(onDelete),
          danger: true,
        });
      }
    } else if (event.eventType === 'BOOKING') {
      const canCancel = event.status === 'CONFIRMED' || event.status === 'PENDING';

      if (onCancelBooking && canCancel) {
        actions.push({
          icon: '❌',
          label: 'בטל הזמנה',
          onClick: () => handleAction(onCancelBooking),
          danger: true,
        });
      }
    } else if (event.eventType === 'CALENDAR_EVENT' || event.eventType === 'TIME_BLOCK') {
      if (onEdit) {
        actions.push({
          icon: '✏️',
          label: 'ערוך',
          onClick: () => handleAction(onEdit),
        });
      }

      if (onDelete) {
        actions.push({
          icon: '🗑️',
          label: 'מחק',
          onClick: () => handleAction(onDelete),
          danger: true,
        });
      }
    } else if (event.eventType === 'VACATION') {
      if (onEdit) {
        actions.push({
          icon: '✏️',
          label: 'ערוך',
          onClick: () => handleAction(onEdit),
        });
      }

      if (onDelete) {
        actions.push({
          icon: '🗑️',
          label: 'מחק',
          onClick: () => handleAction(onDelete),
          danger: true,
        });
      }
    }

    return actions;
  }

  const actions = getActions();

  return (
    <div className="quick-actions-menu" ref={menuRef}>
      <button
        className="quick-actions-trigger"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        title="פעולות"
      >
        ⋯
      </button>

      {isOpen && (
        <div className="quick-actions-dropdown">
          {actions.map((action, idx) => (
            <button
              key={idx}
              className={`quick-action-item ${action.danger ? 'danger' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                action.onClick();
              }}
            >
              <span className="quick-action-icon">{action.icon}</span>
              <span className="quick-action-label">{action.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default QuickActionsMenu;
