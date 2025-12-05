import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';

export default function PatternAnalysis() {
  const [patterns, setPatterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPatterns();
  }, []);

  const fetchPatterns = async () => {
    try {
      setLoading(true);
      const data = await api.getPatterns();
      setPatterns(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      'low': 'bg-green-100 text-green-800 border-green-200',
      'medium': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'high': 'bg-orange-100 text-orange-800 border-orange-200',
      'critical': 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[severity] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusColor = (status) => {
    const colors = {
      'detected': 'bg-blue-100 text-blue-700',
      'monitoring': 'bg-purple-100 text-purple-700',
      'resolved': 'bg-green-100 text-green-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Pattern Analysis</h1>
        <p className="text-gray-600">AI-powered detection of patterns and trends in complaints</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid gap-6">
        {patterns.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="mt-2 text-gray-600">No patterns detected yet</p>
          </div>
        ) : (
          patterns.map((pattern) => (
            <div key={pattern.id} className={`border-2 rounded-lg p-6 ${getSeverityColor(pattern.severity)}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{pattern.pattern_type}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(pattern.status)}`}>
                      {pattern.status}
                    </span>
                  </div>
                  <p className="text-gray-700 mb-3">{pattern.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">{pattern.frequency}</div>
                  <div className="text-sm text-gray-600">occurrences</div>
                </div>
              </div>

              {pattern.related_cases && pattern.related_cases.length > 0 && (
                <div className="mb-4 p-3 bg-white bg-opacity-50 rounded">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Related Cases:</h4>
                  <div className="flex flex-wrap gap-2">
                    {pattern.related_cases.map((caseCode, idx) => (
                      <span key={idx} className="px-2 py-1 bg-white text-gray-700 text-sm rounded border border-gray-200">
                        {caseCode}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {pattern.metadata && (
                <div className="text-sm text-gray-600">
                  <p>First detected: {new Date(pattern.detected_at).toLocaleDateString()}</p>
                  {pattern.metadata.department && (
                    <p className="mt-1">Department: {pattern.metadata.department}</p>
                  )}
                  {pattern.metadata.time_period && (
                    <p className="mt-1">Time period: {pattern.metadata.time_period}</p>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
