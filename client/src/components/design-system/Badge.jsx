import React from 'react';

/**
 * Badge Component
 *
 * Small status indicator or label.
 *
 * @example
 * <Badge variant="success">Resolved</Badge>
 * <Badge variant="warning" size="sm">Pending</Badge>
 */

const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  ...props
}) => {
  const variantStyles = {
    default: 'bg-warm-100 text-warm-700',
    primary: 'bg-primary-100 text-primary-700',
    accent: 'bg-accent-100 text-accent-700',
    admin: 'bg-admin-100 text-admin-700',
    success: 'bg-success-100 text-success-700',
    warning: 'bg-warning-100 text-warning-700',
    danger: 'bg-danger-100 text-danger-700',
    info: 'bg-info-100 text-info-700',
    safe: 'bg-green-100 text-green-700',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  const classes = `
    inline-flex items-center gap-1
    font-medium
    rounded-md
    ${variantStyles[variant]}
    ${sizeStyles[size]}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <span className={classes} {...props}>
      {children}
    </span>
  );
};

export default Badge;
