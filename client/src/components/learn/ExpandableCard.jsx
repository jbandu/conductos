import React, { useState } from 'react';

export default function ExpandableCard({ question, answer }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-warm-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-warm-50 transition-colors"
      >
        <span className="font-medium text-warm-900 pr-4">{question}</span>
        <svg
          className={`w-5 h-5 text-primary-600 flex-shrink-0 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {isOpen && (
        <div className="px-6 py-4 bg-warm-50 border-t border-warm-200">
          <p className="text-warm-700 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}
