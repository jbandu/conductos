import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../contexts/ChatContext';
import { api } from '../services/api';

export default function Sidebar() {
  const navigate = useNavigate();
  const { currentMode, setCurrentMode, sidebarOpen, setSidebarOpen, clearMessages } = useChat();
  const [recentCases, setRecentCases] = useState([]);

  useEffect(() => {
    if (currentMode === 'ic') {
      fetchRecentCases();
    }
  }, [currentMode]);

  const fetchRecentCases = async () => {
    try {
      const cases = await api.getCases();
      setRecentCases(cases.slice(0, 10));
    } catch (error) {
      console.error('Failed to fetch cases:', error);
    }
  };

  const handleNewChat = () => {
    clearMessages();
    setSidebarOpen(false);
  };

  const handleModeChange = () => {
    const newMode = currentMode === 'employee' ? 'ic' : 'employee';
    setCurrentMode(newMode);
    clearMessages();
  };

  const handleCaseClick = async (caseCode) => {
    setSidebarOpen(false);
    // Trigger case detail view by adding a message
    // This will be picked up by ChatLayout
    if (window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('viewCase', { detail: { caseCode } }));
    }
  };

  const handleLogout = () => {
    clearMessages();
    navigate('/');
  };

  return (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-60 bg-warm-900 text-white flex flex-col transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Logo/Branding */}
        <div className="p-4 border-b border-warm-800">
          <h1 className="text-xl font-bold">KelpHR</h1>
          <p className="text-sm text-warm-400">ConductOS</p>
        </div>

        {/* New Chat Button */}
        <div className="p-4">
          <button
            onClick={handleNewChat}
            className="w-full px-4 py-3 bg-warm-800 hover:bg-warm-700 rounded-lg transition-colors min-h-[44px] flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Chat
          </button>
        </div>

        {/* Mode Toggle */}
        <div className="px-4 pb-4 border-b border-warm-800">
          <div className="bg-warm-800 rounded-lg p-1 flex">
            <button
              onClick={handleModeChange}
              className={`flex-1 px-3 py-2 rounded text-sm transition-colors min-h-[44px] ${
                currentMode === 'employee'
                  ? 'bg-primary-600 text-white'
                  : 'text-warm-400 hover:text-white'
              }`}
            >
              Employee
            </button>
            <button
              onClick={handleModeChange}
              className={`flex-1 px-3 py-2 rounded text-sm transition-colors min-h-[44px] ${
                currentMode === 'ic'
                  ? 'bg-accent-600 text-white'
                  : 'text-warm-400 hover:text-white'
              }`}
            >
              IC Mode
            </button>
          </div>
        </div>

        {/* Case History (IC Mode only) */}
        {currentMode === 'ic' && (
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-warm-400 mb-2">Recent Cases</h3>
              {recentCases.length === 0 ? (
                <p className="text-sm text-warm-500">No cases yet</p>
              ) : (
                <div className="space-y-2">
                  {recentCases.map((caseItem) => (
                    <button
                      key={caseItem.id}
                      onClick={() => handleCaseClick(caseItem.case_code)}
                      className="w-full text-left px-3 py-2 hover:bg-warm-800 rounded text-sm transition-colors min-h-[44px]"
                    >
                      <p className="font-medium truncate">{caseItem.case_code}</p>
                      <p className="text-xs text-warm-400 truncate">{caseItem.status}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Employee Mode Help */}
        {currentMode === 'employee' && (
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-warm-400 mb-2">Quick Actions</h3>
              <div className="space-y-2 text-sm text-warm-500">
                <p>• Report an incident</p>
                <p>• Check case status</p>
                <p>• Learn about PoSH</p>
              </div>
            </div>
          </div>
        )}

        {/* Logout Button */}
        <div className="p-4 border-t border-warm-700">
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2.5 bg-warm-800 hover:bg-warm-700 rounded-lg transition-colors min-h-[44px] flex items-center justify-center gap-2 text-warm-300 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>

        {/* Version Footer */}
        <div className="px-4 pb-4">
          <p className="text-xs text-warm-500 text-center">v1.0.0</p>
        </div>
      </aside>
    </>
  );
}
