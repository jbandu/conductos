import React, { useState } from 'react';

export default function IntakeDatePicker({ value, onChange, error }) {
  const [showCustomDate, setShowCustomDate] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  const getDateDaysAgo = (daysAgo) => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().split('T')[0];
  };

  const formatDisplayDate = (dateString) => {
    const date = new Date(dateString + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(date);
    selected.setHours(0, 0, 0, 0);

    const diffTime = today - selected;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays} days ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const quickOptions = [
    { label: 'Today', value: today, description: formatDisplayDate(today) },
    { label: 'Yesterday', value: getDateDaysAgo(1), description: formatDisplayDate(getDateDaysAgo(1)) },
    { label: 'This week', value: getDateDaysAgo(3), description: formatDisplayDate(getDateDaysAgo(3)) },
    { label: 'Last week', value: getDateDaysAgo(7), description: formatDisplayDate(getDateDaysAgo(7)) },
  ];

  return (
    <div className="px-4 mb-4">
      <div className="flex justify-end">
        <div className="max-w-[80%] md:max-w-[70%] w-full">
          {!showCustomDate ? (
            <>
              {/* Quick date options */}
              <div className="space-y-2 mb-3">
                {quickOptions.map((option) => (
                  <button
                    key={option.label}
                    onClick={() => onChange(option.value)}
                    className={`w-full px-4 py-3 rounded-lg border-2 transition-all text-left min-h-[44px] ${
                      value === option.value
                        ? 'border-blue-500 bg-blue-50 text-blue-900'
                        : 'border-gray-300 bg-white hover:border-gray-400'
                    }`}
                  >
                    <div className="font-medium">{option.label}</div>
                    <div className="text-sm text-gray-600">{option.description}</div>
                  </button>
                ))}
              </div>

              {/* Custom date button */}
              <button
                onClick={() => setShowCustomDate(true)}
                className="w-full px-4 py-3 border-2 border-gray-300 bg-white rounded-lg hover:border-gray-400 transition-all text-left min-h-[44px]"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-700">Different date</div>
                    <div className="text-sm text-gray-500">Select a specific date</div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </button>
            </>
          ) : (
            <>
              {/* Custom date picker */}
              <div className="bg-gray-50 p-4 rounded-lg border-2 border-gray-300">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select incident date:
                </label>
                <input
                  type="date"
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  max={today}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base min-h-[44px]"
                />
                <button
                  onClick={() => setShowCustomDate(false)}
                  className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  ← Back to quick options
                </button>
              </div>
            </>
          )}

          {/* Current selection display */}
          {value && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-sm text-blue-900">
                <span className="font-medium">Selected:</span> {formatDisplayDate(value)}
              </div>
            </div>
          )}

          {error && (
            <p className="text-red-500 text-sm mt-2 font-medium">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
