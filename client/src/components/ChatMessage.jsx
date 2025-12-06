import React from 'react';
import { ChatBubble } from './design-system';
import { useAuth } from '../contexts/AuthContext';
import CaseListMessage from './CaseListMessage';
import CaseDetailMessage from './CaseDetailMessage';
import StatusUpdateConfirm from './StatusUpdateConfirm';

/**
 * ChatMessage Component
 *
 * Wrapper that renders appropriate message type using the design system ChatBubble.
 * Handles rich message types (case lists, case details, etc.)
 */

export default function ChatMessage({ type, content, timestamp }) {
  const { user } = useAuth();
  const isUser = type === 'user';

  // Determine role for styling
  const role = user?.role === 'ic_member' ? 'ic' : user?.role === 'hr_admin' ? 'admin' : 'employee';

  // Handle rich message types
  if (typeof content === 'object' && content.type) {
    switch (content.type) {
      case 'case_list':
        return (
          <div className="px-4 mb-4">
            <CaseListMessage {...content} />
          </div>
        );
      case 'case_detail':
        return (
          <div className="px-4 mb-4">
            <CaseDetailMessage {...content} />
          </div>
        );
      case 'case_update_success':
        return (
          <div className="px-4 mb-4">
            <StatusUpdateConfirm {...content} />
          </div>
        );
      default:
        // Fallback to regular message
        break;
    }
  }

  // Regular text message
  return (
    <ChatBubble
      type={type}
      content={typeof content === 'string' ? content : JSON.stringify(content)}
      timestamp={timestamp}
      role={role}
      status={isUser ? 'sent' : undefined}
    />
  );
}
