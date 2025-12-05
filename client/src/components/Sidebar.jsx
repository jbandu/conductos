import React, { useEffect, useState } from 'react';
import { useChat } from '../contexts/ChatContext';
import { api } from '../services/api';

export default function Sidebar() {
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
        className={`fixed md:static inset-y-0 left-0 z-50 w-60 bg-gray-900 text-white flex flex-col transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Logo/Branding */}
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-bold">KelpHR</h1>
          <p className="text-sm text-gray-400">ConductOS</p>
        </div>

        {/* New Chat Button */}
        <div className="p-4">
          <button
            onClick={handleNewChat}
            className="w-full px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors min-h-[44px] flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Chat
          </button>
        </div>

        {/* Mode Toggle */}
        <div className="px-4 pb-4 border-b border-gray-700">
          <div className="bg-gray-800 rounded-lg p-1 flex">
            <button
              onClick={handleModeChange}
              className={`flex-1 px-3 py-2 rounded text-sm transition-colors min-h-[44px] ${
                currentMode === 'employee'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Employee
            </button>
            <button
              onClick={handleModeChange}
              className={`flex-1 px-3 py-2 rounded text-sm transition-colors min-h-[44px] ${
                currentMode === 'ic'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
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
              <h3 className="text-sm font-semibold text-gray-400 mb-2">Recent Cases</h3>
              {recentCases.length === 0 ? (
                <p className="text-sm text-gray-500">No cases yet</p>
              ) : (
                <div className="space-y-2">
                  {recentCases.map((caseItem) => (
                    <button
                      key={caseItem.id}
                      onClick={() => handleCaseClick(caseItem.case_code)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-800 rounded text-sm transition-colors min-h-[44px]"
                    >
                      <p className="font-medium truncate">{caseItem.case_code}</p>
                      <p className="text-xs text-gray-400 truncate">{caseItem.status}</p>
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
              <h3 className="text-sm font-semibold text-gray-400 mb-2">Quick Actions</h3>
              <div className="space-y-2 text-sm text-gray-500">
                <p>• Report an incident</p>
                <p>• Check case status</p>
                <p>• Learn about PoSH</p>
              </div>
            </div>
          </div>
        )}

        {/* Version/Footer */}
        <div className="p-4 border-t border-gray-700">
          <p className="text-xs text-gray-500">v1.0.0</p>
        </div>
      </aside>
    </>
  );
}
