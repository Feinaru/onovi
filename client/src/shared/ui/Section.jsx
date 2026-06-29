import React from 'react';

/**
 * Section Component
 *
 * Content section with optional title and description
 * RTL-friendly with className passthrough
 */
function Section({
  children,
  title,
  description,
  spacing = 'md',
  className = '',
  ...props
}) {
  const baseStyles = 'onovi-section';

  const spacings = {
    sm: 'mb-6',
    md: 'mb-8',
    lg: 'mb-12',
  };

  const classes = `
    ${baseStyles}
    ${spacings[spacing]}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <section className={classes} {...props}>
      {(title || description) && (
        <div className="mb-6">
          {title && (
            <h2 className="text-2xl font-semibold text-neutral-900 mb-2">
              {title}
            </h2>
          )}
          {description && (
            <p className="text-neutral-600">
              {description}
            </p>
          )}
        </div>
      )}
      {children}
    </section>
  );
}

export default Section;
