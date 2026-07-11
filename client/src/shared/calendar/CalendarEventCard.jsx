import React from 'react';
import { getCalendarStatusMeta } from './utils/statusColors';

/**
 * CalendarEventCard - Read-only event card for calendar views
 * Shows time, title, subtitle, and status
 */
export default function CalendarEventCard({ event, compact = false }) {
  const statusMeta = getCalendarStatusMeta(event.status);

  if (compact) {
    // Compact mode for inline display
    return (
      <div
        onClick={event.onClick}
        style={{
          padding: 'var(--space-2)',
          background: statusMeta.bgColor,
          borderRight: `4px solid ${statusMeta.borderColor}`,
          borderRadius: 'var(--radius-md)',
          cursor: 'pointer',
          transition: 'transform 0.1s',
          marginBottom: 'var(--space-2)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateX(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateX(0)';
        }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--space-1)'
        }}>
          <span style={{
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--font-semibold)',
            color: statusMeta.textColor
          }}>
            {event.startTime} - {event.endTime}
          </span>
          <span style={{
            fontSize: 'var(--text-xs)',
            color: statusMeta.textColor,
            opacity: 0.8
          }}>
            {statusMeta.label}
          </span>
        </div>
        <div style={{
          fontSize: 'var(--text-sm)',
          fontWeight: 'var(--font-medium)',
          color: 'var(--text-primary)',
          marginBottom: 'var(--space-1)'
        }}>
          {event.title}
        </div>
        {event.subtitle && (
          <div style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--text-secondary)'
          }}>
            {event.subtitle}
          </div>
        )}
      </div>
    );
  }

  // Full card mode
  return (
    <div
      onClick={event.onClick}
      style={{
        padding: 'var(--space-3)',
        background: 'var(--bg-primary)',
        border: `1px solid ${statusMeta.borderColor}`,
        borderRight: `4px solid ${statusMeta.borderColor}`,
        borderRadius: 'var(--radius-lg)',
        cursor: 'pointer',
        transition: 'all 0.2s',
        marginBottom: 'var(--space-3)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        e.currentTarget.style.transform = 'translateX(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'translateX(0)';
      }}
    >
      {/* Time and Status */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 'var(--space-2)'
      }}>
        <span style={{
          fontSize: 'var(--text-base)',
          fontWeight: 'var(--font-semibold)',
          color: 'var(--text-primary)'
        }}>
          ⏰ {event.startTime} - {event.endTime}
        </span>
        <span style={{
          fontSize: 'var(--text-sm)',
          padding: '4px 8px',
          borderRadius: 'var(--radius-md)',
          background: statusMeta.bgColor,
          color: statusMeta.textColor,
          fontWeight: 'var(--font-medium)'
        }}>
          {statusMeta.label}
        </span>
      </div>

      {/* Title */}
      <div style={{
        fontSize: 'var(--text-lg)',
        fontWeight: 'var(--font-semibold)',
        color: 'var(--text-primary)',
        marginBottom: 'var(--space-1)'
      }}>
        📍 {event.title}
      </div>

      {/* Subtitle */}
      {event.subtitle && (
        <div style={{
          fontSize: 'var(--text-base)',
          color: 'var(--text-secondary)'
        }}>
          {event.subtitle}
        </div>
      )}
    </div>
  );
}
