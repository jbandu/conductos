import React from 'react';
import { ChatProvider, useChat } from '../../contexts/ChatContext';
import Sidebar from '../Sidebar';

function ICFeatureShell({ title, description, children }) {
  const { setSidebarOpen } = useChat();

  return (
    <div className="flex min-h-screen bg-gentle">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-warm-200 px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-2 hover:bg-warm-50 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Open navigation"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div>
            <p className="text-sm text-warm-600">Investigation Committee Workspace</p>
            <h1 className="text-2xl font-semibold text-warm-900">{title}</h1>
            {description && (
              <p className="text-sm text-warm-600 mt-1">{description}</p>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-gradient-to-b from-warm-50 to-white">
          <div className="max-w-7xl mx-auto p-4 sm:p-6">
            <div className="bg-white border border-warm-200 rounded-xl shadow-sm">
              <div className="p-4 sm:p-6 space-y-6">
                {children}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function ICFeatureLayout(props) {
  return (
    <ChatProvider>
      <ICFeatureShell {...props} />
    </ChatProvider>
  );
}
