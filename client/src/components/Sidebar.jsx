import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

export default function Sidebar() {
  const navigate = useNavigate();
  const { logout, user, isICMember } = useAuth();
  const { currentMode, setCurrentMode, sidebarOpen, setSidebarOpen, clearMessages } = useChat();
  const [recentCases, setRecentCases] = useState([]);

  // Force employee mode for non-IC members
  useEffect(() => {
    if (user && !isICMember && currentMode !== 'employee') {
      setCurrentMode('employee');
    }
  }, [user, isICMember, currentMode, setCurrentMode]);

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
    navigate('/chat');
    setSidebarOpen(false);
  };

  const handleModeChange = () => {
    const newMode = currentMode === 'employee' ? 'ic' : 'employee';
    setCurrentMode(newMode);
    clearMessages();
    navigate('/chat');
  };

  const handleCaseClick = async (caseCode) => {
    setSidebarOpen(false);
    setCurrentMode('ic');
    navigate('/chat');

    // Allow navigation to complete before requesting the case view in ChatLayout
    requestAnimationFrame(() => {
      if (window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('viewCase', { detail: { caseCode } }));
      }
    });
  };

  const handleLogout = () => {
    logout();
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
          {user && (
            <div className="mt-3 pt-3 border-t border-warm-800">
              <p className="text-xs text-warm-500 uppercase tracking-wide mb-1">Logged in as</p>
              <p className="text-sm text-white font-medium truncate">{user.fullName}</p>
              <p className="text-xs text-warm-400 capitalize">{user.role === 'ic_member' ? 'IC Member' : 'Employee'}</p>
            </div>
          )}
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

        {/* Mode Toggle - Only show for IC members */}
        {isICMember && (
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
        )}

        {/* IC Mode Navigation */}
        {currentMode === 'ic' && (
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-warm-400 mb-2 uppercase tracking-wide">IC Features</h3>
              <nav className="space-y-1">
                <button
                  onClick={() => {
                    navigate('/ic/knowledge-base');
                    setSidebarOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-warm-800 rounded text-sm transition-colors min-h-[44px] flex items-center gap-3"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  Knowledge Base
                </button>
                <button
                  onClick={() => {
                    navigate('/ic/patterns');
                    setSidebarOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-warm-800 rounded text-sm transition-colors min-h-[44px] flex items-center gap-3"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Pattern Analysis
                </button>
                <button
                  onClick={() => {
                    navigate('/ic/insights');
                    setSidebarOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-warm-800 rounded text-sm transition-colors min-h-[44px] flex items-center gap-3"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Proactive Insights
                </button>
              </nav>

              <h3 className="text-sm font-semibold text-warm-400 mb-2 mt-6 uppercase tracking-wide">Recent Cases</h3>
              {recentCases.length === 0 ? (
                <p className="text-sm text-warm-500">No cases yet</p>
              ) : (
                <div className="space-y-1">
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

        {/* Profile & Logout Section */}
        <div className="p-4 border-t border-warm-700 space-y-2">
          {user && user.role === 'hr_admin' && (
            <button
              onClick={() => {
                navigate('/admin/dashboard');
                setSidebarOpen(false);
              }}
              className="w-full px-4 py-2.5 bg-accent-600 hover:bg-accent-700 rounded-lg transition-colors min-h-[44px] flex items-center justify-center gap-2 text-white"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Admin Dashboard
            </button>
          )}
          <button
            onClick={() => {
              navigate('/profile');
              setSidebarOpen(false);
            }}
            className="w-full px-4 py-2.5 bg-warm-800 hover:bg-warm-700 rounded-lg transition-colors min-h-[44px] flex items-center justify-center gap-2 text-warm-300 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            My Profile
          </button>
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
