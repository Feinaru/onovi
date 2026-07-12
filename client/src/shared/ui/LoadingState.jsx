import React from 'react';

/**
 * LoadingState Component
 *
 * Display consistent loading states with icon/emoji, title, and optional subtitle
 * RTL-friendly with className passthrough
 */
function LoadingState({
  icon = '⏳',
  title = 'טוען נתונים...',
  subtitle,
  size = 'md',
  className = '',
  ...props
}) {
  const iconSize = size === 'sm' ? 'text-4xl' : 'text-6xl';
  const titleSize = size === 'sm' ? 'text-base' : 'text-lg';

  const baseStyles = `
    onovi-loading-state
    flex flex-col items-center justify-center
    text-center
    py-8 px-4
  `.trim().replace(/\s+/g, ' ');

  const classes = `${baseStyles} ${className}`.trim();

  return (
    <div className={classes} {...props}>
      {icon && (
        <div className={`${iconSize} mb-4 opacity-60`}>
          {icon}
        </div>
      )}
      {title && (
        <div className={`${titleSize} text-neutral-600`}>
          {title}
        </div>
      )}
      {subtitle && (
        <div className="text-sm text-neutral-500 mt-2">
          {subtitle}
        </div>
      )}
    </div>
  );
}

export default LoadingState;
