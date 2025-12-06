import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useIntakeChat from '../../hooks/useIntakeChat';
import IntakeChatMessage from './IntakeChatMessage';
import IntakeChatInput from './IntakeChatInput';

/**
 * IntakeChatPanel Component
 *
 * A collapsible chat panel that guides employees through filing a complaint.
 * Can be embedded in the employee dashboard as a side panel.
 */

function QuickPromptChip({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="
        px-3 py-2 text-sm
        bg-white border border-gray-200 rounded-full
        hover:bg-teal-50 hover:border-teal-300 hover:text-teal-700
        transition-colors
        whitespace-nowrap
      "
    >
      {label}
    </button>
  );
}

function TypingIndicator() {
  return (
    <div className="px-4 py-2">
      <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 inline-block shadow-sm">
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

export default function IntakeChatPanel({ isOpen, onClose, onFileComplaint }) {
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const {
    messages,
    isLoading,
    extractedData,
    isReadyToSubmit,
    quickPrompts,
    sendMessage,
    resetChat
  } = useIntakeChat();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  // Handle proceeding to full form
  const handleProceedToForm = () => {
    // Pass extracted data to the file complaint page
    navigate('/employee/file-complaint', {
      state: { prefillData: extractedData, fromChat: true }
    });
    onClose();
  };

  // Handle starting fresh with form
  const handleUseFormInstead = () => {
    navigate('/employee/file-complaint');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 md:w-[420px] bg-gray-50 shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">File a Report</h3>
            <p className="text-xs text-gray-500">Guided conversation</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Close chat panel"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto py-4">
        {messages.map((msg) => (
          <IntakeChatMessage
            key={msg.id}
            type={msg.type}
            content={msg.content}
            timestamp={msg.timestamp}
          />
        ))}
        {isLoading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts - Show only at start */}
      {messages.length <= 1 && !isLoading && (
        <div className="px-4 pb-3">
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((prompt) => (
              <QuickPromptChip
                key={prompt}
                label={prompt}
                onClick={() => sendMessage(prompt)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Ready to Submit Actions */}
      {isReadyToSubmit && (
        <div className="px-4 pb-3">
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
            <p className="text-sm text-teal-800 mb-3">
              I've gathered the key information. Would you like to proceed to the full form to add more details and submit?
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleProceedToForm}
                className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-medium"
              >
                Continue to Form
              </button>
              <button
                onClick={resetChat}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
              >
                Start Over
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-4">
        <IntakeChatInput
          onSend={sendMessage}
          disabled={isLoading}
          placeholder="Describe what happened..."
        />
        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Confidential
          </span>
          <button
            onClick={handleUseFormInstead}
            className="text-teal-600 hover:text-teal-700 hover:underline"
          >
            Use form instead
          </button>
        </div>
      </div>
    </div>
  );
}
