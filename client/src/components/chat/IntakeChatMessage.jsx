import React from 'react';

/**
 * IntakeChatMessage Component
 *
 * Renders individual chat messages in the intake conversation.
 * Supports both regular text messages and special intake summary messages.
 */

function formatTime(date) {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function IntakeSummary({ summary, extractedData }) {
  return (
    <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2 text-teal-700 font-medium">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Information Gathered
      </div>
      <p className="text-sm text-gray-700">{summary}</p>
      {extractedData && (
        <div className="border-t border-teal-200 pt-3 space-y-2">
          {extractedData.incidentDate && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Date:</span>
              <span className="text-gray-900">{extractedData.incidentDate}</span>
            </div>
          )}
          {extractedData.incidentLocation && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Location:</span>
              <span className="text-gray-900">{extractedData.incidentLocation}</span>
            </div>
          )}
          {extractedData.respondentName && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Person involved:</span>
              <span className="text-gray-900">{extractedData.respondentName}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function IntakeChatMessage({ type, content, timestamp }) {
  const isUser = type === 'user';
  const isSystem = type === 'system';

  // Handle special intake_summary message type
  if (isSystem && typeof content === 'object' && content.type === 'intake_summary') {
    return (
      <div className="px-4 py-2">
        <IntakeSummary summary={content.summary} extractedData={content.extractedData} />
      </div>
    );
  }

  // Regular text message
  const messageText = typeof content === 'string' ? content : JSON.stringify(content);

  return (
    <div className={`px-4 py-2 ${isUser ? 'flex justify-end' : ''}`}>
      <div className={`max-w-[85%] ${isUser ? 'order-last' : ''}`}>
        <div
          className={`
            rounded-2xl px-4 py-3
            ${isUser
              ? 'bg-teal-600 text-white rounded-br-md'
              : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md shadow-sm'
            }
          `}
        >
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{messageText}</p>
        </div>
        <div className={`mt-1 text-xs text-gray-400 ${isUser ? 'text-right' : ''}`}>
          {formatTime(timestamp)}
        </div>
      </div>
    </div>
  );
}
