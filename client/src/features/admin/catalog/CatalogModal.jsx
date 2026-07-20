import React from 'react';

/**
 * CatalogModal - thin wrapper around the shared .modal-backdrop / .modal styles.
 * Provides a title, close button, and backdrop-click-to-close. RTL by default.
 */
export default function CatalogModal({ title, onClose, children }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onClose} aria-label="סגור">
          ✕
        </button>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
        </div>
        {children}
      </div>
    </div>
  );
}
