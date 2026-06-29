import React from 'react';

/**
 * Toast - Global notification component
 */
function Toast({ message }) {
  if (!message) return null;

  return <div className="toast">{message}</div>;
}

export default Toast;
