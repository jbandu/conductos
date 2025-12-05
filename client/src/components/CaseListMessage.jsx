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

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function CaseCard({ caseData, onCaseClick }) {
  const isOverdue = caseData.is_overdue;
  const daysRemaining = caseData.days_remaining;

  const handleClick = () => {
    console.log('Case card clicked:', caseData.case_code);
    onCaseClick(caseData.case_code);
  };

  return (
    <div
      className="border border-warm-200 rounded-lg p-4 hover:border-warm-300 hover:shadow-sm transition-all cursor-pointer bg-white"
      onClick={handleClick}
    >
      {/* Header: Case Code + Status */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-warm-900 text-lg hover:text-primary-600">
            {caseData.case_code}
          </h3>
          <p className="text-sm text-warm-500 mt-1">
            Incident: {formatDate(caseData.incident_date)}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[caseData.status]}`}>
          {STATUS_LABELS[caseData.status]}
        </span>
      </div>

      {/* Description Preview */}
      <p className="text-sm text-warm-600 mb-3 line-clamp-2">
        {caseData.description}
      </p>

      {/* Footer: Metadata */}
      <div className="flex items-center justify-between text-xs text-warm-500 pt-3 border-t border-warm-100">
        <div className="flex items-center gap-3">
          {caseData.is_anonymous && (
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Anonymous
            </span>
          )}
          {caseData.conciliation_requested && (
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
              Conciliation
            </span>
          )}
        </div>
        
        {/* Deadline */}
        <div>
          {isOverdue ? (
            <span className="bg-red-200 text-red-900 px-2 py-1 rounded font-medium">
              ⚠️ {Math.abs(daysRemaining)} days overdue
            </span>
          ) : daysRemaining === 0 ? (
            <span className="bg-yellow-200 text-yellow-900 px-2 py-1 rounded font-medium">
              📅 Due today
            </span>
          ) : daysRemaining <= 7 ? (
            <span className="text-orange-600 font-medium">
              ⚡ {daysRemaining} days remaining
            </span>
          ) : (
            <span className="text-warm-500">
              {daysRemaining} days remaining
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CaseListMessage({ cases, summary, onCaseClick }) {
  return (
    <div className="space-y-3">
      {/* Summary Header */}
      {summary && (
        <div className="text-sm text-warm-600 font-medium mb-4">
          {summary}
        </div>
      )}

      {/* Case Cards */}
      <div className="space-y-3">
        {cases.map(caseData => (
          <CaseCard
            key={caseData.id}
            caseData={caseData}
            onCaseClick={onCaseClick}
          />
        ))}
      </div>

      {/* Empty State */}
      {cases.length === 0 && (
        <div className="text-center py-8 text-warm-500">
          <svg className="w-12 h-12 mx-auto mb-3 text-warm-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p>No cases found</p>
        </div>
      )}
    </div>
  );
}
