import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/landing/Navbar';
import Footer from '../../components/landing/Footer';

export default function ICLandingPage() {
  const challenges = [
    {
      problem: 'Manually tracking 90-day deadlines in spreadsheets',
      solution: 'Automatic countdown with alerts at 60, 30, 15, and 7 days',
      icon: (
        <svg className="w-8 h-8 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      problem: 'Chasing updates via email and WhatsApp',
      solution: 'Centralized case view with complete history',
      icon: (
        <svg className="w-8 h-8 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      ),
    },
    {
      problem: 'Scattered documents, missing audit trails',
      solution: 'Every action logged, every change timestamped',
      icon: (
        <svg className="w-8 h-8 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      problem: 'Fear of missing legal requirements',
      solution: 'Built-in PoSH Act compliance guardrails',
      icon: (
        <svg className="w-8 h-8 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
  ];

  const responsibilities = [
    {
      title: 'Receiving Complaints',
      items: ['Accept complaints in writing', 'Provide acknowledgment within 7 days', 'Explain process to complainant'],
    },
    {
      title: 'Conducting Inquiry',
      items: ['Complete within 90 days', 'Follow principles of natural justice', 'Give both parties opportunity to be heard'],
    },
    {
      title: 'Maintaining Confidentiality',
      items: ['Never disclose complainant identity', 'Secure all documents', 'Limit information to need-to-know'],
    },
    {
      title: 'Submitting Report',
      items: ['Provide findings to employer', 'Recommend appropriate action', 'Include minority view if any'],
    },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-to-b from-accent-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="inline-block px-4 py-2 bg-accent-100 text-accent-700 rounded-full text-sm font-medium mb-4">
              For Internal Committee Members
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-warm-900 mb-6 leading-tight">
              Manage PoSH cases with{' '}
              <span className="text-accent-600">clarity and confidence</span>
            </h1>
            <p className="text-xl text-warm-600 max-w-3xl mx-auto leading-relaxed mb-8">
              Streamline your IC workflow. Track deadlines automatically. Stay
              compliant effortlessly.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/chat"
                className="px-8 py-4 bg-accent-600 hover:bg-accent-700 text-white rounded-lg font-semibold transition-all hover:scale-105 shadow-lg"
              >
                Access Dashboard
              </Link>
              <button
                onClick={() =>
                  document.getElementById('features').scrollIntoView({ behavior: 'smooth' })
                }
                className="px-8 py-4 border-2 border-accent-600 text-accent-600 hover:bg-accent-50 rounded-lg font-semibold transition-all"
              >
                See How It Works
              </button>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="mt-12 max-w-5xl mx-auto">
            <div className="bg-white rounded-xl shadow-2xl p-4 border border-warm-200">
              <div className="bg-warm-50 rounded-lg h-96 flex items-center justify-center">
                <div className="text-center">
                  <div className="inline-block p-6 bg-accent-100 rounded-full mb-4">
                    <svg
                      className="w-16 h-16 text-accent-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  </div>
                  <p className="text-warm-600 font-medium">Dashboard Preview</p>
                  <p className="text-sm text-warm-500 mt-2">
                    Clean, organized interface for case management
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Challenges We Solve */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-warm-900 mb-4">
              We understand the IC burden
            </h2>
            <p className="text-lg text-warm-600 max-w-2xl mx-auto">
              Common challenges IC members face, and how we solve them
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {challenges.map((challenge, index) => (
              <div
                key={index}
                className="p-6 bg-warm-50 rounded-lg border-l-4 border-accent-500"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">{challenge.icon}</div>
                  <div>
                    <p className="text-warm-600 mb-2">❌ {challenge.problem}</p>
                    <p className="text-warm-900 font-medium">
                      ✅ {challenge.solution}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-warm-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-warm-900 mb-4">
              Everything you need in one place
            </h2>
          </div>

          {/* Feature 1 */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
            <div>
              <h3 className="text-2xl font-bold text-warm-900 mb-4">
                Conversational Interface
              </h3>
              <p className="text-lg text-warm-600 mb-6">
                Manage cases through natural conversation. No complex menus or
                training required.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                  <code className="text-sm text-warm-700">
                    "Show pending cases"
                  </code>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                  <code className="text-sm text-warm-700">"What's overdue?"</code>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                  <code className="text-sm text-warm-700">
                    "Update KELP-2025-0042 to investigating"
                  </code>
                </div>
              </div>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <div className="space-y-4">
                <div className="bg-primary-50 p-4 rounded-lg text-sm">
                  <p className="text-warm-700">Show overdue cases</p>
                </div>
                <div className="bg-warm-100 p-4 rounded-lg text-sm">
                  <p className="text-warm-700 font-medium mb-2">
                    ⚠️ 2 cases past statutory deadline
                  </p>
                  <div className="space-y-2">
                    <div className="text-xs text-warm-600">
                      KELP-2025-0003 • 5 days overdue
                    </div>
                    <div className="text-xs text-warm-600">
                      KELP-2025-0004 • 5 days overdue
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
            <div className="order-2 lg:order-1">
              <div className="bg-white p-8 rounded-xl shadow-lg">
                <div className="space-y-3">
                  {[
                    { code: 'KELP-2025-0001', status: 'Investigating', days: '45 days left', color: 'green' },
                    { code: 'KELP-2025-0003', status: 'Decision Pending', days: 'OVERDUE', color: 'red' },
                    { code: 'KELP-2025-0012', status: 'New', days: '7 days left', color: 'orange' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-warm-50 rounded">
                      <div>
                        <div className="font-medium text-sm">{item.code}</div>
                        <div className="text-xs text-warm-600">{item.status}</div>
                      </div>
                      <div className={`text-xs font-medium ${item.color === 'red' ? 'text-red-600' : item.color === 'orange' ? 'text-orange-600' : 'text-green-600'}`}>
                        {item.days}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <h3 className="text-2xl font-bold text-warm-900 mb-4">
                Smart Dashboard
              </h3>
              <p className="text-lg text-warm-600 mb-6">
                See all cases at a glance. Filter by status, deadline, or date
                range. Never miss an overdue case.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-safe" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-warm-700">Color-coded status badges</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-safe" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-warm-700">Days remaining countdown</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-safe" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-warm-700">Overdue alerts in red</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-bold text-warm-900 mb-4">
                Complete Audit Trail
              </h3>
              <p className="text-lg text-warm-600 mb-6">
                Every status change, every update, timestamped and logged. Ready
                for any audit or legal review.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-safe" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-warm-700">Who changed what, when</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-safe" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-warm-700">Notes and context preserved</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-safe" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-warm-700">Full timeline visualization</span>
                </li>
              </ul>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <div className="space-y-6">
                {[
                  { status: 'New', date: 'Nov 10, 2025', color: 'blue' },
                  { status: 'Under Review', date: 'Nov 15, 2025', color: 'yellow' },
                  { status: 'Investigating', date: 'Nov 25, 2025', color: 'purple' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-4 h-4 rounded-full bg-${item.color}-500`}></div>
                      {i < 2 && <div className="w-0.5 h-full bg-warm-200"></div>}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="font-medium text-sm text-warm-900">{item.status}</div>
                      <div className="text-xs text-warm-500">{item.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Responsibilities Reference */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-warm-900 mb-4">
              IC Member Quick Reference
            </h2>
            <p className="text-lg text-warm-600">
              Key duties under the PoSH Act, 2013
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {responsibilities.map((duty, index) => (
              <div key={index} className="p-6 bg-accent-50 rounded-lg">
                <h3 className="font-semibold text-warm-900 mb-3">{duty.title}</h3>
                <ul className="space-y-2 text-sm text-warm-700">
                  {duty.items.map((item, i) => (
                    <li key={i}>• {item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { number: '90 days', label: 'Maximum inquiry duration' },
              { number: '7 days', label: 'Acknowledgment deadline' },
              { number: '10 days', label: 'Notice period for respondent' },
              { number: '₹50,000', label: 'Penalty for non-compliance' },
            ].map((stat, index) => (
              <div key={index} className="p-6 bg-primary-50 rounded-lg text-center">
                <div className="text-3xl font-bold text-primary-600 mb-2">
                  {stat.number}
                </div>
                <div className="text-sm text-warm-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security & Compliance */}
      <section className="py-20 bg-warm-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-warm-900 mb-4">
              Enterprise-grade security
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {[
              { icon: '🔐', label: 'Role-based access control' },
              { icon: '🔒', label: 'Data encryption at rest' },
              { icon: '📍', label: 'India data residency' },
              { icon: '📋', label: 'Complete audit logs' },
              { icon: '🛡️', label: 'PoSH Act compliant' },
              { icon: '✅', label: 'SOC 2 roadmap' },
            ].map((item, index) => (
              <div key={index} className="p-4 bg-white rounded-lg text-center">
                <div className="text-3xl mb-2">{item.icon}</div>
                <div className="text-xs text-warm-700">{item.label}</div>
              </div>
            ))}
          </div>

          <p className="text-center text-warm-600 mt-8">
            Your organization's sensitive data is protected with industry-standard
            security practices.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-br from-warm-800 to-warm-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to streamline your IC workflow?
          </h2>
          <p className="text-xl text-warm-300 mb-8">
            Access your dashboard or request a demo for your organization
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link
              to="/chat"
              className="px-8 py-4 bg-white text-warm-900 rounded-lg font-semibold hover:bg-warm-50 transition-all hover:scale-105"
            >
              Access Dashboard
            </Link>
            <button className="px-8 py-4 border-2 border-white text-white rounded-lg font-semibold hover:bg-warm-800 transition-all">
              Request Demo
            </button>
          </div>

          <p className="text-warm-400">
            Questions? Email ic-support@kelphr.com
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
