import React, { useEffect, useRef, useState } from 'react';
import { CopilotMessage } from './CopilotMessage';
import { SmartSuggestions } from './SmartSuggestions';
import { ContextPanel } from './ContextPanel';
import { DocumentPreview } from './DocumentPreview';

export function CopilotChat({ caseCode, mode = 'ic' }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [insights, setInsights] = useState([]);
  const [caseContext, setCaseContext] = useState(null);
  const [showContext, setShowContext] = useState(true);
  const [pending, setPending] = useState(false);
  const [documentPreview, setDocumentPreview] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (mode === 'ic') {
      fetchSuggestions();
      fetchInsights();
    }
    if (caseCode) {
      fetchCaseContext();
    }
  }, [caseCode, mode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function fetchSuggestions() {
    try {
      const res = await fetch(`/api/copilot/suggestions?caseCode=${caseCode || ''}`);
      const data = await res.json();
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error('Failed to load suggestions', error);
    }
  }

  async function fetchInsights() {
    try {
      const res = await fetch('/api/insights');
      const data = await res.json();
      setInsights(data.insights || []);
    } catch (error) {
      console.error('Failed to load insights', error);
    }
  }

  async function fetchCaseContext() {
    try {
      const res = await fetch(`/api/cases/${caseCode}`);
      const data = await res.json();
      setCaseContext(data.case || data);
    } catch (error) {
      console.error('Failed to load case context', error);
    }
  }

  async function sendMessage(message) {
    if (!message.trim()) return;
    setPending(true);
    setMessages((prev) => [...prev, { id: Date.now(), type: 'user', content: message, timestamp: new Date() }]);
    setInput('');

    try {
      const res = await fetch('/api/copilot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, caseCode })
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          type: 'copilot',
          content: data.message,
          citations: data.citations,
          suggestedActions: data.suggestedActions,
          disclaimer: data.disclaimer,
          timestamp: new Date()
        }
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          type: 'copilot',
          content: 'I encountered an error. Please try again later.',
          isError: true,
          timestamp: new Date()
        }
      ]);
    } finally {
      setPending(false);
    }
  }

  const handleAction = (action) => {
    if (action?.type === 'document' && action?.payload) {
      setDocumentPreview(action.payload);
    }
  };

  return (
    <div className="copilot-chat">
      <div className="copilot-chat__main">
        <div className="copilot-chat__header">
          <div>
            <h2>IC Copilot</h2>
            <p>AI assistance for PoSH workflows</p>
          </div>
          <button type="button" onClick={() => setShowContext((open) => !open)}>
            {showContext ? 'Hide context' : 'Show context'}
          </button>
        </div>

        <div className="copilot-chat__messages">
          {messages.length === 0 && (
            <div className="copilot-chat__welcome">
              <p>Welcome! Ask about PoSH procedures, case guidance, or document drafting.</p>
              {caseCode && <p>I have context for case {caseCode}.</p>}
            </div>
          )}

          {messages.map((message) =>
            message.type === 'user' ? (
              <div key={message.id} className="copilot-chat__user-message">
                {message.content}
              </div>
            ) : (
              <CopilotMessage
                key={message.id}
                content={message.content}
                citations={message.citations}
                suggestedActions={message.suggestedActions}
                disclaimer={message.disclaimer}
                isError={message.isError}
                onActionClick={handleAction}
              />
            )
          )}
          {pending && <p className="copilot-chat__typing">IC Copilot is thinking…</p>}
          <div ref={messagesEndRef} />
        </div>

        {suggestions.length > 0 && messages.length < 3 && (
          <SmartSuggestions suggestions={suggestions} onSelect={sendMessage} />
        )}

        <div className="copilot-chat__input">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask IC Copilot..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage(input);
              }
            }}
          />
          <button type="button" onClick={() => sendMessage(input)} disabled={pending || !input.trim()}>
            Send
          </button>
        </div>
      </div>

      {showContext && (
        <div className="copilot-chat__context">
          <ContextPanel caseContext={caseContext} insights={insights} onClose={() => setShowContext(false)} />
        </div>
      )}

      {documentPreview && (
        <DocumentPreview document={documentPreview} onClose={() => setDocumentPreview(null)} />
      )}
    </div>
  );
}
