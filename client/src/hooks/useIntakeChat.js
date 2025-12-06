import { useState, useCallback, useRef } from 'react';

/**
 * useIntakeChat Hook
 *
 * Manages conversational intake state for the employee complaint flow.
 * This is a standalone hook that doesn't rely on global ChatContext,
 * allowing the chat to be embedded directly in the employee dashboard.
 */

const INITIAL_MESSAGE = {
  id: 'welcome',
  type: 'system',
  content: "Hello! I'm here to help you file a workplace complaint. I'll guide you through the process step by step. Everything you share is confidential.\n\nYou can describe what happened in your own words, or I can ask you specific questions. What would you prefer?",
  timestamp: new Date()
};

const QUICK_PROMPTS = [
  "I want to describe what happened",
  "Ask me questions to help",
  "I have a question first"
];

export default function useIntakeChat() {
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const [extractedData, setExtractedData] = useState({
    incidentDate: null,
    incidentLocation: null,
    description: '',
    respondentName: null,
    respondentDepartment: null,
    hasWitnesses: null,
    witnesses: []
  });
  const [isReadyToSubmit, setIsReadyToSubmit] = useState(false);
  const [conversationPhase, setConversationPhase] = useState('intro'); // intro, gathering, confirming, complete
  const abortControllerRef = useRef(null);

  const addMessage = useCallback((type, content) => {
    const newMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  }, []);

  const sendMessage = useCallback(async (userMessage) => {
    if (!userMessage.trim()) return;

    // Add user message to chat
    addMessage('user', userMessage);
    setIsLoading(true);

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          message: userMessage,
          mode: 'employee',
          intake: true, // Signal that this is an intake conversation
          context: {
            phase: conversationPhase,
            extractedData
          }
        }),
        signal: abortControllerRef.current.signal
      });

      const result = await response.json();

      if (result.success && result.response) {
        const { type, content, extracted, phase } = result.response;

        // Update extracted data if the AI parsed any
        if (extracted) {
          setExtractedData(prev => ({ ...prev, ...extracted }));
        }

        // Update conversation phase if provided
        if (phase) {
          setConversationPhase(phase);
          if (phase === 'complete') {
            setIsReadyToSubmit(true);
          }
        }

        // Handle different response types
        if (type === 'intake_question' || type === 'text') {
          addMessage('system', content);
        } else if (type === 'intake_summary') {
          addMessage('system', {
            type: 'intake_summary',
            summary: content,
            extractedData: extracted || extractedData
          });
          setIsReadyToSubmit(true);
        } else if (type === 'error') {
          addMessage('system', `I'm sorry, there was an issue: ${content}. Let's try again.`);
        } else {
          addMessage('system', content);
        }
      } else {
        addMessage('system', "I'm sorry, I encountered an issue. Could you please try again?");
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Intake chat error:', error);
        addMessage('system', "I'm having trouble connecting. Please try again in a moment.");
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [addMessage, conversationPhase, extractedData]);

  const resetChat = useCallback(() => {
    setMessages([INITIAL_MESSAGE]);
    setExtractedData({
      incidentDate: null,
      incidentLocation: null,
      description: '',
      respondentName: null,
      respondentDepartment: null,
      hasWitnesses: null,
      witnesses: []
    });
    setIsReadyToSubmit(false);
    setConversationPhase('intro');
    setIsLoading(false);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const updateExtractedData = useCallback((updates) => {
    setExtractedData(prev => ({ ...prev, ...updates }));
  }, []);

  return {
    messages,
    isLoading,
    extractedData,
    isReadyToSubmit,
    conversationPhase,
    quickPrompts: QUICK_PROMPTS,
    sendMessage,
    addMessage,
    resetChat,
    updateExtractedData,
    setIsReadyToSubmit
  };
}
