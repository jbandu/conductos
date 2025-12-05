import React from 'react';

export function DocumentPreview({ document, onClose }) {
  if (!document) return null;

  return (
    <div className="document-preview">
      <div className="document-preview__header">
        <h4>{document.type}</h4>
        <button type="button" onClick={onClose}>Close</button>
      </div>
      <pre className="document-preview__body">{document.content}</pre>
      {document.requires_review && (
        <p className="document-preview__notice">⚠️ This draft requires review before sharing.</p>
      )}
    </div>
  );
}
