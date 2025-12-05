import React from 'react';

export default function DashboardSummary({ summary, onActionClick }) {
  if (!summary) return null;

  const { total_active, by_status, overdue_count, due_today, due_this_week } = summary;
  const pendingCount = (by_status.new || 0) + (by_status.under_review || 0) +
                       (by_status.investigating || 0) + (by_status.decision_pending || 0);

  return (
    <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
      <div className="flex items-start gap-3 mb-6">
        <div className="text-3xl">👋</div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Welcome to IC Mode</h2>
          <p className="text-sm text-gray-600">Investigation Committee Dashboard</p>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">📊 Quick Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-2xl font-bold text-blue-900">{total_active}</p>
            <p className="text-xs text-blue-700 mt-1">Total Active Cases</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-2xl font-bold text-purple-900">{pendingCount}</p>
            <p className="text-xs text-purple-700 mt-1">Pending Review</p>
          </div>
          {overdue_count > 0 && (
            <div className="bg-red-50 rounded-lg p-4">
              <p className="text-2xl font-bold text-red-900">{overdue_count}</p>
              <p className="text-xs text-red-700 mt-1">⚠️ Overdue</p>
            </div>
          )}
          {due_today > 0 && (
            <div className="bg-yellow-50 rounded-lg p-4">
              <p className="text-2xl font-bold text-yellow-900">{due_today}</p>
              <p className="text-xs text-yellow-700 mt-1">📅 Due Today</p>
            </div>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onActionClick('Show All Cases')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
          >
            Show All Cases
          </button>
          <button
            onClick={() => onActionClick('Pending')}
            className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 text-sm font-medium transition-colors"
          >
            Pending ({pendingCount})
          </button>
          {overdue_count > 0 && (
            <button
              onClick={() => onActionClick('Overdue')}
              className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium transition-colors"
            >
              Overdue ({overdue_count})
            </button>
          )}
          {due_today > 0 && (
            <button
              onClick={() => onActionClick("Today's Deadlines")}
              className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 text-sm font-medium transition-colors"
            >
              Today's Deadlines ({due_today})
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
