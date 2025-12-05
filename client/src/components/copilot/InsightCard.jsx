import React from 'react';

export function InsightCard({ insight, compact, onAcknowledge }) {
  if (!insight) return null;
  const severityClass = `insight-card--${insight.severity || 'info'}`;

  if (compact) {
    return (
      <div className={`insight-card insight-card--compact ${severityClass}`}>
        <p>{insight.title}</p>
      </div>
    );
  }

  return (
    <div className={`insight-card ${severityClass}`}>
      <div className="insight-card__header">
        <p className="insight-card__title">{insight.title}</p>
        {onAcknowledge && (
          <button type="button" onClick={onAcknowledge}>
            Dismiss
          </button>
        )}
      </div>
      <p className="insight-card__description">{insight.description}</p>
      {insight.recommended_action && (
        <p className="insight-card__recommendation">💡 {insight.recommended_action}</p>
      )}
    </div>
  );
}
