import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import EmployeeLayout from '../../components/employee/EmployeeLayout';
import { api } from '../../services/api';

// Status badge component
function StatusBadge({ status }) {
  const statusConfig = {
    new: { color: 'bg-blue-100 text-blue-800', label: 'New', icon: 'clock' },
    under_review: { color: 'bg-yellow-100 text-yellow-800', label: 'Under Review', icon: 'search' },
    conciliation: { color: 'bg-purple-100 text-purple-800', label: 'Conciliation', icon: 'users' },
    investigating: { color: 'bg-orange-100 text-orange-800', label: 'Investigating', icon: 'shield' },
    decision_pending: { color: 'bg-indigo-100 text-indigo-800', label: 'Decision Pending', icon: 'scale' },
    closed: { color: 'bg-green-100 text-green-800', label: 'Closed', icon: 'check' }
  };

  const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', label: status };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
}

// Case card component
function CaseCard({ caseData, onClick }) {
  const daysRemaining = parseInt(caseData.days_remaining);
  const isUrgent = daysRemaining <= 7 && daysRemaining > 0;
  const isOverdue = daysRemaining < 0;

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">{caseData.case_code}</h3>
          <StatusBadge status={caseData.status} />
        </div>
        {caseData.unread_messages > 0 && (
          <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
            {caseData.unread_messages}
          </span>
        )}
      </div>

      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
        {caseData.description?.substring(0, 100)}...
      </p>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Filed: {new Date(caseData.filed_at).toLocaleDateString()}</span>
        <span className={`font-medium ${isOverdue ? 'text-red-600' : isUrgent ? 'text-orange-600' : 'text-gray-600'}`}>
          {isOverdue ? `${Math.abs(daysRemaining)} days overdue` : `${daysRemaining} days remaining`}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mt-3">
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${isOverdue ? 'bg-red-500' : isUrgent ? 'bg-orange-500' : 'bg-teal-500'}`}
            style={{ width: `${Math.min(100, Math.max(0, ((90 - daysRemaining) / 90) * 100))}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState({
    cases: [],
    pendingDraft: null,
    stats: { total_cases: 0, pending_review: 0, under_investigation: 0, resolved: 0 }
  });
  const [resources, setResources] = useState({ faq: [], helplines: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboard();
    fetchResources();
  }, []);

  const fetchDashboard = async () => {
    try {
      setIsLoading(true);
      const data = await api.getEmployeeDashboard();
      setDashboard(data);
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchResources = async () => {
    try {
      const data = await api.getEmployeeResources();
      setResources(data);
    } catch (err) {
      console.error('Error fetching resources:', err);
    }
  };

  const handleContinueDraft = () => {
    if (dashboard.pendingDraft) {
      navigate('/employee/file-complaint', { state: { draft: dashboard.pendingDraft } });
    }
  };

  if (isLoading) {
    return (
      <EmployeeLayout>
        <div className="flex items-center justify-center h-full min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        </div>
      </EmployeeLayout>
    );
  }

  if (error) {
    return (
      <EmployeeLayout>
        <div className="flex items-center justify-center h-full min-h-[400px]">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchDashboard}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </EmployeeLayout>
    );
  }

  return (
    <EmployeeLayout>
      <div className="p-4 lg:p-8 max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-6 lg:p-8 mb-8 text-white">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-white/20 rounded-xl">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold mb-2">Your Workplace Safety Matters</h1>
              <p className="text-teal-100 text-sm lg:text-base">
                We're here to help. All reports are handled with complete confidentiality as required by the PoSH Act, 2013.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/employee/file-complaint"
              className="inline-flex items-center px-5 py-3 bg-white text-teal-700 rounded-xl font-semibold hover:bg-teal-50 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              File a Report
            </Link>
            <Link
              to="/employee/anonymous-report"
              className="inline-flex items-center px-5 py-3 bg-teal-600 border-2 border-white/30 text-white rounded-xl font-semibold hover:bg-teal-500 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Report Anonymously
            </Link>
            <Link
              to="/chat"
              className="inline-flex items-center px-5 py-3 bg-teal-600 border-2 border-white/30 text-white rounded-xl font-semibold hover:bg-teal-500 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Prefer to Talk? Start a Chat
            </Link>
          </div>
        </div>

        {/* Pending Draft Banner */}
        {dashboard.pendingDraft && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-amber-800">You have an unfinished draft</p>
                <p className="text-sm text-amber-600">
                  Last saved {new Date(dashboard.pendingDraft.updated_at).toLocaleString()}
                </p>
              </div>
            </div>
            <button
              onClick={handleContinueDraft}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium"
            >
              Continue
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* My Cases Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                My Cases ({dashboard.stats.total_cases})
              </h2>
              {dashboard.cases.length > 0 && (
                <Link to="/employee/cases" className="text-teal-600 hover:text-teal-700 text-sm font-medium">
                  View All Cases
                </Link>
              )}
            </div>

            {dashboard.cases.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No cases yet</h3>
                <p className="text-gray-600 mb-4">
                  You haven't filed any complaints. If you're experiencing workplace harassment, we're here to help.
                </p>
                <Link
                  to="/employee/file-complaint"
                  className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                >
                  File Your First Report
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dashboard.cases.map((caseData) => (
                  <CaseCard
                    key={caseData.id}
                    caseData={caseData}
                    onClick={() => navigate(`/employee/cases/${caseData.id}`)}
                  />
                ))}
              </div>
            )}

            {/* Quick Stats */}
            {dashboard.stats.total_cases > 0 && (
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
                  <p className="text-2xl font-bold text-yellow-600">{dashboard.stats.pending_review}</p>
                  <p className="text-sm text-gray-600">Pending Review</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
                  <p className="text-2xl font-bold text-orange-600">{dashboard.stats.under_investigation}</p>
                  <p className="text-sm text-gray-600">Under Investigation</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">{dashboard.stats.resolved}</p>
                  <p className="text-sm text-gray-600">Resolved</p>
                </div>
              </div>
            )}
          </div>

          {/* Resources Section */}
          <div className="lg:col-span-1">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Resources</h2>

            {/* Confidentiality Promise */}
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-5 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <h3 className="font-semibold text-teal-800">Confidentiality Promise</h3>
              </div>
              <p className="text-sm text-teal-700">
                Your identity is protected under Section 16 of the PoSH Act. Only IC members can access your case details.
              </p>
            </div>

            {/* FAQ */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Quick FAQ
              </h3>
              <div className="space-y-3">
                {resources.faq.slice(0, 3).map((item, index) => (
                  <details key={index} className="group">
                    <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-teal-600 list-none flex items-start">
                      <span className="mr-2 text-teal-500 group-open:rotate-90 transition-transform">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                      {item.question}
                    </summary>
                    <p className="mt-2 ml-6 text-sm text-gray-600">{item.answer}</p>
                  </details>
                ))}
              </div>
              <Link to="/employee/resources" className="block mt-4 text-teal-600 hover:text-teal-700 text-sm font-medium">
                View All Resources
              </Link>
            </div>

            {/* Helplines */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                External Helplines
              </h3>
              <div className="space-y-3">
                {resources.helplines.map((helpline, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{helpline.name}</p>
                      <p className="text-xs text-gray-500">{helpline.available}</p>
                    </div>
                    <a
                      href={`tel:${helpline.number}`}
                      className="text-teal-600 font-semibold hover:text-teal-700"
                    >
                      {helpline.number}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </EmployeeLayout>
  );
}
