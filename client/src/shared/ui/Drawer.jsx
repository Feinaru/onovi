import React from 'react';
import './Drawer.css';

/**
 * Drawer - Reusable slide-in panel from the right
 * Used for detail views without navigation
 */
function Drawer({ isOpen, onClose, title, children, width = '600px' }) {
  if (!isOpen) return null;

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="drawer" style={{ width }}>
        <div className="drawer-header">
          <h2 className="drawer-title">{title}</h2>
          <button className="drawer-close" onClick={onClose} aria-label="סגור">
            ✕
          </button>
        </div>
        <div className="drawer-content">
          {children}
        </div>
      </div>
    </>
  );
}

export default Drawer;
