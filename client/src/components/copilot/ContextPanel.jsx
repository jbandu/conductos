import React from 'react';
import { RiskGauge } from './RiskGauge';
import { InsightCard } from './InsightCard';

export function ContextPanel({ caseContext, insights = [], onClose }) {
  return (
    <div className="context-panel">
      <div className="context-panel__header">
        <h3>Context</h3>
        <button type="button" onClick={onClose}>Close</button>
      </div>

      {caseContext && (
        <div className="context-panel__section">
          <h4>Current Case</h4>
          <p><strong>Case Code:</strong> {caseContext.case_code}</p>
          <p><strong>Status:</strong> {caseContext.status}</p>
          <p><strong>Deadline:</strong> {caseContext.days_remaining} days remaining</p>
          {caseContext.risk_assessment && (
            <RiskGauge
              score={caseContext.risk_assessment.overallScore}
              level={caseContext.risk_assessment.overallLevel}
            />
          )}
        </div>
      )}

      {insights.length > 0 && (
        <div className="context-panel__section">
          <h4>Active Insights</h4>
          <div className="context-panel__insights">
            {insights.slice(0, 5).map((insight) => (
              <InsightCard key={insight.id} insight={insight} compact />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
