import React from 'react';

export default function Confidentiality() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Icon/Visual */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-64 h-64 bg-primary-100 rounded-full flex items-center justify-center">
                <svg className="w-32 h-32 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Right: Content */}
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-warm-900 mb-6">
              Your privacy is paramount
            </h2>

            <div className="space-y-4 text-warm-700 leading-relaxed">
              <p>
                Everything you share is confidential. Only authorized Internal Committee members can access case details. If you choose limited-disclosure anonymity, only the Presiding Officer will know your contact information.
              </p>

              <p>
                We maintain complete audit trails for legal compliance, but your personal information is never shared beyond what's necessary for investigation.
              </p>
            </div>

            {/* Trust Indicators */}
            <div className="mt-8 flex flex-wrap gap-4">
              <div className="flex items-center space-x-2 px-4 py-2 bg-safe/10 rounded-lg">
                <svg className="w-5 h-5 text-safe" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium text-warm-800">Encrypted Storage</span>
              </div>

              <div className="flex items-center space-x-2 px-4 py-2 bg-safe/10 rounded-lg">
                <svg className="w-5 h-5 text-safe" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium text-warm-800">Audit Trails</span>
              </div>

              <div className="flex items-center space-x-2 px-4 py-2 bg-safe/10 rounded-lg">
                <svg className="w-5 h-5 text-safe" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium text-warm-800">Access Controls</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
