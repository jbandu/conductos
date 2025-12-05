import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import AdminLayout from '../../components/admin/AdminLayout';

export default function MonitoringDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchDashboard = async () => {
    try {
      const data = await api.getMonitoringDashboard();
      setDashboardData(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">System Monitoring</h1>
            <p className="text-gray-600">Real-time API performance and AI usage metrics</p>
          </div>
          <button
            onClick={fetchDashboard}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {loading && (
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {!loading && dashboardData && (
          <>
            {/* API Health Metrics */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">API Health</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="text-sm text-gray-600 mb-1">Total Requests</div>
                  <div className="text-3xl font-bold text-gray-900">
                    {dashboardData.apiHealth?.totalRequests || 0}
                  </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="text-sm text-gray-600 mb-1">Error Rate</div>
                  <div className="text-3xl font-bold text-red-600">
                    {dashboardData.apiHealth?.errorRate?.toFixed(2) || 0}%
                  </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="text-sm text-gray-600 mb-1">Avg Response Time</div>
                  <div className="text-3xl font-bold text-blue-600">
                    {dashboardData.apiHealth?.avgResponseTime?.toFixed(0) || 0}ms
                  </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="text-sm text-gray-600 mb-1">P95 Latency</div>
                  <div className="text-3xl font-bold text-purple-600">
                    {dashboardData.apiHealth?.p95Latency?.toFixed(0) || 0}ms
                  </div>
                </div>
              </div>
            </div>

            {/* AI Usage Metrics */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">AI Usage</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="text-sm text-gray-600 mb-1">Total Calls</div>
                  <div className="text-3xl font-bold text-gray-900">
                    {dashboardData.aiUsage?.totalCalls || 0}
                  </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="text-sm text-gray-600 mb-1">Input Tokens</div>
                  <div className="text-3xl font-bold text-green-600">
                    {(dashboardData.aiUsage?.totalInputTokens || 0).toLocaleString()}
                  </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="text-sm text-gray-600 mb-1">Output Tokens</div>
                  <div className="text-3xl font-bold text-blue-600">
                    {(dashboardData.aiUsage?.totalOutputTokens || 0).toLocaleString()}
                  </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="text-sm text-gray-600 mb-1">Estimated Cost</div>
                  <div className="text-3xl font-bold text-orange-600">
                    ${dashboardData.aiUsage?.estimatedCost?.toFixed(2) || '0.00'}
                  </div>
                </div>
              </div>
            </div>

            {/* Active Alerts */}
            {dashboardData.alerts && dashboardData.alerts.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Alerts</h2>
                <div className="space-y-3">
                  {dashboardData.alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`border-l-4 p-4 rounded ${
                        alert.severity === 'critical'
                          ? 'bg-red-50 border-red-500'
                          : alert.severity === 'warning'
                          ? 'bg-yellow-50 border-yellow-500'
                          : 'bg-blue-50 border-blue-500'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">{alert.alert_type}</h3>
                          <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(alert.created_at).toLocaleString()}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            alert.severity === 'critical'
                              ? 'bg-red-100 text-red-800'
                              : alert.severity === 'warning'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {alert.severity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* System Components */}
            {dashboardData.components && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">System Components</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {dashboardData.components.map((component) => (
                    <div key={component.name} className="bg-white border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">{component.name}</h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            component.status === 'healthy'
                              ? 'bg-green-100 text-green-800'
                              : component.status === 'degraded'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {component.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{component.description}</p>
                      <div className="mt-4 text-sm text-gray-500 space-y-1">
                        <p>Latency: {component.metrics.latency}ms</p>
                        <p>Uptime: {component.metrics.uptime}%</p>
                        <p>Error Rate: {component.metrics.errorRate}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
