/**
 * SSO Callback Page
 * Handles the redirect after SSO authentication
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { parseCallbackParams } from '../../services/ssoService';

export default function SSOCallback() {
  const navigate = useNavigate();
  const { setAuthFromToken } = useAuth();
  const [status, setStatus] = useState('processing'); // processing, success, error
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleCallback = async () => {
      const params = parseCallbackParams();

      if (!params) {
        setStatus('error');
        setError('Invalid callback - no authentication data received');
        return;
      }

      if (params.error) {
        setStatus('error');
        setError(params.error);
        return;
      }

      if (params.token) {
        try {
          // Store the token and set authentication state
          const success = await setAuthFromToken(params.token);

          if (success) {
            setStatus('success');
            // Short delay to show success message, then redirect
            setTimeout(() => {
              navigate('/dashboard', { replace: true });
            }, 1500);
          } else {
            setStatus('error');
            setError('Failed to validate authentication token');
          }
        } catch (err) {
          setStatus('error');
          setError(err.message || 'Authentication failed');
        }
      }
    };

    handleCallback();
  }, [navigate, setAuthFromToken]);

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
        <div className="max-w-md w-full text-center">
          {status === 'processing' && (
            <div className="bg-white rounded-xl border border-warm-200 p-8 shadow-sm">
              {/* Loading Animation */}
              <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="animate-spin h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>

              <h1 className="text-2xl font-bold text-warm-900 mb-2">
                Completing Sign In
              </h1>
              <p className="text-warm-600">
                Please wait while we verify your authentication...
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="bg-white rounded-xl border border-warm-200 p-8 shadow-sm">
              {/* Success Icon */}
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <h1 className="text-2xl font-bold text-warm-900 mb-2">
                Welcome Back!
              </h1>
              <p className="text-warm-600">
                SSO authentication successful. Redirecting to dashboard...
              </p>

              {/* Progress Bar */}
              <div className="mt-6 w-full bg-warm-200 rounded-full h-1 overflow-hidden">
                <div className="bg-primary-600 h-1 rounded-full animate-progress"></div>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="bg-white rounded-xl border border-warm-200 p-8 shadow-sm">
              {/* Error Icon */}
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>

              <h1 className="text-2xl font-bold text-warm-900 mb-2">
                Authentication Failed
              </h1>
              <p className="text-warm-600 mb-4">
                {error || 'An error occurred during SSO authentication.'}
              </p>

              {/* Error Details */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-3">
                <Link
                  to="/login"
                  className="block w-full px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors text-center"
                >
                  Try Again
                </Link>
                <Link
                  to="/login/employee"
                  className="block w-full px-6 py-3 bg-white text-warm-700 border border-warm-300 rounded-lg font-medium hover:bg-warm-50 transition-colors text-center"
                >
                  Sign in with Password
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-warm-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-warm-500">
            Secure SSO powered by enterprise identity providers
          </p>
        </div>
      </footer>

      {/* CSS for progress animation */}
      <style>{`
        @keyframes progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        .animate-progress {
          animation: progress 1.5s ease-in-out forwards;
        }
      `}</style>
    </div>
  );
}
