import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import ChatPage from './pages/ChatPage';
import AboutPoSH from './pages/learn/AboutPoSH';
import ICLandingPage from './pages/ic/ICLandingPage';
import RoleSelection from './pages/auth/RoleSelection';
import EmployeeLogin from './pages/auth/EmployeeLogin';
import EmployeeSignup from './pages/auth/EmployeeSignup';
import ICLogin from './pages/auth/ICLogin';
import AdminLogin from './pages/auth/AdminLogin';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import ICComposition from './pages/admin/ICComposition';
import AuditLog from './pages/admin/AuditLog';
import OrganizationSettings from './pages/admin/OrganizationSettings';
import ProfilePage from './pages/ProfilePage';
import KnowledgeBase from './pages/ic/KnowledgeBase';
import PatternAnalysis from './pages/ic/PatternAnalysis';
import ProactiveInsights from './pages/ic/ProactiveInsights';
import ExternalMembers from './pages/admin/ExternalMembers';
import MonitoringDashboard from './pages/admin/MonitoringDashboard';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Pages */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/learn" element={<AboutPoSH />} />
          <Route path="/about-posh" element={<AboutPoSH />} />
          <Route path="/ic" element={<ICLandingPage />} />

          {/* Authentication */}
          <Route path="/login" element={<RoleSelection />} />
          <Route path="/login/employee" element={<EmployeeLogin />} />
          <Route path="/login/ic" element={<ICLogin />} />
          <Route path="/login/admin" element={<AdminLogin />} />
          <Route path="/signup/employee" element={<EmployeeSignup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Application */}
          <Route path="/chat" element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />

          {/* Admin Panel */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute requiredRole="hr_admin">
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute requiredRole="hr_admin">
              <UserManagement />
            </ProtectedRoute>
          } />
          <Route path="/admin/ic-composition" element={
            <ProtectedRoute requiredRole="hr_admin">
              <ICComposition />
            </ProtectedRoute>
          } />
          <Route path="/admin/audit-log" element={
            <ProtectedRoute requiredRole="hr_admin">
              <AuditLog />
            </ProtectedRoute>
          } />
          <Route path="/admin/organization" element={
            <ProtectedRoute requiredRole="hr_admin">
              <OrganizationSettings />
            </ProtectedRoute>
          } />
          <Route path="/admin/external-members" element={
            <ProtectedRoute requiredRole="hr_admin">
              <ExternalMembers />
            </ProtectedRoute>
          } />
          <Route path="/admin/monitoring" element={
            <ProtectedRoute requiredRole="hr_admin">
              <MonitoringDashboard />
            </ProtectedRoute>
          } />

          {/* IC Features */}
          <Route path="/ic/knowledge-base" element={
            <ProtectedRoute requiredRole="ic_member">
              <KnowledgeBase />
            </ProtectedRoute>
          } />
          <Route path="/ic/patterns" element={
            <ProtectedRoute requiredRole="ic_member">
              <PatternAnalysis />
            </ProtectedRoute>
          } />
          <Route path="/ic/insights" element={
            <ProtectedRoute requiredRole="ic_member">
              <ProactiveInsights />
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
