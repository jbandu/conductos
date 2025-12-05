import React from 'react';

export function SmartSuggestions({ suggestions = [], onSelect }) {
  if (!suggestions.length) return null;

  return (
    <div className="copilot-suggestions">
      <p className="copilot-suggestions__label">Suggested questions:</p>
      <div className="copilot-suggestions__grid">
        {suggestions.map((suggestion, index) => (
          <button key={index} type="button" onClick={() => onSelect?.(suggestion)}>
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
