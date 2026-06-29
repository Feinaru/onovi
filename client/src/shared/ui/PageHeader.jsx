import React from 'react';

/**
 * PageHeader Component
 *
 * Consistent page header with title, description, and optional actions
 * RTL-friendly with className passthrough
 */
function PageHeader({
  title,
  description,
  actions,
  className = '',
  ...props
}) {
  const baseStyles = `
    onovi-page-header
    flex items-start justify-between
    mb-8
  `.trim().replace(/\s+/g, ' ');

  const classes = `${baseStyles} ${className}`.trim();

  return (
    <div className={classes} {...props}>
      <div className="flex-1">
        {title && (
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            {title}
          </h1>
        )}
        {description && (
          <p className="text-lg text-neutral-600">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-3 ms-4">
          {actions}
        </div>
      )}
    </div>
  );
}

export default PageHeader;
