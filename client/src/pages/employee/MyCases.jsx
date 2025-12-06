import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import EmployeeLayout from '../../components/employee/EmployeeLayout';
import { api } from '../../services/api';

function StatusBadge({ status }) {
  const statusConfig = {
    new: { color: 'bg-blue-100 text-blue-800', label: 'New' },
    under_review: { color: 'bg-yellow-100 text-yellow-800', label: 'Under Review' },
    conciliation: { color: 'bg-purple-100 text-purple-800', label: 'Conciliation' },
    investigating: { color: 'bg-orange-100 text-orange-800', label: 'Investigating' },
    decision_pending: { color: 'bg-indigo-100 text-indigo-800', label: 'Decision Pending' },
    closed: { color: 'bg-green-100 text-green-800', label: 'Closed' }
  };

  const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', label: status };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
}

export default function MyCases() {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      setIsLoading(true);
      const data = await api.getEmployeeCases();
      setCases(data.cases || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCases = cases.filter(c => {
    if (filter === 'all') return true;
    if (filter === 'active') return c.status !== 'closed';
    if (filter === 'closed') return c.status === 'closed';
    return c.status === filter;
  });

  if (isLoading) {
    return (
      <EmployeeLayout>
        <div className="flex items-center justify-center h-full min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        </div>
      </EmployeeLayout>
    );
  }

  return (
    <EmployeeLayout>
      <div className="p-4 lg:p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Cases</h1>
            <p className="text-gray-600">Track and manage your complaints</p>
          </div>
          <Link
            to="/employee/file-complaint"
            className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            File New Complaint
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { value: 'all', label: 'All Cases' },
            { value: 'active', label: 'Active' },
            { value: 'new', label: 'New' },
            { value: 'under_review', label: 'Under Review' },
            { value: 'investigating', label: 'Investigating' },
            { value: 'closed', label: 'Closed' }
          ].map(option => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === option.value
                  ? 'bg-teal-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {option.label}
              {option.value === 'all' && ` (${cases.length})`}
            </button>
          ))}
        </div>

        {/* Cases List */}
        {filteredCases.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === 'all' ? 'No cases yet' : `No ${filter} cases`}
            </h3>
            <p className="text-gray-600 mb-4">
              {filter === 'all'
                ? "You haven't filed any complaints yet."
                : 'No cases match this filter.'}
            </p>
            {filter === 'all' && (
              <Link
                to="/employee/file-complaint"
                className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
              >
                File Your First Report
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Case Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Filed Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    Deadline
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCases.map((caseData) => {
                  const daysRemaining = parseInt(caseData.days_remaining);
                  const isOverdue = daysRemaining < 0;
                  const isUrgent = daysRemaining <= 7 && daysRemaining > 0;
                  const progressPercent = Math.min(100, Math.max(0, ((90 - daysRemaining) / 90) * 100));

                  return (
                    <tr
                      key={caseData.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/employee/cases/${caseData.id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{caseData.case_code}</span>
                          {caseData.unread_messages > 0 && (
                            <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                              {caseData.unread_messages}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={caseData.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell text-sm text-gray-500">
                        {new Date(caseData.filed_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                        <span className={`text-sm ${isOverdue ? 'text-red-600' : isUrgent ? 'text-orange-600' : 'text-gray-500'}`}>
                          {isOverdue ? `${Math.abs(daysRemaining)}d overdue` : `${daysRemaining}d left`}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-24">
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                isOverdue ? 'bg-red-500' : isUrgent ? 'bg-orange-500' : 'bg-teal-500'
                              }`}
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/employee/cases/${caseData.id}`);
                          }}
                          className="text-teal-600 hover:text-teal-700 text-sm font-medium"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </EmployeeLayout>
  );
}
