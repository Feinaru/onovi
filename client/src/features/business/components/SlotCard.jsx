import React from 'react';

/**
 * SlotCard - Single slot row in table
 */
function SlotCard({ slot, onEdit, onDelete }) {
  return (
    <tr>
      <td style={{ fontWeight: 'var(--font-semibold)' }}>
        {slot.service?.name || 'שירות'}
      </td>
      <td>{slot.date}</td>
      <td>{slot.startTime}-{slot.endTime}</td>
      <td>
        {slot.dealPrice && slot.dealPrice < slot.regularPrice ? (
          <span>
            <span style={{ color: 'var(--primary-600)', fontWeight: 'var(--font-bold)' }}>
              ₪{slot.dealPrice}
            </span>
            {' '}
            <span style={{
              textDecoration: 'line-through',
              color: 'var(--text-tertiary)',
              fontSize: 'var(--text-sm)'
            }}>
              ₪{slot.regularPrice}
            </span>
          </span>
        ) : (
          <span>₪{slot.regularPrice}</span>
        )}
      </td>
      <td>
        <span className={`badge ${
          slot.status === 'OPEN' ? 'badge-success' :
          slot.status === 'BOOKED' ? 'badge-primary' :
          'badge-gray'
        }`}>
          {slot.status === 'OPEN' ? '✓ פתוח' :
           slot.status === 'BOOKED' ? '📋 מוזמן' :
           slot.status}
        </span>
      </td>
      <td>
        <div className="flex gap-2">
          <button className="btn-sm btn-secondary" onClick={() => onEdit(slot)}>
            ✏️ ערוך
          </button>
          <button className="btn-sm btn-danger" onClick={() => onDelete(slot.id)}>
            🗑️ מחק
          </button>
        </div>
      </td>
    </tr>
  );
}

export default SlotCard;
