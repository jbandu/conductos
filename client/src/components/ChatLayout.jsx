import React, { useEffect, useRef, useState } from 'react';
import { useChat } from '../contexts/ChatContext';
import ChatMessage from './ChatMessage';
import QuickChips from './QuickChips';
import TypingIndicator from './TypingIndicator';
import Sidebar from './Sidebar';

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
  const { messages, currentMode, isTyping, sidebarOpen, setSidebarOpen, addMessage } = useChat();
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const chips = currentMode === 'employee' ? EMPLOYEE_CHIPS : IC_CHIPS;

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = () => {
    if (inputValue.trim()) {
      addMessage('user', inputValue.trim());
      setInputValue('');

      // Simulate system response (placeholder for now)
      setTimeout(() => {
        addMessage('system', `I received your message: "${inputValue.trim()}". This is a placeholder response.`);
      }, 1000);
    }
  };

  const handleChipSelect = (chip) => {
    addMessage('user', chip);

    // Simulate system response
    setTimeout(() => {
      addMessage('system', `Processing your request: "${chip}". This is a placeholder response.`);
    }, 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Hamburger Menu (Mobile) */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {currentMode === 'employee' ? 'Employee Portal' : 'Investigation Committee'}
              </h2>
              <p className="text-sm text-gray-500">
                {currentMode === 'employee' ? 'Submit and track your cases' : 'Manage all cases'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              currentMode === 'employee'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-purple-100 text-purple-700'
            }`}>
              {currentMode === 'employee' ? 'Employee Mode' : 'IC Mode'}
            </span>
          </div>
        </header>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full px-4">
              <div className="text-center max-w-md">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {currentMode === 'employee'
                    ? 'Welcome to ConductOS'
                    : 'IC Dashboard'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {currentMode === 'employee'
                    ? 'How can I help you today? You can report an incident, check case status, or ask questions about workplace policies.'
                    : 'Manage and review all cases. Use quick actions below to filter and view cases.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="py-4">
              {messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  type={msg.type}
                  content={msg.content}
                  timestamp={msg.timestamp}
                />
              ))}
              {isTyping && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="bg-white border-t border-gray-200 p-4">
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
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base min-h-[44px]"
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors min-h-[44px] flex items-center justify-center"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
