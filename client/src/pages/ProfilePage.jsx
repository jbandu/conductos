import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Icons as components
const Icons = {
  Back: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  ),
  Check: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  User: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  Bell: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  ),
  Shield: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  Lock: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  ),
  Eye: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  Accessibility: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  Briefcase: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  Settings: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Google: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  ),
};

// Reusable Toggle Component
const Toggle = ({ enabled, onChange, label, description }) => (
  <div className="flex items-center justify-between py-3">
    <div className="flex-1">
      <label className="text-sm font-medium text-warm-900">{label}</label>
      {description && <p className="text-sm text-warm-500 mt-0.5">{description}</p>}
    </div>
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
        enabled ? 'bg-primary-600' : 'bg-warm-200'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          enabled ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  </div>
);

// Select Component
const Select = ({ value, onChange, options, label }) => (
  <div className="py-3">
    <label className="block text-sm font-medium text-warm-900 mb-2">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 border border-warm-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-warm-900"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);

// Section Header Component
const SectionHeader = ({ icon: Icon, title, description }) => (
  <div className="px-6 py-4 border-b border-warm-200 bg-warm-50">
    <div className="flex items-center gap-3">
      <div className="p-2 bg-primary-100 rounded-lg">
        <Icon />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-warm-900">{title}</h2>
        {description && <p className="text-sm text-warm-500">{description}</p>}
      </div>
    </div>
  </div>
);

// Password Strength Indicator
const PasswordStrength = ({ strength }) => {
  const strengthColors = {
    weak: 'bg-red-500',
    fair: 'bg-yellow-500',
    good: 'bg-blue-500',
    strong: 'bg-green-500',
  };

  const strengthWidths = {
    weak: 'w-1/4',
    fair: 'w-2/4',
    good: 'w-3/4',
    strong: 'w-full',
  };

  return (
    <div className="mt-2">
      <div className="h-2 bg-warm-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${strengthColors[strength] || 'bg-warm-300'} ${strengthWidths[strength] || 'w-0'}`}
        />
      </div>
      <p className={`text-xs mt-1 capitalize ${strength === 'strong' ? 'text-green-600' : strength === 'good' ? 'text-blue-600' : strength === 'fair' ? 'text-yellow-600' : 'text-red-600'}`}>
        {strength ? `Password strength: ${strength}` : ''}
      </p>
    </div>
  );
};

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // State management
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState(null);
  const [settings, setSettings] = useState(null);
  const [securityStatus, setSecurityStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Edit states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [fullName, setFullName] = useState('');

  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [passwordStrength, setPasswordStrength] = useState(null);

  // Settings state
  const [localSettings, setLocalSettings] = useState({});

  // Fetch all data on mount
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchProfile(),
        fetchSettings(),
        fetchSecurityStatus(),
      ]);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch profile');
      const data = await response.json();
      setProfile(data);
      setFullName(data.full_name);
    } catch (err) {
      console.error('Profile fetch error:', err);
    }
  };

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/settings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch settings');
      const data = await response.json();
      setSettings(data);
      setLocalSettings(data);
    } catch (err) {
      console.error('Settings fetch error:', err);
    }
  };

  const fetchSecurityStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/security/status', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch security status');
      const data = await response.json();
      setSecurityStatus(data);
    } catch (err) {
      console.error('Security status fetch error:', err);
    }
  };

  // Profile update handler
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ full_name: fullName }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update profile');
      }

      await fetchProfile();
      setIsEditingProfile(false);
      showSuccessMessage('Profile updated successfully!');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Password change handler
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    if (passwordData.new_password !== passwordData.confirm_password) {
      setError('New passwords do not match');
      setIsSaving(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/profile/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(passwordData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to change password');
      }

      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
      setShowPasswordForm(false);
      setPasswordStrength(null);
      showSuccessMessage('Password changed successfully!');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Check password strength
  const checkPasswordStrength = useCallback(async (password) => {
    if (!password) {
      setPasswordStrength(null);
      return;
    }

    try {
      const response = await fetch('/api/auth/password-strength', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await response.json();
      setPasswordStrength(data);
    } catch (err) {
      console.error('Password strength check error:', err);
    }
  }, []);

  // Settings update handler
  const updateSettings = async (section, data) => {
    setIsSaving(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/settings/${section}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update settings');
      }

      await fetchSettings();
      showSuccessMessage('Settings updated successfully!');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Send verification email
  const sendVerificationEmail = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send verification email');
      }

      showSuccessMessage('Verification email sent! Please check your inbox.');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Helper functions
  const showSuccessMessage = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(''), 3000);
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'hr_admin': return 'bg-indigo-100 text-indigo-700';
      case 'ic_member': return 'bg-purple-100 text-purple-700';
      case 'employee': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'hr_admin': return 'HR Admin';
      case 'ic_member': return 'IC Member';
      case 'employee': return 'Employee';
      default: return role;
    }
  };

  // Tab configuration based on user role
  const tabs = [
    { id: 'profile', label: 'Profile', icon: Icons.User },
    { id: 'notifications', label: 'Notifications', icon: Icons.Bell },
    { id: 'security', label: 'Security', icon: Icons.Shield },
    { id: 'privacy', label: 'Privacy', icon: Icons.Eye },
    { id: 'accessibility', label: 'Accessibility', icon: Icons.Accessibility },
    ...(user?.role === 'employee'
      ? [{ id: 'employee', label: 'Reporting', icon: Icons.Briefcase }]
      : []),
    ...(user?.role === 'ic_member' || user?.role === 'hr_admin'
      ? [{ id: 'productivity', label: 'Productivity', icon: Icons.Settings }]
      : []),
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gentle flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gentle">
      {/* Header */}
      <header className="bg-white border-b border-warm-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-warm-700 hover:text-warm-900"
            >
              <Icons.Back />
              <span className="ml-2">Back</span>
            </button>
            <h1 className="text-xl font-semibold text-warm-900">Settings</h1>
            <div className="w-20"></div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
            <Icons.Check />
            <span className="ml-2">{success}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
            <button onClick={() => setError('')} className="float-right font-bold">×</button>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation */}
          <nav className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl border border-warm-200 overflow-hidden">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-600'
                      : 'text-warm-600 hover:bg-warm-50'
                  }`}
                >
                  <tab.icon />
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Security Score Card */}
            {securityStatus && (
              <div className="mt-4 bg-white rounded-xl border border-warm-200 p-4">
                <h3 className="text-sm font-semibold text-warm-900 mb-2">Security Score</h3>
                <div className="flex items-center gap-3">
                  <div className="relative w-16 h-16">
                    <svg className="w-16 h-16 transform -rotate-90">
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="#E5E7EB"
                        strokeWidth="8"
                        fill="none"
                      />
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke={securityStatus.securityScore >= 80 ? '#10B981' : securityStatus.securityScore >= 50 ? '#F59E0B' : '#EF4444'}
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${(securityStatus.securityScore / 100) * 176} 176`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-lg font-bold">
                      {securityStatus.securityScore}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-warm-600">
                      {securityStatus.securityScore >= 80 ? 'Excellent!' : securityStatus.securityScore >= 50 ? 'Good, but can improve' : 'Needs attention'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </nav>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-xl shadow-sm border border-warm-200 overflow-hidden">
                <SectionHeader
                  icon={Icons.User}
                  title="Profile Information"
                  description="Manage your personal information"
                />
                <div className="p-6">
                  {isEditingProfile ? (
                    <form onSubmit={handleUpdateProfile}>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-warm-700 mb-1">Full Name</label>
                          <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full px-4 py-2 border border-warm-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            required
                          />
                        </div>
                      </div>
                      <div className="flex gap-3 mt-6">
                        <button
                          type="button"
                          onClick={() => { setIsEditingProfile(false); setFullName(profile.full_name); }}
                          className="flex-1 px-4 py-2 border border-warm-300 text-warm-700 rounded-lg hover:bg-warm-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSaving}
                          className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                        >
                          {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-warm-600 mb-1">Full Name</label>
                        <p className="text-lg text-warm-900">{profile?.full_name}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-warm-600 mb-1">Email</label>
                        <div className="flex items-center gap-2">
                          <p className="text-lg text-warm-900">{profile?.email}</p>
                          {settings?.profile?.emailVerified ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              Verified
                            </span>
                          ) : (
                            <button
                              onClick={sendVerificationEmail}
                              disabled={isSaving}
                              className="text-sm text-primary-600 hover:text-primary-700"
                            >
                              Verify email
                            </button>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-warm-600 mb-1">Role</label>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getRoleBadgeColor(profile?.role)}`}>
                            {getRoleLabel(profile?.role)}
                          </span>
                          {profile?.is_super_admin && (
                            <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-yellow-100 text-yellow-700">
                              Super Admin
                            </span>
                          )}
                        </div>
                      </div>
                      {profile?.organization_name && (
                        <div>
                          <label className="block text-sm font-medium text-warm-600 mb-1">Organization</label>
                          <p className="text-lg text-warm-900">{profile.organization_name}</p>
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-warm-600 mb-1">Member Since</label>
                        <p className="text-lg text-warm-900">
                          {new Date(profile?.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => setIsEditingProfile(true)}
                        className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                      >
                        Edit Profile
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && settings && (
              <div className="bg-white rounded-xl shadow-sm border border-warm-200 overflow-hidden">
                <SectionHeader
                  icon={Icons.Bell}
                  title="Notification Preferences"
                  description="Control how and when you receive notifications"
                />
                <div className="p-6 divide-y divide-warm-100">
                  <Toggle
                    label="Email Notifications"
                    description="Receive important updates via email"
                    enabled={localSettings.notifications?.emailNotifications}
                    onChange={(v) => {
                      setLocalSettings(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, emailNotifications: v }
                      }));
                      updateSettings('notifications', { emailNotifications: v });
                    }}
                  />
                  <Toggle
                    label="Push Notifications"
                    description="Receive browser push notifications"
                    enabled={localSettings.notifications?.pushNotifications}
                    onChange={(v) => {
                      setLocalSettings(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, pushNotifications: v }
                      }));
                      updateSettings('notifications', { pushNotifications: v });
                    }}
                  />
                  <Select
                    label="Notification Frequency"
                    value={localSettings.notifications?.notificationDigest || 'instant'}
                    onChange={(v) => {
                      setLocalSettings(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, notificationDigest: v }
                      }));
                      updateSettings('notifications', { notificationDigest: v });
                    }}
                    options={[
                      { value: 'instant', label: 'Instant' },
                      { value: 'daily', label: 'Daily Digest' },
                      { value: 'weekly', label: 'Weekly Digest' },
                      { value: 'never', label: 'Never' },
                    ]}
                  />
                  <Toggle
                    label="Quiet Hours"
                    description="Pause notifications during specified hours"
                    enabled={localSettings.notifications?.quietHoursEnabled}
                    onChange={(v) => {
                      setLocalSettings(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, quietHoursEnabled: v }
                      }));
                      updateSettings('notifications', { quietHoursEnabled: v });
                    }}
                  />
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                {/* Password Section */}
                <div className="bg-white rounded-xl shadow-sm border border-warm-200 overflow-hidden">
                  <SectionHeader
                    icon={Icons.Lock}
                    title="Password"
                    description="Manage your password and sign-in security"
                  />
                  <div className="p-6">
                    {showPasswordForm ? (
                      <form onSubmit={handleChangePassword}>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-warm-700 mb-1">Current Password</label>
                            <input
                              type="password"
                              value={passwordData.current_password}
                              onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                              className="w-full px-4 py-2 border border-warm-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-warm-700 mb-1">New Password</label>
                            <input
                              type="password"
                              value={passwordData.new_password}
                              onChange={(e) => {
                                setPasswordData({ ...passwordData, new_password: e.target.value });
                                checkPasswordStrength(e.target.value);
                              }}
                              className="w-full px-4 py-2 border border-warm-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              required
                              minLength="8"
                            />
                            {passwordStrength && <PasswordStrength strength={passwordStrength.strength} />}
                            {passwordStrength && !passwordStrength.valid && (
                              <ul className="mt-2 text-xs text-warm-600 space-y-1">
                                {passwordStrength.suggestions?.map((s, i) => (
                                  <li key={i} className="flex items-center gap-1">
                                    <span className="text-red-500">•</span> {s}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-warm-700 mb-1">Confirm New Password</label>
                            <input
                              type="password"
                              value={passwordData.confirm_password}
                              onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                              className="w-full px-4 py-2 border border-warm-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              required
                            />
                          </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                          <button
                            type="button"
                            onClick={() => {
                              setShowPasswordForm(false);
                              setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
                              setPasswordStrength(null);
                            }}
                            className="flex-1 px-4 py-2 border border-warm-300 text-warm-700 rounded-lg hover:bg-warm-50"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isSaving || (passwordStrength && !passwordStrength.valid)}
                            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                          >
                            {isSaving ? 'Updating...' : 'Update Password'}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div>
                        <p className="text-sm text-warm-600 mb-4">
                          Last changed: {securityStatus?.lastPasswordChange
                            ? new Date(securityStatus.lastPasswordChange).toLocaleDateString()
                            : 'Never'}
                        </p>
                        <button
                          onClick={() => setShowPasswordForm(true)}
                          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                        >
                          Change Password
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Connected Accounts */}
                <div className="bg-white rounded-xl shadow-sm border border-warm-200 overflow-hidden">
                  <SectionHeader
                    icon={Icons.Shield}
                    title="Connected Accounts"
                    description="Link accounts for easier sign-in"
                  />
                  <div className="p-6">
                    <div className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <Icons.Google />
                        <div>
                          <p className="text-sm font-medium text-warm-900">Google</p>
                          <p className="text-sm text-warm-500">
                            {securityStatus?.googleConnected ? 'Connected' : 'Not connected'}
                          </p>
                        </div>
                      </div>
                      <button
                        className={`px-4 py-2 rounded-lg text-sm font-medium ${
                          securityStatus?.googleConnected
                            ? 'border border-warm-300 text-warm-700 hover:bg-warm-50'
                            : 'bg-primary-600 text-white hover:bg-primary-700'
                        }`}
                      >
                        {securityStatus?.googleConnected ? 'Disconnect' : 'Connect'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Security Recommendations */}
                {securityStatus?.recommendations?.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-yellow-800 mb-2">Security Recommendations</h3>
                    <ul className="space-y-2">
                      {securityStatus.recommendations.map((rec, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-yellow-700">
                          <span className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                            rec.priority === 'high' ? 'bg-red-500' : rec.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                          }`} />
                          {rec.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Privacy Tab */}
            {activeTab === 'privacy' && settings && (
              <div className="bg-white rounded-xl shadow-sm border border-warm-200 overflow-hidden">
                <SectionHeader
                  icon={Icons.Eye}
                  title="Privacy Settings"
                  description="Control your privacy and visibility"
                />
                <div className="p-6 divide-y divide-warm-100">
                  <Select
                    label="Profile Visibility"
                    value={localSettings.privacy?.profileVisibility || 'organization'}
                    onChange={(v) => {
                      setLocalSettings(prev => ({
                        ...prev,
                        privacy: { ...prev.privacy, profileVisibility: v }
                      }));
                      updateSettings('privacy', { profileVisibility: v });
                    }}
                    options={[
                      { value: 'private', label: 'Private - Only you' },
                      { value: 'organization', label: 'Organization - Your colleagues' },
                      { value: 'public', label: 'Public - Everyone' },
                    ]}
                  />
                  <Toggle
                    label="Show Online Status"
                    description="Let others see when you're online"
                    enabled={localSettings.privacy?.showOnlineStatus}
                    onChange={(v) => {
                      setLocalSettings(prev => ({
                        ...prev,
                        privacy: { ...prev.privacy, showOnlineStatus: v }
                      }));
                      updateSettings('privacy', { showOnlineStatus: v });
                    }}
                  />
                  <Toggle
                    label="Show Last Active"
                    description="Display when you were last active"
                    enabled={localSettings.privacy?.showLastActive}
                    onChange={(v) => {
                      setLocalSettings(prev => ({
                        ...prev,
                        privacy: { ...prev.privacy, showLastActive: v }
                      }));
                      updateSettings('privacy', { showLastActive: v });
                    }}
                  />
                </div>
              </div>
            )}

            {/* Accessibility Tab */}
            {activeTab === 'accessibility' && settings && (
              <div className="bg-white rounded-xl shadow-sm border border-warm-200 overflow-hidden">
                <SectionHeader
                  icon={Icons.Accessibility}
                  title="Accessibility"
                  description="Customize for your needs"
                />
                <div className="p-6 divide-y divide-warm-100">
                  <Select
                    label="Font Size"
                    value={localSettings.accessibility?.fontSize || 'medium'}
                    onChange={(v) => {
                      setLocalSettings(prev => ({
                        ...prev,
                        accessibility: { ...prev.accessibility, fontSize: v }
                      }));
                      updateSettings('accessibility', { fontSize: v });
                    }}
                    options={[
                      { value: 'small', label: 'Small' },
                      { value: 'medium', label: 'Medium (Default)' },
                      { value: 'large', label: 'Large' },
                      { value: 'x-large', label: 'Extra Large' },
                    ]}
                  />
                  <Toggle
                    label="High Contrast Mode"
                    description="Increase contrast for better visibility"
                    enabled={localSettings.accessibility?.highContrastMode}
                    onChange={(v) => {
                      setLocalSettings(prev => ({
                        ...prev,
                        accessibility: { ...prev.accessibility, highContrastMode: v }
                      }));
                      updateSettings('accessibility', { highContrastMode: v });
                    }}
                  />
                  <Toggle
                    label="Reduce Motion"
                    description="Minimize animations and transitions"
                    enabled={localSettings.accessibility?.reduceMotion}
                    onChange={(v) => {
                      setLocalSettings(prev => ({
                        ...prev,
                        accessibility: { ...prev.accessibility, reduceMotion: v }
                      }));
                      updateSettings('accessibility', { reduceMotion: v });
                    }}
                  />
                </div>
              </div>
            )}

            {/* Employee Reporting Tab */}
            {activeTab === 'employee' && settings?.employee && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-warm-200 overflow-hidden">
                  <SectionHeader
                    icon={Icons.Briefcase}
                    title="Reporting Preferences"
                    description="Customize your incident reporting experience"
                  />
                  <div className="p-6 divide-y divide-warm-100">
                    <Toggle
                      label="Default to Anonymous Reporting"
                      description="Start all new reports as anonymous by default"
                      enabled={localSettings.employee?.reporting?.defaultAnonymousReporting}
                      onChange={(v) => {
                        setLocalSettings(prev => ({
                          ...prev,
                          employee: {
                            ...prev.employee,
                            reporting: { ...prev.employee?.reporting, defaultAnonymousReporting: v }
                          }
                        }));
                        updateSettings('employee/reporting', { defaultAnonymousReporting: v });
                      }}
                    />
                    <Select
                      label="Preferred Contact Method"
                      value={localSettings.employee?.reporting?.preferredContactMethod || 'email'}
                      onChange={(v) => {
                        setLocalSettings(prev => ({
                          ...prev,
                          employee: {
                            ...prev.employee,
                            reporting: { ...prev.employee?.reporting, preferredContactMethod: v }
                          }
                        }));
                        updateSettings('employee/reporting', { preferredContactMethod: v });
                      }}
                      options={[
                        { value: 'email', label: 'Email' },
                        { value: 'in_app', label: 'In-App Messages' },
                        { value: 'phone', label: 'Phone' },
                      ]}
                    />
                    <Toggle
                      label="Save Draft Reports"
                      description="Auto-save incomplete reports as drafts"
                      enabled={localSettings.employee?.reporting?.saveDraftReports}
                      onChange={(v) => {
                        setLocalSettings(prev => ({
                          ...prev,
                          employee: {
                            ...prev.employee,
                            reporting: { ...prev.employee?.reporting, saveDraftReports: v }
                          }
                        }));
                        updateSettings('employee/reporting', { saveDraftReports: v });
                      }}
                    />
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-warm-200 overflow-hidden">
                  <SectionHeader
                    icon={Icons.Bell}
                    title="Communication Preferences"
                    description="Control case-related notifications"
                  />
                  <div className="p-6 divide-y divide-warm-100">
                    <Toggle
                      label="Receive Case Updates"
                      description="Get notified when your case status changes"
                      enabled={localSettings.employee?.communication?.receiveCaseUpdates}
                      onChange={(v) => {
                        setLocalSettings(prev => ({
                          ...prev,
                          employee: {
                            ...prev.employee,
                            communication: { ...prev.employee?.communication, receiveCaseUpdates: v }
                          }
                        }));
                        updateSettings('employee/communication', { receiveCaseUpdates: v });
                      }}
                    />
                    <Toggle
                      label="Deadline Reminders"
                      description="Receive reminders about upcoming case deadlines"
                      enabled={localSettings.employee?.communication?.receiveDeadlineReminders}
                      onChange={(v) => {
                        setLocalSettings(prev => ({
                          ...prev,
                          employee: {
                            ...prev.employee,
                            communication: { ...prev.employee?.communication, receiveDeadlineReminders: v }
                          }
                        }));
                        updateSettings('employee/communication', { receiveDeadlineReminders: v });
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* IC Member Productivity Tab */}
            {activeTab === 'productivity' && settings?.icMember && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-warm-200 overflow-hidden">
                  <SectionHeader
                    icon={Icons.Settings}
                    title="Case Management"
                    description="Customize your case handling workflow"
                  />
                  <div className="p-6 divide-y divide-warm-100">
                    <Select
                      label="Default Case View"
                      value={localSettings.icMember?.caseManagement?.defaultCaseView || 'list'}
                      onChange={(v) => {
                        setLocalSettings(prev => ({
                          ...prev,
                          icMember: {
                            ...prev.icMember,
                            caseManagement: { ...prev.icMember?.caseManagement, defaultCaseView: v }
                          }
                        }));
                        updateSettings('ic/case-management', { defaultCaseView: v });
                      }}
                      options={[
                        { value: 'list', label: 'List View' },
                        { value: 'kanban', label: 'Kanban Board' },
                        { value: 'calendar', label: 'Calendar View' },
                        { value: 'timeline', label: 'Timeline View' },
                      ]}
                    />
                    <Toggle
                      label="Show Priority Indicators"
                      description="Display visual indicators for high-priority cases"
                      enabled={localSettings.icMember?.caseManagement?.showCasePriorityIndicators}
                      onChange={(v) => {
                        setLocalSettings(prev => ({
                          ...prev,
                          icMember: {
                            ...prev.icMember,
                            caseManagement: { ...prev.icMember?.caseManagement, showCasePriorityIndicators: v }
                          }
                        }));
                        updateSettings('ic/case-management', { showCasePriorityIndicators: v });
                      }}
                    />
                    <Toggle
                      label="Auto-assign Cases"
                      description="Automatically accept cases assigned to you"
                      enabled={localSettings.icMember?.caseManagement?.autoAssignCases}
                      onChange={(v) => {
                        setLocalSettings(prev => ({
                          ...prev,
                          icMember: {
                            ...prev.icMember,
                            caseManagement: { ...prev.icMember?.caseManagement, autoAssignCases: v }
                          }
                        }));
                        updateSettings('ic/case-management', { autoAssignCases: v });
                      }}
                    />
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-warm-200 overflow-hidden">
                  <SectionHeader
                    icon={Icons.Briefcase}
                    title="Workflow Preferences"
                    description="Streamline your investigation process"
                  />
                  <div className="p-6 divide-y divide-warm-100">
                    <Toggle
                      label="Require Notes on Status Change"
                      description="Prompt for notes when updating case status"
                      enabled={localSettings.icMember?.workflow?.requireNotesOnStatusChange}
                      onChange={(v) => {
                        setLocalSettings(prev => ({
                          ...prev,
                          icMember: {
                            ...prev.icMember,
                            workflow: { ...prev.icMember?.workflow, requireNotesOnStatusChange: v }
                          }
                        }));
                        updateSettings('ic/workflow', { requireNotesOnStatusChange: v });
                      }}
                    />
                    <Toggle
                      label="Default Investigation Checklist"
                      description="Automatically add standard checklist to new cases"
                      enabled={localSettings.icMember?.workflow?.defaultInvestigationChecklist}
                      onChange={(v) => {
                        setLocalSettings(prev => ({
                          ...prev,
                          icMember: {
                            ...prev.icMember,
                            workflow: { ...prev.icMember?.workflow, defaultInvestigationChecklist: v }
                          }
                        }));
                        updateSettings('ic/workflow', { defaultInvestigationChecklist: v });
                      }}
                    />
                    <Toggle
                      label="Auto-advance Workflow"
                      description="Automatically move to next step when current step is completed"
                      enabled={localSettings.icMember?.workflow?.autoAdvanceWorkflow}
                      onChange={(v) => {
                        setLocalSettings(prev => ({
                          ...prev,
                          icMember: {
                            ...prev.icMember,
                            workflow: { ...prev.icMember?.workflow, autoAdvanceWorkflow: v }
                          }
                        }));
                        updateSettings('ic/workflow', { autoAdvanceWorkflow: v });
                      }}
                    />
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-warm-200 overflow-hidden">
                  <SectionHeader
                    icon={Icons.Bell}
                    title="Review Reminders"
                    description="Configure case review reminders"
                  />
                  <div className="p-6 divide-y divide-warm-100">
                    <Select
                      label="Reminder Frequency"
                      value={localSettings.icMember?.reminders?.reviewReminderFrequency || 'daily'}
                      onChange={(v) => {
                        setLocalSettings(prev => ({
                          ...prev,
                          icMember: {
                            ...prev.icMember,
                            reminders: { ...prev.icMember?.reminders, reviewReminderFrequency: v }
                          }
                        }));
                        updateSettings('ic/reminders', { reviewReminderFrequency: v });
                      }}
                      options={[
                        { value: 'none', label: 'No Reminders' },
                        { value: 'daily', label: 'Daily' },
                        { value: 'weekly', label: 'Weekly' },
                        { value: 'custom', label: 'Custom Days' },
                      ]}
                    />
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-warm-200 overflow-hidden">
                  <SectionHeader
                    icon={Icons.Settings}
                    title="Report Generation"
                    description="Configure default report settings"
                  />
                  <div className="p-6 divide-y divide-warm-100">
                    <Select
                      label="Default Report Format"
                      value={localSettings.icMember?.reporting?.defaultReportFormat || 'pdf'}
                      onChange={(v) => {
                        setLocalSettings(prev => ({
                          ...prev,
                          icMember: {
                            ...prev.icMember,
                            reporting: { ...prev.icMember?.reporting, defaultReportFormat: v }
                          }
                        }));
                        updateSettings('ic/reporting', { defaultReportFormat: v });
                      }}
                      options={[
                        { value: 'pdf', label: 'PDF Document' },
                        { value: 'docx', label: 'Word Document' },
                        { value: 'html', label: 'HTML (Web)' },
                      ]}
                    />
                    <Toggle
                      label="Include Timeline"
                      description="Add case timeline to generated reports"
                      enabled={localSettings.icMember?.reporting?.includeTimelineInReports}
                      onChange={(v) => {
                        setLocalSettings(prev => ({
                          ...prev,
                          icMember: {
                            ...prev.icMember,
                            reporting: { ...prev.icMember?.reporting, includeTimelineInReports: v }
                          }
                        }));
                        updateSettings('ic/reporting', { includeTimelineInReports: v });
                      }}
                    />
                    <Toggle
                      label="Auto-generate Summary"
                      description="Automatically create executive summary"
                      enabled={localSettings.icMember?.reporting?.autoGenerateSummary}
                      onChange={(v) => {
                        setLocalSettings(prev => ({
                          ...prev,
                          icMember: {
                            ...prev.icMember,
                            reporting: { ...prev.icMember?.reporting, autoGenerateSummary: v }
                          }
                        }));
                        updateSettings('ic/reporting', { autoGenerateSummary: v });
                      }}
                    />
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-warm-200 overflow-hidden">
                  <SectionHeader
                    icon={Icons.Settings}
                    title="Quick Actions & Shortcuts"
                    description="Boost your productivity"
                  />
                  <div className="p-6">
                    <Toggle
                      label="Keyboard Shortcuts"
                      description="Enable keyboard shortcuts for quick navigation"
                      enabled={localSettings.icMember?.quickActions?.keyboardShortcutsEnabled}
                      onChange={(v) => {
                        setLocalSettings(prev => ({
                          ...prev,
                          icMember: {
                            ...prev.icMember,
                            quickActions: { ...prev.icMember?.quickActions, keyboardShortcutsEnabled: v }
                          }
                        }));
                        updateSettings('ic/quick-actions', { keyboardShortcutsEnabled: v });
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Danger Zone */}
            <div className="mt-6 bg-white rounded-xl shadow-sm border border-red-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-red-200 bg-red-50">
                <h2 className="text-lg font-semibold text-red-900">Danger Zone</h2>
              </div>
              <div className="p-6">
                <p className="text-sm text-warm-600 mb-4">
                  Logging out will end your current session. You'll need to sign in again to access your account.
                </p>
                <button
                  onClick={logout}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Log Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
