import React from 'react';
import { Link } from 'react-router-dom';

export default function Hero() {
  return (
    <section className="pt-24 pb-16 bg-gradient-to-b from-warm-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text Content */}
          <div className="space-y-6">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-warm-900 leading-tight">
              A safe space{' '}
              <span className="text-primary-600">to be heard.</span>
            </h1>

            <p className="text-lg sm:text-xl text-warm-600 leading-relaxed max-w-2xl">
              Report workplace concerns confidentially. Track your case transparently.
              Know your rights under the PoSH Act.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link
                to="/chat"
                className="px-8 py-4 bg-accent-600 hover:bg-accent-700 text-white rounded-lg font-semibold transition-all hover:scale-105 shadow-lg text-center"
              >
                Report an Incident
              </Link>
              <Link
                to="/chat"
                className="px-8 py-4 border-2 border-primary-500 text-primary-600 hover:bg-primary-50 rounded-lg font-semibold transition-all text-center"
              >
                Check Case Status
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
