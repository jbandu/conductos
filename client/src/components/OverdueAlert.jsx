import React from 'react';

export default function OverdueAlert({ count, onViewOverdue }) {
  if (!count || count === 0) return null;

  return (
    <div className="border-l-4 border-red-600 bg-red-50 p-4 rounded-r-lg shadow-sm mb-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-red-900 mb-1">
            ⚠️ Urgent: {count} {count === 1 ? 'Case' : 'Cases'} Past Statutory Deadline
          </h3>
          <p className="text-sm text-red-800 mb-3">
            {count === 1
              ? 'This case has exceeded the 90-day statutory deadline mandated by the PoSH Act. Immediate action is required.'
              : `These cases have exceeded the 90-day statutory deadline mandated by the PoSH Act. Immediate action is required.`
            }
          </p>
          <button
            onClick={onViewOverdue}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm font-medium transition-colors"
          >
            View Overdue Cases
          </button>
        </div>
      </div>
    </div>
  );
}
