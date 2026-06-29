import React from 'react';

/**
 * EmptyState Component
 *
 * Display empty states with icon, title, description, and optional action
 * RTL-friendly with className passthrough
 */
function EmptyState({
  icon = '📭',
  title,
  description,
  action,
  className = '',
  ...props
}) {
  const baseStyles = `
    onovi-empty-state
    flex flex-col items-center justify-center
    text-center
    py-12 px-4
  `.trim().replace(/\s+/g, ' ');

  const classes = `${baseStyles} ${className}`.trim();

  return (
    <div className={classes} {...props}>
      {icon && (
        <div className="text-6xl mb-4 opacity-50">
          {icon}
        </div>
      )}
      {title && (
        <h3 className="text-xl font-semibold text-neutral-900 mb-2">
          {title}
        </h3>
      )}
      {description && (
        <p className="text-neutral-600 mb-6 max-w-md">
          {description}
        </p>
      )}
      {action && (
        <div className="mt-4">
          {action}
        </div>
      )}
    </div>
  );
}

export default EmptyState;
