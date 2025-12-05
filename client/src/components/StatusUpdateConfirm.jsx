import React from 'react';

const STATUS_STYLES = {
  new: 'bg-blue-100 text-blue-800',
  under_review: 'bg-purple-100 text-purple-800',
  conciliation: 'bg-yellow-100 text-yellow-800',
  investigating: 'bg-orange-100 text-orange-800',
  decision_pending: 'bg-red-100 text-red-800',
  closed: 'bg-green-100 text-green-800'
};

const STATUS_LABELS = {
  new: 'New',
  under_review: 'Under Review',
  conciliation: 'Conciliation',
  investigating: 'Investigating',
  decision_pending: 'Decision Pending',
  closed: 'Closed'
};

export default function StatusUpdateConfirm({
  caseCode,
  oldStatus,
  newStatus,
  onConfirm,
  onCancel,
  isUpdating
}) {
  return (
    <div className="border border-gray-200 rounded-lg p-6 bg-white">
      <div className="flex items-start gap-3 mb-4">
        <div className="flex-shrink-0">
          <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Confirm Status Update
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Are you sure you want to update the status for case <strong>{caseCode}</strong>?
          </p>

          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg mb-6">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_STYLES[oldStatus]}`}>
              {STATUS_LABELS[oldStatus]}
            </span>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_STYLES[newStatus]}`}>
              {STATUS_LABELS[newStatus]}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onConfirm}
              disabled={isUpdating}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {isUpdating ? 'Updating...' : 'Confirm Update'}
            </button>
            <button
              onClick={onCancel}
              disabled={isUpdating}
              className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
