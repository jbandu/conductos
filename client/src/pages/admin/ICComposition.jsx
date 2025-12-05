import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';

export default function ICComposition() {
  const [members, setMembers] = useState([]);
  const [eligibleUsers, setEligibleUsers] = useState([]);
  const [compliance, setCompliance] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    user_id: '',
    role: 'internal_member',
    appointed_date: new Date().toISOString().split('T')[0],
    term_end_date: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    await Promise.all([
      fetchMembers(),
      fetchEligibleUsers(),
      fetchCompliance()
    ]);
  };

  const fetchMembers = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/ic-composition', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch IC members');

      const data = await response.json();
      setMembers(data.members);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEligibleUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/ic-composition/eligible-users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch eligible users');

      const data = await response.json();
      setEligibleUsers(data.users.filter(u => !u.is_ic_member));
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchCompliance = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/ic-composition/compliance-check', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch compliance');

      const data = await response.json();
      setCompliance(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/ic-composition', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add IC member');
      }

      await fetchData();
      setShowAddModal(false);
      setFormData({
        user_id: '',
        role: 'internal_member',
        appointed_date: new Date().toISOString().split('T')[0],
        term_end_date: ''
      });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEditMember = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/ic-composition/${selectedMember.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          role: formData.role,
          appointed_date: formData.appointed_date,
          term_end_date: formData.term_end_date || null
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update IC member');
      }

      await fetchData();
      setShowEditModal(false);
      setSelectedMember(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeactivate = async (memberId) => {
    if (!confirm('Are you sure you want to deactivate this IC member?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/ic-composition/${memberId}/deactivate`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to deactivate IC member');

      await fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const openEditModal = (member) => {
    setSelectedMember(member);
    setFormData({
      role: member.role,
      appointed_date: member.appointed_date,
      term_end_date: member.term_end_date || ''
    });
    setShowEditModal(true);
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'presiding_officer': return 'bg-purple-100 text-purple-700';
      case 'internal_member': return 'bg-blue-100 text-blue-700';
      case 'external_member': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'presiding_officer': return 'Presiding Officer';
      case 'internal_member': return 'Internal Member';
      case 'external_member': return 'External Member';
      default: return role;
    }
  };

  const activeMembers = members.filter(m => m.is_active);
  const inactiveMembers = members.filter(m => !m.is_active);

  return (
    <AdminLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">IC Composition</h1>
          <p className="text-gray-600 mt-2">Manage Internal Committee composition and ensure PoSH Act compliance</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
            <button onClick={() => setError('')} className="float-right font-bold">×</button>
          </div>
        )}

        {/* Compliance Status */}
        {compliance && (
          <div className={`mb-6 rounded-xl border-2 p-6 ${
            compliance.compliant
              ? 'bg-green-50 border-green-200'
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  {compliance.compliant ? (
                    <>
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h2 className="text-xl font-bold text-green-900">PoSH Act Compliant</h2>
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <h2 className="text-xl font-bold text-yellow-900">Compliance Issues Detected</h2>
                    </>
                  )}
                </div>

                {/* Current Composition */}
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="text-sm text-gray-500">Presiding Officer</div>
                    <div className="text-2xl font-bold text-gray-900">{compliance.composition.presiding_officer}</div>
                    <div className="text-xs text-gray-500">Required: 1</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="text-sm text-gray-500">Internal Members</div>
                    <div className="text-2xl font-bold text-gray-900">{compliance.composition.internal_members}</div>
                    <div className="text-xs text-gray-500">Required: ≥2</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="text-sm text-gray-500">External Members</div>
                    <div className="text-2xl font-bold text-gray-900">{compliance.composition.external_members}</div>
                    <div className="text-xs text-gray-500">Required: 1</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="text-sm text-gray-500">Total Active</div>
                    <div className="text-2xl font-bold text-gray-900">{compliance.composition.total}</div>
                    <div className="text-xs text-gray-500">Minimum: 4</div>
                  </div>
                </div>

                {/* Issues */}
                {compliance.issues.length > 0 && (
                  <div className="space-y-1">
                    {compliance.issues.map((issue, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm text-yellow-800">
                        <span className="font-bold">•</span>
                        <span>{issue}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Warnings */}
                {compliance.warnings.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {compliance.warnings.map((warning, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm text-yellow-700">
                        <span className="font-bold">⚠</span>
                        <span>{warning}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  setFormData({
                    user_id: '',
                    role: 'internal_member',
                    appointed_date: new Date().toISOString().split('T')[0],
                    term_end_date: ''
                  });
                  setShowAddModal(true);
                }}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add IC Member
              </button>
            </div>
          </div>
        )}

        {/* Active Members */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Active IC Members</h2>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-gray-500">Loading members...</div>
          ) : activeMembers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No active IC members</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Member
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Appointed Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Term End Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {activeMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">{member.full_name}</span>
                          <span className="text-sm text-gray-500">{member.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(member.role)}`}>
                          {getRoleLabel(member.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(member.appointed_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {member.term_end_date
                          ? new Date(member.term_end_date).toLocaleDateString()
                          : 'No term limit'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(member)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Edit member"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeactivate(member.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Deactivate member"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Inactive Members */}
        {inactiveMembers.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Inactive IC Members</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Member
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Term
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {inactiveMembers.map((member) => (
                    <tr key={member.id} className="opacity-60">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">{member.full_name}</span>
                          <span className="text-sm text-gray-500">{member.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(member.role)}`}>
                          {getRoleLabel(member.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(member.appointed_date).toLocaleDateString()} -
                        {member.term_end_date
                          ? ` ${new Date(member.term_end_date).toLocaleDateString()}`
                          : ' No term limit'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Add IC Member</h2>

            <form onSubmit={handleAddMember}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select User
                  </label>
                  <select
                    required
                    value={formData.user_id}
                    onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="">Choose a user...</option>
                    {eligibleUsers.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.full_name} ({user.email})
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Only users with IC Member role are shown
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    IC Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="presiding_officer">Presiding Officer</option>
                    <option value="internal_member">Internal Member</option>
                    <option value="external_member">External Member</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Appointed Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.appointed_date}
                    onChange={(e) => setFormData({ ...formData, appointed_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Term End Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.term_end_date}
                    onChange={(e) => setFormData({ ...formData, term_end_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Leave blank for no term limit
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {showEditModal && selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Edit IC Member</h2>

            <form onSubmit={handleEditMember}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Member
                  </label>
                  <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="text-sm font-medium text-gray-900">{selectedMember.full_name}</div>
                    <div className="text-sm text-gray-500">{selectedMember.email}</div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    IC Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="presiding_officer">Presiding Officer</option>
                    <option value="internal_member">Internal Member</option>
                    <option value="external_member">External Member</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Appointed Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.appointed_date}
                    onChange={(e) => setFormData({ ...formData, appointed_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Term End Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.term_end_date}
                    onChange={(e) => setFormData({ ...formData, term_end_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedMember(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
