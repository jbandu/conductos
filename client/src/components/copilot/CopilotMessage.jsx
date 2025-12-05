import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';

export function CopilotMessage({ content, citations = [], suggestedActions = [], disclaimer, isError, onActionClick }) {
  const [showCitations, setShowCitations] = useState(false);

  return (
    <div className={`copilot-message ${isError ? 'copilot-message--error' : ''}`}>
      <div className="copilot-message__body">
        <ReactMarkdown>{content}</ReactMarkdown>

        {citations.length > 0 && (
          <div className="copilot-message__citations">
            <button type="button" onClick={() => setShowCitations((open) => !open)}>
              {showCitations ? 'Hide citations' : `${citations.length} source${citations.length > 1 ? 's' : ''}`}
            </button>
            {showCitations && (
              <ul>
                {citations.map((citation, index) => (
                  <li key={index}>
                    <strong>{citation.reference}</strong> — {citation.source}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {suggestedActions.length > 0 && (
          <div className="copilot-message__actions">
            <p>Suggested actions:</p>
            <div className="copilot-message__actions-grid">
              {suggestedActions.map((action, index) => (
                <button key={index} type="button" onClick={() => onActionClick?.(action)}>
                  {action.label || action.type}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      {disclaimer && <p className="copilot-message__disclaimer">{disclaimer}</p>}
    </div>
  );
}
