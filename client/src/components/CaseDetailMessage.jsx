import React, { useState } from 'react';
import { Card, Badge } from './design-system';

const STATUS_VARIANTS = {
  new: 'info',
  under_review: 'neutral',
  conciliation: 'warning',
  investigating: 'warning',
  decision_pending: 'danger',
  closed: 'success'
};

const STATUS_LABELS = {
  new: 'New',
  under_review: 'Under Review',
  conciliation: 'Conciliation',
  investigating: 'Investigating',
  decision_pending: 'Decision Pending',
  closed: 'Closed'
};

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function formatDateTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function StatusTimeline({ history }) {
  if (!history || history.length === 0) {
    return null;
  }

  return (
    <div className="mt-6">
      <h4 className="text-sm font-semibold text-warm-700 mb-3">Status History</h4>
      <div className="space-y-3">
        {history.map((entry, index) => (
          <div key={entry.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-primary-500' : 'bg-warm-300'}`} />
              {index !== history.length - 1 && (
                <div className="w-0.5 h-full bg-warm-200 mt-1" />
              )}
            </div>

            <div className="flex-1 pb-4">
              <div className="flex items-center gap-2 mb-1">
                {entry.old_status && (
                  <>
                    <Badge size="sm" variant={STATUS_VARIANTS[entry.old_status] || 'neutral'}>
                      {STATUS_LABELS[entry.old_status]}
                    </Badge>
                    <span className="text-warm-400">→</span>
                  </>
                )}
                <Badge size="sm" variant={STATUS_VARIANTS[entry.new_status] || 'neutral'}>
                  {STATUS_LABELS[entry.new_status]}
                </Badge>
              </div>
              <p className="text-sm text-warm-600 mb-1">{entry.notes}</p>
              <p className="text-xs text-warm-400">{formatDateTime(entry.changed_at)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CaseDetailMessage({ caseData, history }) {
  const [showFullDescription, setShowFullDescription] = useState(false);
  const isOverdue = caseData.is_overdue;
  const daysRemaining = caseData.days_remaining;
  const descriptionPreview = caseData.description.slice(0, 200);
  const needsTruncation = caseData.description.length > 200;

  return (
    <Card padding="comfortable">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-warm-900 mb-2">
            {caseData.case_code}
          </h2>
          <div className="flex items-center gap-2">
            <Badge variant={STATUS_VARIANTS[caseData.status] || 'neutral'}>
              {STATUS_LABELS[caseData.status]}
            </Badge>
            {caseData.is_anonymous && (
              <Badge variant="neutral">
                🔒 Anonymous
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-warm-50 rounded-lg">
        <div>
          <p className="text-xs text-warm-500 mb-1">Filed</p>
          <p className="text-sm font-medium text-warm-900">{formatDate(caseData.created_at)}</p>
        </div>
        <div>
          <p className="text-xs text-warm-500 mb-1">Incident Date</p>
          <p className="text-sm font-medium text-warm-900">{formatDate(caseData.incident_date)}</p>
        </div>
        <div>
          <p className="text-xs text-warm-500 mb-1">Deadline</p>
          <p className="text-sm font-medium text-warm-900">{formatDate(caseData.deadline_date)}</p>
        </div>
      </div>

      <div className="mb-6">
        {isOverdue ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-sm font-medium text-red-900">
              ⚠️ This case is {Math.abs(daysRemaining)} days overdue
            </span>
          </div>
        ) : daysRemaining === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-2">
            <span className="text-sm font-medium text-yellow-900">
              📅 Deadline is today
            </span>
          </div>
        ) : daysRemaining <= 7 ? (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-center gap-2">
            <span className="text-sm font-medium text-orange-900">
              ⚡ {daysRemaining} days remaining
            </span>
          </div>
        ) : (
          <div className="text-sm text-warm-600">
            {daysRemaining} days remaining until deadline
          </div>
        )}
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-semibold text-warm-700 mb-2">Description</h3>
        <p className="text-sm text-warm-600 whitespace-pre-wrap">
          {showFullDescription || !needsTruncation ? caseData.description : descriptionPreview + '...'}
        </p>
        {needsTruncation && (
          <button
            onClick={() => setShowFullDescription(!showFullDescription)}
            className="text-sm text-accent-600 hover:text-accent-700 mt-2 font-medium transition-colors"
          >
            {showFullDescription ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-warm-50 rounded-lg">
        <div>
          <p className="text-xs text-warm-500 mb-1">Conciliation Requested</p>
          <p className="text-sm font-medium text-warm-900">
            {caseData.conciliation_requested ? 'Yes' : 'No'}
          </p>
        </div>
        <div>
          <p className="text-xs text-warm-500 mb-1">Complainant</p>
          <p className="text-sm font-medium text-warm-900">
            {caseData.is_anonymous
              ? `${caseData.anonymous_alias || 'Anonymous'} (Limited disclosure)`
              : caseData.complainant_name
            }
          </p>
        </div>
      </div>

      <StatusTimeline history={history} />
    </Card>
  );
}
