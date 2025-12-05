import React from 'react';

export function RiskGauge({ score = 0, level = 'medium' }) {
  const width = Math.min(Math.max(score, 0), 100);
  return (
    <div className="risk-gauge">
      <div className="risk-gauge__bar">
        <div className={`risk-gauge__fill risk-gauge__fill--${level}`} style={{ width: `${width}%` }} />
      </div>
      <span className="risk-gauge__label">{level} ({width}%)</span>
    </div>
  );
}
