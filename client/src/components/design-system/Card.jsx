import React from 'react';

/**
 * Card Component
 *
 * A container component for grouping related content with consistent styling.
 *
 * @example
 * <Card>
 *   <Card.Header>Case Details</Card.Header>
 *   <Card.Body>Content here</Card.Body>
 * </Card>
 */

const Card = ({ children, className = '', hover = false, padding = 'default', ...props }) => {
  const paddingStyles = {
    none: '',
    sm: 'p-4',
    default: 'p-6',
    lg: 'p-8',
  };

  const classes = `
    bg-white
    rounded-xl
    border border-warm-200
    shadow-sm
    ${hover ? 'hover:shadow-md transition-shadow duration-250' : ''}
    ${paddingStyles[padding]}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

// Card sub-components
Card.Header = ({ children, className = '', ...props }) => (
  <div className={`mb-4 ${className}`} {...props}>
    {typeof children === 'string' ? (
      <h3 className="text-h3 text-warm-900 font-semibold">{children}</h3>
    ) : (
      children
    )}
  </div>
);

Card.Body = ({ children, className = '', ...props }) => (
  <div className={`text-warm-600 ${className}`} {...props}>
    {children}
  </div>
);

Card.Footer = ({ children, className = '', ...props }) => (
  <div className={`mt-4 pt-4 border-t border-warm-200 ${className}`} {...props}>
    {children}
  </div>
);

export default Card;
