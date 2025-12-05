const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const api = {
  async getCases() {
    const response = await fetch(`${API_BASE_URL}/cases`);
    if (!response.ok) throw new Error('Failed to fetch cases');
    return response.json();
  },

  async getCase(id) {
    const response = await fetch(`${API_BASE_URL}/cases/${id}`);
    if (!response.ok) throw new Error('Failed to fetch case');
    return response.json();
  },

  async createCase(caseData) {
    const response = await fetch(`${API_BASE_URL}/cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(caseData)
    });
    if (!response.ok) throw new Error('Failed to create case');
    return response.json();
  },

  async updateCase(id, updates) {
    const response = await fetch(`${API_BASE_URL}/cases/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!response.ok) throw new Error('Failed to update case');
    return response.json();
  },

  async getCaseHistory(id) {
    const response = await fetch(`${API_BASE_URL}/cases/${id}/history`);
    if (!response.ok) throw new Error('Failed to fetch case history');
    return response.json();
  },

  async getDashboardStats() {
    const response = await fetch(`${API_BASE_URL}/dashboard/stats`);
    if (!response.ok) throw new Error('Failed to fetch dashboard stats');
    return response.json();
  },

  // Knowledge Base
  async getDocuments() {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/documents`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch documents');
    return response.json();
  },

  async searchDocuments(query) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/documents/search?q=${encodeURIComponent(query)}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to search documents');
    return response.json();
  },

  // Pattern Analysis
  async getPatterns() {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/patterns`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch patterns');
    return response.json();
  },

  // Proactive Insights
  async getInsights() {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/insights`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch insights');
    return response.json();
  },

  async updateInsight(id, updates) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/insights/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updates)
    });
    if (!response.ok) throw new Error('Failed to update insight');
    return response.json();
  },

  // External Members
  async getExternalMembers() {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/external/members`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch external members');
    return response.json();
  },

  // Monitoring Dashboard
  async getMonitoringDashboard() {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/monitoring/dashboard`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch monitoring dashboard');
    return response.json();
  },

  async getMonitoringAnalytics() {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/monitoring/analytics`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch monitoring analytics');
    return response.json();
  }
};
