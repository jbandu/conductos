import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function ICLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(''); // Clear error on input change
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await login(formData.email, formData.password, 'ic_member');

      if (result.success) {
        navigate('/chat');
      } else {
        setError(result.error || 'Invalid credentials. Please ensure you have IC member access.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
        <div className="max-w-md w-full">
          {/* Back Button */}
          <Link
            to="/login"
            className="inline-flex items-center text-sm text-warm-600 hover:text-warm-900 mb-8"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to role selection
          </Link>

          {/* Card */}
          <div className="bg-white rounded-xl border border-warm-200 p-8 shadow-sm">
            {/* Icon */}
            <div className="w-16 h-16 bg-accent-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>

            {/* Title */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-warm-900 mb-2">
                IC Member Sign In
              </h1>
              <p className="text-warm-600">
                Internal Committee Dashboard Access
              </p>
            </div>

            {/* Info Banner */}
            <div className="mb-6 p-4 bg-accent-50 border border-accent-200 rounded-lg">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-accent-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="ml-3">
                  <p className="text-sm text-accent-900">
                    This portal is restricted to authorized Internal Committee members only.
                  </p>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-warm-700 mb-2">
                  IC Member Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent text-warm-900"
                  placeholder="ic.member@company.com"
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-warm-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent text-warm-900"
                  placeholder="Enter your password"
                />
              </div>

              {/* Forgot Password */}
              <div className="flex justify-end">
                <Link
                  to="/forgot-password"
                  className="text-sm text-accent-600 hover:text-accent-700 font-medium"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-6 py-3 bg-accent-600 text-white rounded-lg font-medium hover:bg-accent-700 active:bg-accent-800 disabled:bg-warm-300 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Signing in...' : 'Access IC Dashboard'}
              </button>
            </form>
          </div>

          {/* Help Links */}
          <div className="mt-6 space-y-3">
            {/* IC Resources */}
            <div className="p-4 bg-white border border-warm-200 rounded-lg">
              <h3 className="text-sm font-semibold text-warm-900 mb-2">IC Member Resources</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/ic" className="text-accent-600 hover:text-accent-700 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Learn about IC features
                  </Link>
                </li>
                <li>
                  <Link to="/learn" className="text-accent-600 hover:text-accent-700 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    PoSH Act guidelines
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div className="text-center">
              <p className="text-sm text-warm-500">
                Need IC access?{' '}
                <a href="mailto:hr@company.com" className="text-accent-600 hover:text-accent-700 font-medium">
                  Contact HR
                </a>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-warm-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-warm-500">
            🔒 Secure IC Portal | Compliant with PoSH Act, 2013
          </p>
        </div>
      </footer>
    </div>
  );
}
