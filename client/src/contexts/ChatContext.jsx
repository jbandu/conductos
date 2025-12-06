import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const ChatContext = createContext();

export function ChatProvider({ children }) {
  const { user, isICMember } = useAuth();
  const [messages, setMessages] = useState([]);
  const [currentMode, setCurrentMode] = useState(() => {
    // Initialize from localStorage or default based on user
    const stored = localStorage.getItem('chatMode');
    return stored || 'employee';
  }); // 'employee' | 'ic'
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingCaseCode, setPendingCaseCode] = useState(null);

  // Set IC members to IC mode by default
  useEffect(() => {
    if (user && isICMember) {
      const newMode = 'ic';
      setCurrentMode(newMode);
      localStorage.setItem('chatMode', newMode);
    } else if (user && !isICMember) {
      const newMode = 'employee';
      setCurrentMode(newMode);
      localStorage.setItem('chatMode', newMode);
    }
  }, [user, isICMember]);

  const addMessage = (type, content) => {
    const newMessage = {
      id: Date.now(),
      type,
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const clearMessages = () => {
    setMessages([]);
    setPendingCaseCode(null);
  };

  const toggleMode = () => {
    setCurrentMode(prev => {
      const newMode = prev === 'employee' ? 'ic' : 'employee';
      localStorage.setItem('chatMode', newMode);
      return newMode;
    });
  };

  const updateMode = (mode) => {
    setCurrentMode(mode);
    localStorage.setItem('chatMode', mode);
  };

  const value = {
    messages,
    currentMode,
    isTyping,
    sidebarOpen,
    setIsTyping,
    setSidebarOpen,
    addMessage,
    clearMessages,
    toggleMode,
    setCurrentMode: updateMode,
    pendingCaseCode,
    setPendingCaseCode
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
