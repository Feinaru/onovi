import React from 'react';

/**
 * IconPicker - choose a catalog icon from a curated emoji palette instead of
 * typing free text. Stores/returns the selected emoji string (same shape the
 * backend already expects for `icon`). No external dependency.
 */
const ICONS = [
  '🩺', '🦷', '👁️', '💊', '🧑‍⚕️', '🏥', '🧴', '💆',
  '💇', '💅', '✂️', '🪒', '💄', '🧖', '🧘', '🏋️',
  '🍽️', '☕', '🎓', '📚', '🐾', '🐶', '🔧', '🚗',
  '📷', '🎨', '🎵', '⚖️', '🧹', '🌿', '👶', '💍'
];

export default function IconPicker({ value, onChange }) {
  return (
    <div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 'var(--space-2)',
          padding: 'var(--space-3)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          maxHeight: '160px',
          overflowY: 'auto'
        }}
      >
        {ICONS.map((icon) => {
          const selected = value === icon;
          return (
            <button
              key={icon}
              type="button"
              onClick={() => onChange(icon)}
              aria-pressed={selected}
              title={icon}
              style={{
                fontSize: 'var(--text-xl)',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                borderRadius: 'var(--radius-md)',
                border: selected ? '2px solid var(--primary-500)' : '1px solid var(--border-subtle)',
                background: selected ? 'var(--primary-50)' : 'var(--bg-elevated)'
              }}
            >
              {icon}
            </button>
          );
        })}
      </div>
      <div className="flex gap-2" style={{ marginTop: 'var(--space-2)', alignItems: 'center' }}>
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
          נבחר: <span style={{ fontSize: 'var(--text-xl)' }}>{value || '—'}</span>
        </span>
        {value && (
          <button type="button" className="btn-sm btn-secondary" onClick={() => onChange('')}>
            נקה
          </button>
        )}
      </div>
    </div>
  );
}
