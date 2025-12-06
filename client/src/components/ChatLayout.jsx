import React, { useEffect, useRef, useState } from 'react';
import { useChat } from '../contexts/ChatContext';
import ChatMessage from './ChatMessage';
import QuickChips from './QuickChips';
import TypingIndicator from './TypingIndicator';
import Sidebar from './Sidebar';
import IntakeFlow from './IntakeFlow';
import CaseListMessage from './CaseListMessage';
import CaseDetailMessage from './CaseDetailMessage';
import StatusUpdateConfirm from './StatusUpdateConfirm';
import ICDashboard from './ICDashboard';

const EMPLOYEE_CHIPS = [
  "I want to report harassment",
  "Check my case status",
  "What is PoSH?",
  "I need help with workplace conduct"
];

const IC_CHIPS = [
  "Show All Cases",
  "Pending",
  "Overdue",
  "Today's Deadlines"
];

export default function ChatLayout() {
  const {
    messages,
    currentMode,
    isTyping,
    sidebarOpen,
    setSidebarOpen,
    addMessage,
    setIsTyping,
    pendingCaseCode,
    setPendingCaseCode
  } = useChat();
  const [inputValue, setInputValue] = useState('');
  const [showIntakeFlow, setShowIntakeFlow] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const chips = currentMode === 'employee' ? EMPLOYEE_CHIPS : IC_CHIPS;

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, showIntakeFlow]);

  useEffect(() => {
    if (pendingCaseCode) {
      addMessage('user', `status ${pendingCaseCode}`);
      processMessage(`status ${pendingCaseCode}`);
      setPendingCaseCode(null);
    }
  }, [pendingCaseCode]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const processMessage = async (message, options = {}) => {
    const { showTypingDelay = false } = options;

    try {
      setIsTyping(true);

      // Add a small delay for quick chip clicks to show thinking indicator
      if (showTypingDelay) {
        await new Promise(resolve => setTimeout(resolve, 1200));
      }

      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      };

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({ message, mode: currentMode })
      });

      const result = await response.json();

      if (result.success && result.response) {
        const { type, content } = result.response;
        console.log('API Response:', { type, content });

        // Handle different response types
        if (type === 'intake_start') {
          setShowIntakeFlow(true);
          addMessage('system', content.message);
        } else if (type === 'case_list' || type === 'case_detail' || type === 'case_update_success') {
          // Store full response data for rich components
          console.log('Adding rich message:', { type, ...content });
          addMessage('system', { type, ...content });
        } else if (type === 'text') {
          addMessage('system', content);
        } else if (type === 'error') {
          addMessage('system', `Error: ${content}`);
        } else {
          addMessage('system', content.toString());
        }
      } else {
        addMessage('system', 'Sorry, I encountered an error processing your request.');
      }
    } catch (error) {
      console.error('Failed to process message:', error);
      addMessage('system', 'Sorry, I encountered an error. Please try again.');
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = () => {
    if (inputValue.trim()) {
      addMessage('user', inputValue.trim());
      processMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleChipSelect = (chip) => {
    addMessage('user', chip);
    processMessage(chip, { showTypingDelay: true });
  };

  const handleIntakeComplete = () => {
    setShowIntakeFlow(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-screen bg-gentle">
      <Sidebar />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-warm-200 px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Hamburger Menu (Mobile) */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 hover:bg-warm-50 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div>
              <h2 className="text-lg font-semibold text-warm-900">
                {currentMode === 'employee' ? 'Employee Portal' : 'Investigation Committee'}
              </h2>
              <p className="text-sm text-warm-600">
                {currentMode === 'employee' ? 'Submit and track your cases' : 'Manage all cases'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              currentMode === 'employee'
                ? 'bg-primary-50 text-primary-600'
                : 'bg-accent-500/10 text-accent-600'
            }`}>
              {currentMode === 'employee' ? 'Employee Mode' : 'IC Mode'}
            </span>
          </div>
        </header>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 && !showIntakeFlow ? (
            currentMode === 'ic' ? (
              <ICDashboard onQuickAction={handleChipSelect} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full px-4 py-8">
                <div className="text-center max-w-md mb-8 animate-fade-in">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="text-h1 text-warm-900 mb-3">
                    How can we help you today?
                  </h3>
                  <p className="text-body text-warm-600 leading-relaxed">
                    You're in a safe, confidential space. I'm here to help you report an incident,
                    check your case status, or answer questions about workplace policies.
                  </p>
                </div>
                <QuickChips chips={chips} onSelect={handleChipSelect} />
              </div>
            )
          ) : (
            <div className="py-4">
              {messages.map((msg) => {
                // Check if this is a rich message with special components
                if (msg.type === 'system' && typeof msg.content === 'object' && msg.content.type) {
                  const { type, cases, summary, case: caseData, history, message } = msg.content;

                  return (
                    <div key={msg.id} className="px-4 mb-4">
                      {type === 'case_list' && (
                        <CaseListMessage
                          cases={cases || []}
                          summary={summary}
                          onCaseClick={(caseCode) => {
                            addMessage('user', `status ${caseCode}`);
                            processMessage(`status ${caseCode}`);
                          }}
                        />
                      )}
                      {type === 'case_detail' && caseData && (
                        <CaseDetailMessage
                          caseData={caseData}
                          history={history || []}
                        />
                      )}
                      {type === 'case_update_success' && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm font-medium text-green-900">{message}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }

                // Regular text message
                return (
                  <ChatMessage
                    key={msg.id}
                    type={msg.type}
                    content={msg.content}
                    timestamp={msg.timestamp}
                  />
                );
              })}
              {isTyping && <TypingIndicator />}
              {showIntakeFlow && <IntakeFlow onComplete={handleIntakeComplete} />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area - Hide when intake flow is active */}
        {!showIntakeFlow && (
          <div className="bg-white border-t border-warm-200 p-3 pb-safe md:p-4">
            {/* Quick Action Chips */}
            <QuickChips chips={chips} onSelect={handleChipSelect} />

            {/* Input Field */}
            <div className="flex gap-2 mt-3">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  currentMode === 'employee'
                    ? 'Type your message here...'
                    : 'Search cases or ask a question...'
                }
                className="flex-1 px-4 py-3 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base min-h-[48px]"
                aria-label={currentMode === 'employee' ? 'Type your message' : 'Search cases'}
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim()}
                className="px-4 md:px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 active:bg-primary-800 disabled:bg-warm-300 disabled:cursor-not-allowed transition-all duration-100 min-w-[48px] min-h-[48px] flex items-center justify-center"
                aria-label="Send message"
              >
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
