import React from 'react';
import QuickActionsMenu from './QuickActionsMenu';
import './TimeBlockCard.css';

/**
 * TimeBlockCard - Break, lunch, personal time, etc.
 */
function TimeBlockCard({ block, onClick, onEdit, onDelete }) {
  return (
    <div
      className={`time-block-card ${block.isRecurring ? 'recurring' : ''}`}
      onClick={onClick}
      style={{
        backgroundColor: `${block.color}26`,
        borderLeftColor: block.color
      }}
    >
      {/* Header */}
      <div className="time-block-header">
        <div className="time-block-title-row">
          <span className="time-block-icon">🟡</span>
          <span className="time-block-title">{block.title}</span>
        </div>
        <QuickActionsMenu
          event={block}
          onView={onClick}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>

      {/* Recurring badge */}
      {block.isRecurring && (
        <div className="time-block-recurring">
          <span>↻ Recurring</span>
        </div>
      )}
    </div>
  );
}

export default TimeBlockCard;
