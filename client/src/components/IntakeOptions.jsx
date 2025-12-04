import React from 'react';

export default function IntakeOptions({ options, selected, onSelect, error }) {
  return (
    <div className="px-4 mb-4">
      <div className="flex justify-end">
        <div className="max-w-[80%] md:max-w-[70%] w-full space-y-2">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => onSelect(option.value)}
              className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all min-h-[44px] ${
                selected === option.value
                  ? 'border-blue-600 bg-blue-50 text-blue-900'
                  : 'border-gray-300 bg-white hover:border-blue-300'
              }`}
            >
              <div className="flex items-start">
                <div className={`w-5 h-5 rounded-full border-2 mt-0.5 mr-3 flex-shrink-0 flex items-center justify-center ${
                  selected === option.value
                    ? 'border-blue-600 bg-blue-600'
                    : 'border-gray-400'
                }`}>
                  {selected === option.value && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{option.label}</div>
                  {option.description && (
                    <div className="text-sm text-gray-600 mt-1">{option.description}</div>
                  )}
                </div>
              </div>
            </button>
          ))}
          {error && (
            <p className="text-red-500 text-sm mt-2">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
