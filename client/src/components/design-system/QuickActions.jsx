import React from 'react';

/**
 * QuickActions Component
 *
 * Displays suggested actions as chips/buttons in the chat interface.
 * Helps users get started or perform common actions quickly.
 *
 * @example
 * <QuickActions
 *   title="How can I help?"
 *   actions={[
 *     { label: "Report harassment", icon: <Icon />, onClick: handleReport },
 *     { label: "Check case status", onClick: handleStatus }
 *   ]}
 * />
 */

const QuickActions = ({
  title,
  actions = [],
  role = 'employee',
  className = '',
  ...props
}) => {
  if (actions.length === 0) return null;

  // Role-specific colors
  const colorClasses = {
    employee: 'border-primary-200 bg-primary-50 text-primary-700 hover:bg-primary-100',
    ic: 'border-accent-200 bg-accent-50 text-accent-700 hover:bg-accent-100',
    admin: 'border-admin-200 bg-admin-50 text-admin-700 hover:bg-admin-100',
  };

  const colorClass = colorClasses[role] || colorClasses.employee;

  return (
    <div className={`px-4 mb-4 ${className}`} {...props}>
      {title && (
        <p className="text-sm font-medium text-warm-600 mb-3">{title}</p>
      )}
      <div className="flex flex-wrap gap-2">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={action.onClick}
            disabled={action.disabled}
            className={`
              inline-flex items-center gap-2
              px-4 py-2.5
              border-2 rounded-xl
              text-sm font-medium
              transition-all duration-250
              hover:scale-105 hover:shadow-md
              active:scale-100
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
              ${colorClass}
            `}
          >
            {action.icon && (
              <span className="w-5 h-5">{action.icon}</span>
            )}
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
