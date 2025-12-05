import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';

export default function ProactiveInsights() {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchInsights();
  }, []);

  const normalizeInsight = (insight = {}) => ({
    ...insight,
    status: insight?.status || 'unknown',
    category: insight?.category || 'case_management',
    priority: insight?.priority || 'low',
    recommendation: insight?.recommendation || insight?.recommended_action || insight?.recommendations?.join(', ')
  });

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const data = await api.getInsights();
      setInsights((data || []).map(normalizeInsight));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await api.updateInsight(id, { status: newStatus });
      fetchInsights();
    } catch (err) {
      setError(err.message);
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'low': 'bg-green-100 text-green-800 border-green-200',
      'medium': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'high': 'bg-orange-100 text-orange-800 border-orange-200',
      'critical': 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-blue-100 text-blue-700',
      'acknowledged': 'bg-purple-100 text-purple-700',
      'in_progress': 'bg-yellow-100 text-yellow-700',
      'resolved': 'bg-green-100 text-green-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'compliance': (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      'training': (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      'case_management': (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    };
    return icons[category] || icons['case_management'];
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Proactive Insights</h1>
        <p className="text-gray-600">AI-generated recommendations and compliance alerts</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid gap-6">
        {insights.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <p className="mt-2 text-gray-600">No insights available yet</p>
          </div>
        ) : (
          insights.map((insight) => (
            <div key={insight.id} className={`border-2 rounded-lg p-6 ${getPriorityColor(insight.priority)}`}>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 text-gray-700">
                  {getCategoryIcon(insight.category)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{insight.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(insight.status)}`}>
                        {insight.status.replace('_', ' ')}
                      </span>
                  </div>
                  <p className="text-gray-700 mb-4">{insight.description}</p>

                  {insight.recommendation && (
                    <div className="mb-4 p-4 bg-white bg-opacity-50 rounded">
                      <h4 className="text-sm font-semibold text-gray-800 mb-2">Recommended Action:</h4>
                      <p className="text-gray-700">{insight.recommendation}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium capitalize">{insight.category.replace('_', ' ')}</span>
                      {' • '}
                      Generated {new Date(insight.created_at).toLocaleDateString()}
                    </div>
                    {insight.status !== 'resolved' && (
                      <div className="flex gap-2">
                        {insight.status === 'pending' && (
                          <button
                            onClick={() => handleUpdateStatus(insight.id, 'acknowledged')}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                          >
                            Acknowledge
                          </button>
                        )}
                        {(insight.status === 'acknowledged' || insight.status === 'pending') && (
                          <button
                            onClick={() => handleUpdateStatus(insight.id, 'in_progress')}
                            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm"
                          >
                            Start Working
                          </button>
                        )}
                        {insight.status === 'in_progress' && (
                          <button
                            onClick={() => handleUpdateStatus(insight.id, 'resolved')}
                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                          >
                            Mark Resolved
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
