import React from 'react';

/**
 * Button Component
 *
 * A reusable button following the ConductOS design system.
 * Automatically adapts accent colors based on user role context.
 *
 * @example
 * <Button variant="primary" size="md">Submit Report</Button>
 * <Button variant="secondary" icon={<Icon />}>Cancel</Button>
 */

const Button = React.forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  role = 'employee', // 'employee' | 'ic' | 'admin'
  fullWidth = false,
  icon,
  iconPosition = 'left',
  disabled = false,
  loading = false,
  className = '',
  ...props
}, ref) => {

  // Base styles
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-250 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  // Variant styles with role-specific colors
  const variantStyles = {
    primary: {
      employee: 'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 focus:ring-primary-500',
      ic: 'bg-accent-600 text-white hover:bg-accent-700 active:bg-accent-800 focus:ring-accent-500',
      admin: 'bg-admin-600 text-white hover:bg-admin-700 active:bg-admin-800 focus:ring-admin-500',
    },
    secondary: 'bg-white text-warm-700 border-2 border-warm-300 hover:bg-warm-50 active:bg-warm-100 focus:ring-warm-500',
    outline: {
      employee: 'bg-transparent text-primary-600 border-2 border-primary-600 hover:bg-primary-50 active:bg-primary-100 focus:ring-primary-500',
      ic: 'bg-transparent text-accent-600 border-2 border-accent-600 hover:bg-accent-50 active:bg-accent-100 focus:ring-accent-500',
      admin: 'bg-transparent text-admin-600 border-2 border-admin-600 hover:bg-admin-50 active:bg-admin-100 focus:ring-admin-500',
    },
    ghost: 'bg-transparent text-warm-700 hover:bg-warm-100 active:bg-warm-200 focus:ring-warm-500',
    danger: 'bg-danger-600 text-white hover:bg-danger-700 active:bg-danger-800 focus:ring-danger-500',
  };

  // Size styles
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2.5 text-base gap-2',
    lg: 'px-6 py-3 text-lg gap-2.5',
  };

  // Get variant style based on role
  const getVariantStyle = () => {
    if (typeof variantStyles[variant] === 'object' && variantStyles[variant][role]) {
      return variantStyles[variant][role];
    }
    return variantStyles[variant];
  };

  const classes = `
    ${baseStyles}
    ${getVariantStyle()}
    ${sizeStyles[size]}
    ${fullWidth ? 'w-full' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={classes}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {icon && iconPosition === 'left' && !loading && icon}
      {children}
      {icon && iconPosition === 'right' && !loading && icon}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
