import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function Hero() {
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
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await login(formData.email, formData.password, 'employee');

      if (result.success) {
        navigate('/employee/dashboard');
      } else {
        setError(result.error || 'Invalid email or password. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="pt-24 pb-16 bg-gradient-to-b from-warm-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text Content & Login Form */}
          <div className="space-y-6">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-warm-900 leading-tight">
              A safe space{' '}
              <span className="text-primary-600">to be heard.</span>
            </h1>

            <p className="text-lg sm:text-xl text-warm-600 leading-relaxed max-w-2xl">
              Report workplace concerns confidentially. Track your case transparently.
              Know your rights under the PoSH Act.
            </p>

            {/* Employee Login Form */}
            <div className="bg-white rounded-xl border border-warm-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-warm-900 mb-4">Employee Sign In</h2>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-warm-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-warm-900"
                    placeholder="your.email@company.com"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-warm-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 border border-warm-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-warm-900"
                    placeholder="Enter your password"
                  />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <Link
                    to="/forgot-password"
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Forgot password?
                  </Link>
                  <Link
                    to="/signup/employee"
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Create account
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 active:bg-primary-800 disabled:bg-warm-300 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>

              {/* Staff Login Links */}
              <div className="mt-4 pt-4 border-t border-warm-200 text-center">
                <p className="text-xs text-warm-500 mb-2">Staff Access</p>
                <div className="flex items-center justify-center gap-4 text-sm">
                  <Link
                    to="/login/ic"
                    className="text-accent-600 hover:text-accent-700 font-medium"
                  >
                    IC Member Login
                  </Link>
                  <span className="text-warm-300">|</span>
                  <Link
                    to="/login/admin"
                    className="text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    Admin Login
                  </Link>
                </div>
              </div>
            </div>

            {/* Anonymous Reporting Option */}
            <div className="flex items-center justify-center">
              <Link
                to="/employee/anonymous-report"
                className="inline-flex items-center text-warm-600 hover:text-warm-900 font-medium group"
              >
                <svg className="w-5 h-5 mr-2 text-warm-400 group-hover:text-warm-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Prefer to report anonymously?
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8">
              <div className="flex items-start space-x-2">
                <svg className="w-6 h-6 text-safe flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-warm-900">End-to-end</p>
                  <p className="text-sm text-warm-600">confidential</p>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <svg className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-warm-900">PoSH Act</p>
                  <p className="text-sm text-warm-600">compliant</p>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <svg className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-warm-900">90-day</p>
                  <p className="text-sm text-warm-600">resolution tracking</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Illustration */}
          <div className="relative hidden lg:block">
            <div className="relative h-96 w-full">
              {/* Abstract geometric illustration */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-80 h-80">
                  {/* Layered circles representing safety/protection */}
                  <div className="absolute inset-0 bg-primary-100 rounded-full opacity-40 animate-pulse"></div>
                  <div className="absolute inset-8 bg-primary-200 rounded-full opacity-50"></div>
                  <div className="absolute inset-16 bg-primary-300 rounded-full opacity-60 flex items-center justify-center">
                    <svg className="w-32 h-32 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
