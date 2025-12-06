import React from 'react';

/**
 * Input Component
 *
 * Form input with consistent styling and states.
 *
 * @example
 * <Input
 *   label="Email Address"
 *   type="email"
 *   placeholder="your.email@company.com"
 *   error="Invalid email"
 * />
 */

const Input = React.forwardRef(({
  label,
  error,
  helpText,
  icon,
  iconPosition = 'left',
  fullWidth = true,
  className = '',
  ...props
}, ref) => {
  const hasError = Boolean(error);

  const inputClasses = `
    w-full
    px-4 py-2.5
    text-body text-warm-900
    bg-white
    border rounded-lg
    ${hasError ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500' : 'border-warm-300 focus:border-primary-500 focus:ring-primary-500'}
    focus:outline-none focus:ring-2 focus:ring-opacity-30
    placeholder:text-warm-400
    disabled:bg-warm-100 disabled:cursor-not-allowed
    transition-colors duration-250
    ${icon && iconPosition === 'left' ? 'pl-10' : ''}
    ${icon && iconPosition === 'right' ? 'pr-10' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label className="block text-sm font-medium text-warm-700 mb-2">
          {label}
          {props.required && <span className="text-danger-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {icon && iconPosition === 'left' && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-400">
            {icon}
          </div>
        )}

        <input
          ref={ref}
          className={inputClasses}
          {...props}
        />

        {icon && iconPosition === 'right' && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-400">
            {icon}
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1.5 text-sm text-danger-600">{error}</p>
      )}

      {helpText && !error && (
        <p className="mt-1.5 text-sm text-warm-500">{helpText}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
