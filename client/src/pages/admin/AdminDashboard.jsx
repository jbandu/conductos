import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { Card, Badge } from '../../components/design-system';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    icMembers: 0,
    recentActivity: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');

      // Fetch users
      const usersResponse = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const usersData = await usersResponse.json();

      // Fetch IC composition
      const icResponse = await fetch('/api/admin/ic-composition', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const icData = await icResponse.json();

      setStats({
        totalUsers: usersData.users.length,
        activeUsers: usersData.users.filter(u => u.is_active).length,
        icMembers: icData.composition.total_active,
        recentActivity: []
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      color: 'bg-blue-500',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Active Users',
      value: stats.activeUsers,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'bg-green-500',
      bgColor: 'bg-green-100'
    },
    {
      title: 'IC Members',
      value: stats.icMembers,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      color: 'bg-purple-500',
      bgColor: 'bg-purple-100'
    }
  ];

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-admin-200 border-t-admin-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-warm-600">Loading dashboard...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-display-lg text-warm-900 mb-2">Admin Dashboard</h1>
          <p className="text-body text-warm-600">Welcome to the ConductOS administration panel</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <Card key={index} hover padding="comfortable">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-warm-600 mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-warm-900">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                  <div className={`${stat.color} text-white`}>
                    {stat.icon}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card className="mb-8">
          <Card.Header>
            <h2 className="text-h1 text-warm-900">Quick Actions</h2>
          </Card.Header>
          <Card.Body>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <a
                href="/admin/users?action=create"
                className="flex items-center p-4 border-2 border-dashed border-warm-200 rounded-xl hover:border-admin-300 hover:bg-admin-50 transition-all group"
              >
                <div className="bg-admin-100 p-2 rounded-lg mr-3 group-hover:bg-admin-200 transition-colors">
                  <svg className="w-6 h-6 text-admin-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-warm-900 group-hover:text-admin-600 transition-colors">Add User</p>
                  <p className="text-sm text-warm-600">Create new user</p>
                </div>
              </a>

              <a
                href="/admin/ic-composition?action=add"
                className="flex items-center p-4 border-2 border-dashed border-warm-200 rounded-xl hover:border-admin-300 hover:bg-admin-50 transition-all group"
              >
                <div className="bg-admin-100 p-2 rounded-lg mr-3 group-hover:bg-admin-200 transition-colors">
                  <svg className="w-6 h-6 text-admin-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-warm-900 group-hover:text-admin-600 transition-colors">Add IC Member</p>
                  <p className="text-sm text-warm-600">Manage IC composition</p>
                </div>
              </a>

              <a
                href="/admin/organization"
                className="flex items-center p-4 border-2 border-dashed border-warm-200 rounded-xl hover:border-admin-300 hover:bg-admin-50 transition-all group"
              >
                <div className="bg-admin-100 p-2 rounded-lg mr-3 group-hover:bg-admin-200 transition-colors">
                  <svg className="w-6 h-6 text-admin-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-warm-900 group-hover:text-admin-600 transition-colors">Settings</p>
                  <p className="text-sm text-warm-600">Organization settings</p>
                </div>
              </a>

              <a
                href="/admin/audit-log"
                className="flex items-center p-4 border-2 border-dashed border-warm-200 rounded-xl hover:border-admin-300 hover:bg-admin-50 transition-all group"
              >
                <div className="bg-admin-100 p-2 rounded-lg mr-3 group-hover:bg-admin-200 transition-colors">
                  <svg className="w-6 h-6 text-admin-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-warm-900 group-hover:text-admin-600 transition-colors">View Audit Log</p>
                  <p className="text-sm text-warm-600">Recent admin actions</p>
                </div>
              </a>
            </div>
          </Card.Body>
        </Card>

        {/* Recent Activity */}
        <Card>
          <Card.Header>
            <h2 className="text-h1 text-warm-900">Recent Activity</h2>
          </Card.Header>
          <Card.Body>
            {stats.recentActivity.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-warm-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p className="text-warm-600">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-4">
                {stats.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center p-4 bg-warm-50 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-warm-900">{activity.action}</p>
                      <p className="text-sm text-warm-600">{activity.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card.Body>
        </Card>
      </div>
    </AdminLayout>
  );
}
