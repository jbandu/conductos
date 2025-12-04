const API_BASE_URL = '/api';

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
  }
};
