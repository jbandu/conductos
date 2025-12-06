import React from 'react';

/**
 * ChatBubble Component
 *
 * Modern chat message bubble with support for user/system messages,
 * timestamps, status indicators, and rich content.
 *
 * @example
 * <ChatBubble type="user" content="I need help" timestamp={new Date()} />
 * <ChatBubble type="system" content="How can I assist you?" timestamp={new Date()} />
 */

function formatRelativeTime(timestamp) {
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now - time;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) {
    return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return time.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

const ChatBubble = ({
  type = 'system', // 'user' | 'system'
  content,
  timestamp,
  status, // 'sending' | 'sent' | 'read' | 'error'
  avatar,
  showAvatar = false,
  actions, // Quick action buttons
  role = 'employee', // For role-specific user message colors
  className = '',
  ...props
}) => {
  const isUser = type === 'user';

  // Role-specific colors for user messages
  const userBubbleColors = {
    employee: 'bg-primary-600 text-white',
    ic: 'bg-accent-600 text-white',
    admin: 'bg-admin-600 text-white',
  };

  const userBubbleColor = userBubbleColors[role] || userBubbleColors.employee;

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 px-4 animate-slide-up ${className}`}
      {...props}
    >
      <div className={`flex gap-2 max-w-[90%] md:max-w-[85%] lg:max-w-[70%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        {showAvatar && (
          <div className="flex-shrink-0 mt-1">
            {avatar || (
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                isUser ? userBubbleColor : 'bg-warm-200 text-warm-700'
              }`}>
                {isUser ? 'Y' : 'C'}
              </div>
            )}
          </div>
        )}

        {/* Message Content */}
        <div className="flex flex-col gap-2">
          {/* Main Bubble */}
          <div
            className={`rounded-2xl px-4 py-3 ${
              isUser
                ? `${userBubbleColor} ${isUser ? 'rounded-br-md' : ''}`
                : 'bg-white border border-warm-200 shadow-sm rounded-bl-md'
            }`}
          >
            {/* Content */}
            {typeof content === 'string' ? (
              <p className={`text-base whitespace-pre-wrap break-words leading-relaxed ${
                isUser ? 'text-white' : 'text-warm-900'
              }`}>
                {content}
              </p>
            ) : (
              content
            )}

            {/* Timestamp and Status */}
            {(timestamp || status) && (
              <div className={`flex items-center gap-2 mt-2 text-xs ${
                isUser ? 'text-white text-opacity-80 justify-end' : 'text-warm-500'
              }`}>
                {timestamp && (
                  <span title={new Date(timestamp).toLocaleString()}>
                    {formatRelativeTime(timestamp)}
                  </span>
                )}
                {isUser && status && (
                  <span className="flex items-center gap-1">
                    {status === 'sending' && (
                      <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    )}
                    {status === 'sent' && (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {status === 'read' && (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
                        <path d="M13 5.5l2-2 5 5L9 19.5l-2-2" opacity="0.5" />
                      </svg>
                    )}
                    {status === 'error' && (
                      <svg className="w-4 h-4 text-danger-300" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    )}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          {actions && actions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {actions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    action.variant === 'primary'
                      ? `${role === 'employee' ? 'bg-primary-100 text-primary-700 hover:bg-primary-200' : role === 'ic' ? 'bg-accent-100 text-accent-700 hover:bg-accent-200' : 'bg-admin-100 text-admin-700 hover:bg-admin-200'}`
                      : 'bg-warm-100 text-warm-700 hover:bg-warm-200'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Typing Indicator Sub-component
ChatBubble.Typing = ({ role = 'employee' }) => {
  return (
    <div className="flex justify-start mb-4 px-4 animate-slide-up">
      <div className="bg-white border border-warm-200 shadow-sm rounded-2xl rounded-bl-md px-4 py-3">
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-warm-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-warm-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-warm-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;
