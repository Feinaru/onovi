import React from 'react';

/**
 * Card Component
 *
 * Variants: default, bordered, elevated
 * Padding: none, sm, md, lg
 * RTL-friendly with className passthrough
 */
function Card({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  ...props
}) {
  const baseStyles = `
    onovi-card
    bg-white
    transition-shadow duration-200
  `.trim().replace(/\s+/g, ' ');

  const variants = {
    default: 'rounded-lg shadow-sm',
    bordered: 'rounded-lg border border-neutral-200',
    elevated: 'rounded-xl shadow-md hover:shadow-lg',
  };

  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const classes = `
    ${baseStyles}
    ${variants[variant]}
    ${paddings[padding]}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}

export default Card;
