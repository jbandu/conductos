import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function EmployeeLayout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const navigation = [
    {
      name: 'Dashboard',
      path: '/employee/dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      name: 'My Cases',
      path: '/employee/cases',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      name: 'File a Complaint',
      path: '/employee/file-complaint',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      name: 'Resources',
      path: '/employee/resources',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-teal-700 text-white p-4 flex items-center justify-between">
        <h1 className="text-lg font-bold">KelpHR ConductOS</h1>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 hover:bg-teal-600 rounded-lg"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${isSidebarOpen ? 'w-64' : 'lg:w-20'}
        bg-teal-700 text-white transition-all duration-300 flex flex-col
      `}>
        {/* Logo & Toggle */}
        <div className="p-4 flex items-center justify-between">
          {isSidebarOpen && (
            <div>
              <h1 className="text-xl font-bold">KelpHR</h1>
              <p className="text-xs text-teal-200">ConductOS</p>
            </div>
          )}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="hidden lg:block p-2 hover:bg-teal-600 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isSidebarOpen ? "M11 19l-7-7 7-7m8 14l-7-7 7-7" : "M13 5l7 7-7 7M5 5l7 7-7 7"} />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center px-3 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-teal-600 text-white'
                    : 'text-teal-100 hover:bg-teal-600'
                }`}
                title={!isSidebarOpen ? item.name : ''}
              >
                {item.icon}
                {isSidebarOpen && (
                  <span className="ml-3 font-medium">{item.name}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Confidentiality Badge */}
        {isSidebarOpen && (
          <div className="mx-4 mb-4 p-3 bg-teal-800 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-teal-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="text-sm font-semibold text-white">Confidential</span>
            </div>
            <p className="text-xs text-teal-200">
              Your identity is protected under Section 16 of the PoSH Act.
            </p>
          </div>
        )}

        {/* User Info */}
        <div className="border-t border-teal-600 p-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold">
                {user?.fullName?.[0] || user?.name?.[0] || 'E'}
              </span>
            </div>
            {isSidebarOpen && (
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium">{user?.fullName || user?.name || 'Employee'}</p>
                <p className="text-xs text-teal-200">Employee</p>
              </div>
            )}
          </div>
          {isSidebarOpen && (
            <div className="mt-3 flex gap-2">
              <Link
                to="/profile"
                className="flex-1 flex items-center justify-center px-3 py-2 bg-teal-600 hover:bg-teal-500 rounded-lg transition-colors text-sm font-medium"
              >
                Profile
              </Link>
              <button
                onClick={handleLogout}
                className="flex-1 flex items-center justify-center px-3 py-2 bg-teal-600 hover:bg-teal-500 rounded-lg transition-colors text-sm font-medium"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto lg:mt-0 mt-16">
        {children}
      </div>
    </div>
  );
}
