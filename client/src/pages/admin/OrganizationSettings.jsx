import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';

export default function OrganizationSettings() {
  const [organization, setOrganization] = useState(null);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    industry: '',
    employee_count: '',
    address: '',
    city: '',
    state: '',
    district_officer_email: ''
  });

  useEffect(() => {
    fetchOrganization();
    fetchStats();
  }, []);

  const fetchOrganization = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/organization', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch organization');

      const data = await response.json();
      setOrganization(data);
      setFormData({
        name: data.name || '',
        domain: data.domain || '',
        industry: data.industry || '',
        employee_count: data.employee_count || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        district_officer_email: data.district_officer_email || ''
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/organization/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch stats');

      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleUpdateOrganization = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');

      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/organization', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update organization');
      }

      const updatedOrg = await response.json();
      setOrganization(updatedOrg);
      setIsEditing(false);
      setSuccess('Organization updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Organization Settings</h1>
          <p className="text-gray-600 mt-2">Manage your organization details and configuration</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {success}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-sm font-medium text-gray-600 mb-1">Total Users</div>
              <div className="text-3xl font-bold text-indigo-600">
                {stats.users.reduce((sum, u) => sum + parseInt(u.count), 0)}
              </div>
              <div className="text-sm text-gray-500 mt-2">
                {stats.users.reduce((sum, u) => sum + parseInt(u.active_count), 0)} active
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-sm font-medium text-gray-600 mb-1">Total Cases</div>
              <div className="text-3xl font-bold text-blue-600">
                {stats.cases.total_cases}
              </div>
              <div className="text-sm text-gray-500 mt-2">
                {stats.cases.new_cases} new, {stats.cases.investigating_cases} investigating
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-sm font-medium text-gray-600 mb-1">IC Members</div>
              <div className="text-3xl font-bold text-green-600">
                {stats.ic_composition.active_members}
              </div>
              <div className="text-sm text-gray-500 mt-2">
                {stats.ic_composition.presiding_officers} PO, {stats.ic_composition.internal_members} internal, {stats.ic_composition.external_members} external
              </div>
            </div>
          </div>
        )}

        {/* Organization Details */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Organization Details</h2>
          </div>

          <div className="p-6">
            {isEditing ? (
              <form onSubmit={handleUpdateOrganization}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Organization Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Domain
                    </label>
                    <input
                      type="text"
                      name="domain"
                      value={formData.domain}
                      onChange={handleChange}
                      placeholder="example.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Industry
                    </label>
                    <input
                      type="text"
                      name="industry"
                      value={formData.industry}
                      onChange={handleChange}
                      placeholder="Technology, Finance, Healthcare..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Employee Count
                    </label>
                    <input
                      type="number"
                      name="employee_count"
                      value={formData.employee_count}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      rows="2"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      District Officer Email
                    </label>
                    <input
                      type="email"
                      name="district_officer_email"
                      value={formData.district_officer_email}
                      onChange={handleChange}
                      placeholder="district.officer@example.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Contact email for the District Officer as per PoSH Act requirements
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        name: organization.name || '',
                        domain: organization.domain || '',
                        industry: organization.industry || '',
                        employee_count: organization.employee_count || '',
                        address: organization.address || '',
                        city: organization.city || '',
                        state: organization.state || '',
                        district_officer_email: organization.district_officer_email || ''
                      });
                      setError('');
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Organization Name
                    </label>
                    <p className="text-lg text-gray-900">{organization?.name || 'Not set'}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Domain
                    </label>
                    <p className="text-lg text-gray-900">{organization?.domain || 'Not set'}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Industry
                    </label>
                    <p className="text-lg text-gray-900">{organization?.industry || 'Not set'}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Employee Count
                    </label>
                    <p className="text-lg text-gray-900">{organization?.employee_count || 'Not set'}</p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Address
                    </label>
                    <p className="text-lg text-gray-900">{organization?.address || 'Not set'}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      City
                    </label>
                    <p className="text-lg text-gray-900">{organization?.city || 'Not set'}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      State
                    </label>
                    <p className="text-lg text-gray-900">{organization?.state || 'Not set'}</p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      District Officer Email
                    </label>
                    <p className="text-lg text-gray-900">
                      {organization?.district_officer_email || 'Not set'}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Required as per PoSH Act for reporting compliance
                    </p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Created At
                    </label>
                    <p className="text-lg text-gray-900">
                      {organization?.created_at
                        ? new Date(organization.created_at).toLocaleDateString()
                        : 'Not set'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsEditing(true)}
                  className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Edit Organization Details
                </button>
              </div>
            )}
          </div>
        </div>

        {/* User Role Breakdown */}
        {stats && stats.users.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">User Role Breakdown</h2>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                {stats.users.map((roleData) => (
                  <div key={roleData.role} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900 capitalize">
                        {roleData.role.replace('_', ' ')}
                      </div>
                      <div className="text-sm text-gray-500">
                        {roleData.active_count} active out of {roleData.count} total
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-indigo-600">
                      {roleData.count}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
