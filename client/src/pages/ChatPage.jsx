import React from 'react';
import { ChatProvider } from '../contexts/ChatContext';
import ChatLayout from '../components/ChatLayout';

export default function ChatPage() {
  return (
    <ChatProvider>
      <ChatLayout />
    </ChatProvider>
  );
}
