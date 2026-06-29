import React from 'react';

/**
 * Button Component
 *
 * Variants: primary, secondary, ghost, danger
 * Sizes: sm, md, lg
 * RTL-friendly with className passthrough
 */
function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  type = 'button',
  className = '',
  onClick,
  ...props
}) {
  const baseStyles = `
    onovi-btn
    inline-flex items-center justify-center
    font-medium
    transition-all duration-200
    border border-transparent
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
  `.trim().replace(/\s+/g, ' ');

  const variants = {
    primary: 'bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500',
    secondary: 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200 focus:ring-neutral-500',
    ghost: 'bg-transparent text-neutral-700 hover:bg-neutral-100 focus:ring-neutral-500',
    danger: 'bg-danger-500 text-white hover:bg-danger-600 focus:ring-danger-500',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm rounded-md',
    md: 'px-4 py-2 text-base rounded-lg',
    lg: 'px-6 py-3 text-lg rounded-lg',
  };

  const widthClass = fullWidth ? 'w-full' : '';

  const classes = `
    ${baseStyles}
    ${variants[variant]}
    ${sizes[size]}
    ${widthClass}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
