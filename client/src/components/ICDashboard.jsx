import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

export default function ICDashboard({ onQuickAction }) {
  const [stats, setStats] = useState({
    total: 0,
    overdue: 0,
    dueToday: 0,
    newCases: 0,
    inProgress: 0,
    closed: 0
  });
  const [recentCases, setRecentCases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const [casesData, dashboardData] = await Promise.all([
        api.getCases(),
        api.getDashboardStats()
      ]);

      setRecentCases(casesData.slice(0, 5));
      setStats(dashboardData.stats || stats);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color, subtitle }) => (
    <div className="bg-white rounded-lg border border-warm-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-warm-600 mb-1">{title}</p>
          <p className={`text-3xl font-bold ${color}`}>{value}</p>
          {subtitle && (
            <p className="text-xs text-warm-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-lg ${color.replace('text-', 'bg-').replace('-600', '-50')} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
    </div>
  );

  const QuickActionButton = ({ title, description, icon, onClick, color = "primary" }) => (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 bg-white border border-warm-200 rounded-lg hover:border-${color}-300 hover:shadow-sm transition-all group`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg bg-${color}-50 flex items-center justify-center flex-shrink-0 group-hover:bg-${color}-100 transition-colors`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-warm-900 group-hover:text-primary-600 transition-colors">{title}</p>
          <p className="text-sm text-warm-600 mt-0.5">{description}</p>
        </div>
      </div>
    </button>
  );

  const calculateDaysOpen = (caseItem) => {
    const dateString = caseItem.reported_at || caseItem.created_at || caseItem.incident_date;
    const parsedDate = dateString ? new Date(dateString) : null;

    if (!parsedDate || isNaN(parsedDate.getTime())) {
      return 0;
    }

    return Math.max(0, Math.floor((Date.now() - parsedDate.getTime()) / (1000 * 60 * 60 * 24)));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-accent-200 border-t-accent-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-warm-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-warm-900 mb-2">IC Dashboard</h2>
        <p className="text-warm-600">Comprehensive case management and oversight</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <StatCard
          title="Total Cases"
          value={stats.total}
          color="text-warm-900"
          subtitle="All time"
          icon={
            <svg className="w-6 h-6 text-warm-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />

        <StatCard
          title="Overdue Cases"
          value={stats.overdue}
          color="text-red-600"
          subtitle="Requires immediate attention"
          icon={
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />

        <StatCard
          title="Due Today"
          value={stats.dueToday}
          color="text-orange-600"
          subtitle="Action required today"
          icon={
            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          }
        />

        <StatCard
          title="New Cases"
          value={stats.newCases}
          color="text-blue-600"
          subtitle="Last 7 days"
          icon={
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          }
        />

        <StatCard
          title="In Progress"
          value={stats.inProgress}
          color="text-accent-600"
          subtitle="Active investigations"
          icon={
            <svg className="w-6 h-6 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
        />

        <StatCard
          title="Closed Cases"
          value={stats.closed}
          color="text-green-600"
          subtitle="Resolved"
          icon={
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Cases */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-warm-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-warm-200 flex items-center justify-between">
              <h3 className="font-semibold text-warm-900">Recent Cases</h3>
              <button
                onClick={() => onQuickAction('Show All Cases')}
                className="text-sm text-accent-600 hover:text-accent-700 font-medium"
              >
                View All
              </button>
            </div>

            <div className="overflow-x-auto">
              {recentCases.length === 0 ? (
                <div className="p-8 text-center">
                  <svg className="w-12 h-12 text-warm-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-warm-600">No cases yet</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-warm-50">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-medium text-warm-600 uppercase tracking-wider">Case Code</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-warm-600 uppercase tracking-wider">Status</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-warm-600 uppercase tracking-wider">Priority</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-warm-600 uppercase tracking-wider">Days Open</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-warm-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-warm-100">
                    {recentCases.map((caseItem) => {
                      const daysOpen = calculateDaysOpen(caseItem);
                      const statusColors = {
                        'new': 'bg-blue-50 text-blue-700',
                        'investigating': 'bg-accent-50 text-accent-700',
                        'closed': 'bg-green-50 text-green-700',
                        'escalated': 'bg-red-50 text-red-700'
                      };

                      return (
                        <tr key={caseItem.id} className="hover:bg-warm-25 transition-colors">
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-warm-900">{caseItem.case_code}</span>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[caseItem.status] || 'bg-warm-100 text-warm-700'}`}>
                              {caseItem.status}
                            </span>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className="text-sm text-warm-600 capitalize">{caseItem.severity || 'medium'}</span>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className={`text-sm ${daysOpen > 60 ? 'text-red-600 font-medium' : 'text-warm-600'}`}>
                              {daysOpen} days
                            </span>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <button
                              onClick={() => onQuickAction(`status ${caseItem.case_code}`)}
                              className="text-sm text-accent-600 hover:text-accent-700 font-medium"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-warm-200 p-5">
            <h3 className="font-semibold text-warm-900 mb-4">Quick Actions</h3>

            <div className="space-y-3">
              <QuickActionButton
                title="Show All Cases"
                description="View complete case list"
                color="accent"
                icon={
                  <svg className="w-5 h-5 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                }
                onClick={() => onQuickAction('Show All Cases')}
              />

              <QuickActionButton
                title="Overdue Cases"
                description="Cases past 90-day deadline"
                color="red"
                icon={
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                onClick={() => onQuickAction('Overdue')}
              />

              <QuickActionButton
                title="Pending Review"
                description="Cases awaiting action"
                color="orange"
                icon={
                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                onClick={() => onQuickAction('Pending')}
              />

              <QuickActionButton
                title="Today's Deadlines"
                description="Action required today"
                color="primary"
                icon={
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                }
                onClick={() => onQuickAction("Today's Deadlines")}
              />
            </div>
          </div>

          {/* PoSH Act Reminder */}
          <div className="mt-6 bg-accent-50 border border-accent-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-accent-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-accent-900 mb-1">90-Day Statutory Deadline</p>
                <p className="text-xs text-accent-700">
                  All cases must be resolved within 90 days as per PoSH Act, 2013
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
