import React from 'react';

/**
 * Bottom-right toast for catalog feedback. Reuses the shared .toast /
 * .toast-success / .toast-error classes from styles.css (fixed bottom-right,
 * slideInRight animation) — no global restyle.
 */
export default function CatalogToast({ toast }) {
  if (!toast) return null;
  const cls = toast.type === 'error' ? 'toast toast-error' : 'toast toast-success';
  return (
    <div className={cls} role="status">
      {toast.type === 'error' ? '⚠️ ' : '✓ '}{toast.text}
    </div>
  );
}
