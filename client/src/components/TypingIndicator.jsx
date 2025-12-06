import React from 'react';
import { ChatBubble } from './design-system';
import { useAuth } from '../contexts/AuthContext';

/**
 * TypingIndicator Component
 *
 * Shows animated dots when the system is processing a message.
 * Uses the design system ChatBubble.Typing for consistent styling.
 */

export default function TypingIndicator() {
  const { user } = useAuth();
  const role = user?.role === 'ic_member' ? 'ic' : user?.role === 'hr_admin' ? 'admin' : 'employee';

  return <ChatBubble.Typing role={role} />;
}
