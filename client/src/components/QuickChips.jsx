import React from 'react';
import { QuickActions } from './design-system';
import { useAuth } from '../contexts/AuthContext';

/**
 * QuickChips Component
 *
 * Wrapper around the design system QuickActions component.
 * Converts simple chip strings to the QuickActions format.
 */

export default function QuickChips({ chips, onSelect, title }) {
  const { user } = useAuth();
  const role = user?.role === 'ic_member' ? 'ic' : user?.role === 'hr_admin' ? 'admin' : 'employee';

  if (!chips || chips.length === 0) return null;

  // Convert chip strings to action objects
  const actions = chips.map(chip => ({
    label: chip,
    onClick: () => onSelect(chip),
  }));

  return <QuickActions title={title} actions={actions} role={role} />;
}
