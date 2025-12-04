import React from 'react';

export default function IntakeDatePicker({ value, onChange, error }) {
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="px-4 mb-4">
      <div className="flex justify-end">
        <div className="max-w-[80%] md:max-w-[70%]">
          <input
            type="date"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            max={today}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base min-h-[44px]"
          />
          {error && (
            <p className="text-red-500 text-sm mt-2">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
