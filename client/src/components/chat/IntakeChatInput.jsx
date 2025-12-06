import React, { useState, useRef, useEffect } from 'react';

/**
 * IntakeChatInput Component
 *
 * Text input with send button for the intake chat.
 * Supports Enter to send, Shift+Enter for newline.
 */

export default function IntakeChatInput({ onSend, disabled, placeholder }) {
  const [value, setValue] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [disabled]);

  const handleSubmit = () => {
    if (value.trim() && !disabled) {
      onSend(value.trim());
      setValue('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex gap-2 items-end">
      <div className="flex-1 relative">
        <textarea
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || "Type your message..."}
          disabled={disabled}
          rows={1}
          className="
            w-full px-4 py-3 pr-12
            border border-gray-300 rounded-xl
            focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent
            resize-none text-sm
            disabled:bg-gray-100 disabled:cursor-not-allowed
            min-h-[48px] max-h-[120px]
          "
          style={{
            height: 'auto',
            minHeight: '48px'
          }}
          aria-label="Type your message"
        />
      </div>
      <button
        onClick={handleSubmit}
        disabled={!value.trim() || disabled}
        className="
          p-3 rounded-xl
          bg-teal-600 text-white
          hover:bg-teal-700 active:bg-teal-800
          disabled:bg-gray-300 disabled:cursor-not-allowed
          transition-colors
          min-w-[48px] min-h-[48px]
          flex items-center justify-center
        "
        aria-label="Send message"
      >
        {disabled ? (
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        )}
      </button>
    </div>
  );
}
