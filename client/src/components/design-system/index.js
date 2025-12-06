/**
 * ConductOS Design System
 *
 * Centralized export of all design system components.
 * Import components from here to ensure consistency.
 *
 * @example
 * import { Button, Card, Input, Badge } from '@/components/design-system';
 */

export { default as Button } from './Button';
export { default as Card } from './Card';
export { default as Input } from './Input';
export { default as Badge } from './Badge';

// Export design tokens for programmatic access
export const tokens = {
  colors: {
    roles: {
      employee: {
        primary: '#3b82f6',
        hover: '#2563eb',
        focus: '#1d4ed8',
      },
      ic: {
        primary: '#14b8a6',
        hover: '#0d9488',
        focus: '#0f766e',
      },
      admin: {
        primary: '#6366f1',
        hover: '#4f46e5',
        focus: '#4338ca',
      },
    },
    semantic: {
      success: '#22c55e',
      warning: '#f59e0b',
      danger: '#ef4444',
      info: '#3b82f6',
    },
  },
  spacing: {
    card: {
      padding: '1.5rem', // 24px
      gap: '1rem',       // 16px
    },
    section: {
      padding: '2rem',   // 32px
      gap: '1.5rem',     // 24px
    },
  },
  borderRadius: {
    card: '1rem',        // 16px (rounded-xl)
    button: '0.5rem',    // 8px (rounded-lg)
    input: '0.5rem',     // 8px (rounded-lg)
  },
};
