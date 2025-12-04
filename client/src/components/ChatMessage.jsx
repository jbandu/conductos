import React from 'react';

export default function ChatMessage({ type, content, timestamp }) {
  const isUser = type === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 px-4`}>
      <div
        className={`max-w-[80%] md:max-w-[70%] rounded-lg px-4 py-3 ${
          isUser
            ? 'bg-blue-600 text-white rounded-br-none'
            : 'bg-white border border-gray-200 rounded-bl-none'
        }`}
      >
        <p className="text-sm md:text-base whitespace-pre-wrap break-words">
          {content}
        </p>
        {timestamp && (
          <p
            className={`text-xs mt-1 ${
              isUser ? 'text-blue-100' : 'text-gray-400'
            }`}
          >
            {new Date(timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        )}
      </div>
    </div>
  );
}
