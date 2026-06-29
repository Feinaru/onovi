import React from 'react';

/**
 * Input Component
 *
 * Sizes: sm, md, lg
 * States: error, disabled
 * RTL-friendly with className passthrough
 */
function Input({
  type = 'text',
  size = 'md',
  error = false,
  fullWidth = false,
  disabled = false,
  className = '',
  ...props
}) {
  const baseStyles = `
    onovi-input
    block
    border rounded-lg
    transition-all duration-200
    focus:outline-none focus:ring-2
    disabled:bg-neutral-50 disabled:cursor-not-allowed
  `.trim().replace(/\s+/g, ' ');

  const stateStyles = error
    ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500'
    : 'border-neutral-300 focus:border-primary-500 focus:ring-primary-500';

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-5 py-3 text-lg',
  };

  const widthClass = fullWidth ? 'w-full' : '';

  const classes = `
    ${baseStyles}
    ${stateStyles}
    ${sizes[size]}
    ${widthClass}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <input
      type={type}
      className={classes}
      disabled={disabled}
      {...props}
    />
  );
}

export default Input;
