import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

/**
 * AppLayout Component
 *
 * Base layout template that provides role-aware styling and structure.
 * Automatically applies role-specific accent colors throughout the app.
 *
 * @example
 * <AppLayout>
 *   <AppLayout.Sidebar>Navigation</AppLayout.Sidebar>
 *   <AppLayout.Main>Content</AppLayout.Main>
 * </AppLayout>
 */

const AppLayout = ({ children, className = '' }) => {
  const { user } = useAuth();

  // Apply role-specific CSS variable for dynamic theming
  React.useEffect(() => {
    if (user?.role) {
      const root = document.documentElement;
      const roleColors = {
        employee: {
          primary: '#3b82f6',
          primaryHover: '#2563eb',
          primaryFocus: '#1d4ed8',
        },
        ic_member: {
          primary: '#14b8a6',
          primaryHover: '#0d9488',
          primaryFocus: '#0f766e',
        },
        hr_admin: {
          primary: '#6366f1',
          primaryHover: '#4f46e5',
          primaryFocus: '#4338ca',
        },
      };

      const colors = roleColors[user.role] || roleColors.employee;
      root.style.setProperty('--color-role-primary', colors.primary);
      root.style.setProperty('--color-role-primary-hover', colors.primaryHover);
      root.style.setProperty('--color-role-primary-focus', colors.primaryFocus);
    }
  }, [user]);

  return (
    <div className={`min-h-screen bg-gentle ${className}`}>
      {children}
    </div>
  );
};

// Sidebar sub-component
AppLayout.Sidebar = ({ children, className = '' }) => (
  <aside className={`bg-warm-900 text-white ${className}`}>
    {children}
  </aside>
);

// Main content sub-component
AppLayout.Main = ({ children, className = '' }) => (
  <main className={`flex-1 ${className}`}>
    {children}
  </main>
);

// Header sub-component
AppLayout.Header = ({ children, className = '' }) => (
  <header className={`bg-white border-b border-warm-200 ${className}`}>
    {children}
  </header>
);

// Container sub-component for consistent max-width
AppLayout.Container = ({ children, size = 'default', className = '' }) => {
  const sizeStyles = {
    narrow: 'max-w-narrow',
    default: 'max-w-7xl',
    wide: 'max-w-content',
    full: 'max-w-full',
  };

  return (
    <div className={`mx-auto px-4 sm:px-6 lg:px-8 ${sizeStyles[size]} ${className}`}>
      {children}
    </div>
  );
};

export default AppLayout;
