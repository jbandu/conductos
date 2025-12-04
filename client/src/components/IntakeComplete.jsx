import React from 'react';

export default function IntakeComplete({ caseCode, createdAt, deadlineDate, onNewComplaint }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="px-4 mb-4">
      <div className="flex justify-start">
        <div className="max-w-[80%] md:max-w-[70%] bg-white border border-gray-200 rounded-lg rounded-bl-none px-4 py-3">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-semibold text-lg">Complaint Filed Successfully</span>
            </div>

            <div className="space-y-3 text-gray-900">
              <div className="flex items-start gap-2">
                <span className="text-2xl">📋</span>
                <div>
                  <span className="text-sm text-gray-600">Case Code</span>
                  <p className="font-bold text-xl">{caseCode}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="text-2xl">📅</span>
                <div>
                  <span className="text-sm text-gray-600">Filed</span>
                  <p className="font-medium">{formatDate(createdAt)}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="text-2xl">⏰</span>
                <div>
                  <span className="text-sm text-gray-600">90-Day Deadline</span>
                  <p className="font-medium">{formatDate(deadlineDate)}</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-gray-700">
                The Presiding Officer has been notified and will review your complaint within 7 days.
                You can check your case status anytime by entering your case code.
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={onNewComplaint}
                className="text-blue-600 text-sm hover:underline font-medium"
              >
                File another complaint
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
