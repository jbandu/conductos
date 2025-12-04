import React from 'react';

export default function IntakeTextarea({ value, onChange, minLength = 50, error }) {
  const charCount = value.length;
  const isValid = charCount >= minLength;

  return (
    <div className="px-4 mb-4">
      <div className="flex justify-end">
        <div className="max-w-[80%] md:max-w-[70%] w-full">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={6}
            placeholder="Describe the incident in detail..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base resize-none"
          />
          <div className="flex justify-between items-center mt-2">
            <span className={`text-sm ${isValid ? 'text-green-600' : 'text-gray-500'}`}>
              {charCount} / {minLength} characters {isValid && '✓'}
            </span>
          </div>
          {error && (
            <p className="text-red-500 text-sm mt-2">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
