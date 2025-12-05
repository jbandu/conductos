import React from 'react';
import { Link } from 'react-router-dom';

export default function RoleSelection() {
  return (
    <div className="min-h-screen bg-gentle flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-warm-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link to="/" className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded flex items-center justify-center">
              <span className="text-white font-bold">K</span>
            </div>
            <div className="flex flex-col">
              <span className="text-warm-900 font-semibold text-lg leading-tight">
                KelpHR
              </span>
              <span className="text-warm-500 text-sm leading-tight">ConductOS</span>
            </div>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-4xl w-full">
          {/* Title */}
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold text-warm-900 mb-3">
              Welcome to ConductOS
            </h1>
            <p className="text-lg text-warm-600">
              Please select how you'd like to sign in
            </p>
          </div>

          {/* Role Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Employee Card */}
            <Link
              to="/login/employee"
              className="bg-white rounded-xl border-2 border-warm-200 hover:border-primary-400 p-8 transition-all hover:shadow-lg group"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mb-6 group-hover:bg-primary-100 transition-colors">
                  <svg className="w-10 h-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-warm-900 mb-3">
                  Employee
                </h2>
                <p className="text-warm-600 mb-6">
                  Report an incident, check case status, or learn about workplace policies
                </p>
                <div className="inline-flex items-center text-primary-600 font-medium group-hover:text-primary-700">
                  Continue as Employee
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>

            {/* IC Member Card */}
            <Link
              to="/login/ic"
              className="bg-white rounded-xl border-2 border-warm-200 hover:border-accent-400 p-8 transition-all hover:shadow-lg group"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-accent-500/10 rounded-full flex items-center justify-center mb-6 group-hover:bg-accent-500/20 transition-colors">
                  <svg className="w-10 h-10 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-warm-900 mb-3">
                  IC Member
                </h2>
                <p className="text-warm-600 mb-6">
                  Access the Internal Committee dashboard to manage and review cases
                </p>
                <div className="inline-flex items-center text-accent-600 font-medium group-hover:text-accent-700">
                  Continue as IC Member
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>

            {/* HR Admin Card */}
            <Link
              to="/login/admin"
              className="bg-white rounded-xl border-2 border-warm-200 hover:border-indigo-400 p-8 transition-all hover:shadow-lg group"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6 group-hover:bg-indigo-100 transition-colors">
                  <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-warm-900 mb-3">
                  HR Admin
                </h2>
                <p className="text-warm-600 mb-6">
                  Manage users, IC composition, and organization settings
                </p>
                <div className="inline-flex items-center text-indigo-600 font-medium group-hover:text-indigo-700">
                  Continue as Admin
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          </div>

          {/* Help Text */}
          <div className="mt-8 text-center">
            <p className="text-sm text-warm-500">
              Not sure which one to choose?{' '}
              <Link to="/learn" className="text-primary-600 hover:text-primary-700 font-medium">
                Learn about the PoSH Act
              </Link>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-warm-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-warm-500">
            Compliant with the Prevention of Sexual Harassment at Workplace Act, 2013
          </p>
        </div>
      </footer>
    </div>
  );
}
