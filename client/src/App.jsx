import React from 'react'
import { ChatProvider } from './contexts/ChatContext'
import ChatLayout from './components/ChatLayout'

function App() {
  return (
    <ChatProvider>
      <ChatLayout />
    </ChatProvider>
  )
}

export default App
