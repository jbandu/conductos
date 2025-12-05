import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const ChatContext = createContext();

export function ChatProvider({ children }) {
  const { user, isICMember } = useAuth();
  const [messages, setMessages] = useState([]);
  const [currentMode, setCurrentMode] = useState('employee'); // 'employee' | 'ic'
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Set IC members to IC mode by default
  useEffect(() => {
    if (user && isICMember) {
      setCurrentMode('ic');
    } else if (user && !isICMember) {
      setCurrentMode('employee');
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
  };

  const toggleMode = () => {
    setCurrentMode(prev => prev === 'employee' ? 'ic' : 'employee');
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
    setCurrentMode
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
