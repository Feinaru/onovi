import React, { useState, useRef, useEffect } from 'react';

/**
 * MultiSelectFilter - Multi-select dropdown with chips
 */
function MultiSelectFilter({ label, options, selectedIds, onChange, disabled }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = (id) => {
    const newSelected = selectedIds.includes(id)
      ? selectedIds.filter(i => i !== id)
      : [...selectedIds, id];
    onChange(newSelected);
  };

  const handleClear = () => {
    onChange([]);
    setIsOpen(false);
  };

  const selectedOptions = options.filter(opt => selectedIds.includes(opt.id));

  return (
    <div ref={dropdownRef} style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
      <label style={{ fontSize: '13px', fontWeight: '600', color: '#4b5563', display: 'block', marginBottom: '4px' }}>
        {label}
      </label>

      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{
          padding: '10px 12px',
          border: '1px solid #d1d5db',
          borderRadius: '8px',
          background: disabled ? '#f3f4f6' : 'white',
          cursor: disabled ? 'not-allowed' : 'pointer',
          minHeight: '42px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '4px'
        }}
      >
        {selectedOptions.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', flex: 1 }}>
            {selectedOptions.map(opt => (
              <span
                key={opt.id}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '2px 8px',
                  background: '#eff6ff',
                  color: '#3b82f6',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '500'
                }}
              >
                {opt.nameHebrew || opt.name}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggle(opt.id);
                  }}
                  style={{
                    marginRight: '4px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0 2px',
                    fontSize: '14px',
                    color: '#3b82f6'
                  }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        ) : (
          <span style={{ color: '#9ca3af', fontSize: '14px' }}>
            {disabled ? 'בחר קודם את הקטגוריה הקודמת' : `בחר ${label}`}
          </span>
        )}
        <span style={{ color: '#6b7280' }}>▼</span>
      </div>

      {isOpen && !disabled && options.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          left: 0,
          marginTop: '4px',
          background: 'white',
          border: '1px solid #d1d5db',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          maxHeight: '300px',
          overflowY: 'auto',
          zIndex: 10
        }}>
          <div style={{ padding: '8px' }}>
            {selectedIds.length > 0 && (
              <button
                onClick={handleClear}
                style={{
                  width: '100%',
                  padding: '8px',
                  background: '#f3f4f6',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#6b7280',
                  marginBottom: '4px'
                }}
              >
                נקה הכל
              </button>
            )}
            {options.map(option => (
              <label
                key={option.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '10px 12px',
                  cursor: 'pointer',
                  borderRadius: '6px',
                  transition: 'background 0.15s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(option.id)}
                  onChange={() => handleToggle(option.id)}
                  style={{ marginLeft: '8px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '14px', color: '#374151' }}>
                  {option.nameHebrew || option.name}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default MultiSelectFilter;
