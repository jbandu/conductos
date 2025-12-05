import React from 'react';

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

export default function ChatMessage({ type, content, timestamp }) {
  const isUser = type === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3 px-3 md:px-4 md:mb-4`}>
      <div
        className={`max-w-[90%] md:max-w-[85%] lg:max-w-[70%] rounded-lg px-3 py-2.5 md:px-4 md:py-3 ${
          isUser
            ? 'bg-blue-600 text-white rounded-br-none'
            : 'bg-white border border-gray-200 rounded-bl-none shadow-sm'
        }`}
      >
        <p className="text-base whitespace-pre-wrap break-words leading-relaxed">
          {content}
        </p>
        {timestamp && (
          <p
            className={`text-xs mt-1.5 ${
              isUser ? 'text-blue-100' : 'text-gray-400'
            }`}
            title={new Date(timestamp).toLocaleString()}
          >
            {formatRelativeTime(timestamp)}
          </p>
        )}
      </div>
    </div>
  );
}
