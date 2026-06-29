import React from 'react';

/**
 * Badge Component
 *
 * Variants: primary, success, warning, danger, neutral
 * Sizes: sm, md, lg
 * RTL-friendly with className passthrough
 */
function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
  ...props
}) {
  const baseStyles = `
    onovi-badge
    inline-flex items-center justify-center
    font-medium
    rounded-full
  `.trim().replace(/\s+/g, ' ');

  const variants = {
    primary: 'bg-primary-100 text-primary-700',
    success: 'bg-success-50 text-success-700',
    warning: 'bg-warning-50 text-warning-700',
    danger: 'bg-danger-50 text-danger-700',
    neutral: 'bg-neutral-100 text-neutral-700',
    accent: 'bg-accent-50 text-accent-700',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  const classes = `
    ${baseStyles}
    ${variants[variant]}
    ${sizes[size]}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <span className={classes} {...props}>
      {children}
    </span>
  );
}

export default Badge;
