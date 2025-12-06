const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Helper for authenticated requests
const authHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const api = {
  async getCases() {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/cases`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch cases');
    return response.json();
  },

  async getCase(id) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/cases/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch case');
    return response.json();
  },

  async createCase(caseData) {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    // Add auth header if token exists (authenticated case creation)
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(`${API_BASE_URL}/cases`, {
      method: 'POST',
      headers,
      body: JSON.stringify(caseData)
    });
    if (!response.ok) throw new Error('Failed to create case');
    return response.json();
  },

  async updateCase(id, updates) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/cases/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updates)
    });
    if (!response.ok) throw new Error('Failed to update case');
    return response.json();
  },

  async getCaseHistory(id) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/cases/${id}/history`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch case history');
    return response.json();
  },

  async getDashboardStats() {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/dashboard/stats`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
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
  },

  // =============================================
  // EMPLOYEE PORTAL
  // =============================================

  // Dashboard
  async getEmployeeDashboard() {
    const response = await fetch(`${API_BASE_URL}/employee/dashboard`, {
      headers: authHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch dashboard');
    return response.json();
  },

  // Complaints
  async submitComplaint(complaintData) {
    const response = await fetch(`${API_BASE_URL}/employee/complaints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(complaintData)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to submit complaint');
    }
    return response.json();
  },

  async submitAnonymousComplaint(complaintData) {
    const response = await fetch(`${API_BASE_URL}/employee/complaints/anonymous`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(complaintData)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to submit anonymous complaint');
    }
    return response.json();
  },

  async lookupAnonymousCase(anonymousCode, passphrase) {
    const response = await fetch(`${API_BASE_URL}/employee/complaints/anonymous/lookup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ anonymousCode, passphrase })
    });
    if (!response.ok) throw new Error('Invalid code or passphrase');
    return response.json();
  },

  // Drafts
  async saveDraft(draftData) {
    const response = await fetch(`${API_BASE_URL}/employee/complaints/drafts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(draftData)
    });
    if (!response.ok) throw new Error('Failed to save draft');
    return response.json();
  },

  async getDrafts() {
    const response = await fetch(`${API_BASE_URL}/employee/complaints/drafts`, {
      headers: authHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch drafts');
    return response.json();
  },

  async deleteDraft(draftId) {
    const response = await fetch(`${API_BASE_URL}/employee/complaints/drafts/${draftId}`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    if (!response.ok) throw new Error('Failed to delete draft');
    return response.json();
  },

  // Employee Cases
  async getEmployeeCases() {
    const response = await fetch(`${API_BASE_URL}/employee/cases`, {
      headers: authHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch cases');
    return response.json();
  },

  async getEmployeeCaseDetail(caseId) {
    const response = await fetch(`${API_BASE_URL}/employee/cases/${caseId}`, {
      headers: authHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch case details');
    return response.json();
  },

  async getCaseTimeline(caseId) {
    const response = await fetch(`${API_BASE_URL}/employee/cases/${caseId}/timeline`, {
      headers: authHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch timeline');
    return response.json();
  },

  // Evidence
  async uploadEvidence(caseId, files, descriptions = []) {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    formData.append('descriptions', JSON.stringify(descriptions));

    const response = await fetch(`${API_BASE_URL}/employee/cases/${caseId}/evidence`, {
      method: 'POST',
      headers: authHeaders(),
      body: formData
    });
    if (!response.ok) throw new Error('Failed to upload evidence');
    return response.json();
  },

  async getCaseEvidence(caseId) {
    const response = await fetch(`${API_BASE_URL}/employee/cases/${caseId}/evidence`, {
      headers: authHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch evidence');
    return response.json();
  },

  // Messaging
  async getCaseMessages(caseId) {
    const response = await fetch(`${API_BASE_URL}/employee/cases/${caseId}/messages`, {
      headers: authHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch messages');
    return response.json();
  },

  async sendCaseMessage(caseId, content, attachments = []) {
    const response = await fetch(`${API_BASE_URL}/employee/cases/${caseId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ content, attachments })
    });
    if (!response.ok) throw new Error('Failed to send message');
    return response.json();
  },

  async markMessagesRead(caseId) {
    const response = await fetch(`${API_BASE_URL}/employee/cases/${caseId}/messages/read`, {
      method: 'PATCH',
      headers: authHeaders()
    });
    if (!response.ok) throw new Error('Failed to mark messages as read');
    return response.json();
  },

  // Resources
  async getEmployeeResources() {
    const response = await fetch(`${API_BASE_URL}/employee/resources`);
    if (!response.ok) throw new Error('Failed to fetch resources');
    return response.json();
  }
};
