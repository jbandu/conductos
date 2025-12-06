import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ChatProvider } from './contexts/ChatContext';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
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
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import FileComplaint from './pages/employee/FileComplaint';
import MyCases from './pages/employee/MyCases';
import CaseDetail from './pages/employee/CaseDetail';
import AnonymousReport from './pages/employee/AnonymousReport';
import Resources from './pages/employee/Resources';

function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <BrowserRouter>
          <Routes>
          {/* Public Pages */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/learn" element={<AboutPoSH />} />
          <Route path="/about-posh" element={<AboutPoSH />} />
          <Route path="/ic" element={<ICLandingPage />} />

          {/* Authentication */}
          {/* Role selection removed - login now embedded in landing page */}
          <Route path="/login/employee" element={<EmployeeLogin />} />
          <Route path="/login/ic" element={<ICLogin />} />
          <Route path="/login/admin" element={<AdminLogin />} />
          <Route path="/signup/employee" element={<EmployeeSignup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Application */}
          {/* DEPRECATED: /chat route - redirects to employee dashboard with integrated chat */}
          <Route path="/chat" element={
            <ProtectedRoute>
              <Navigate to="/employee/dashboard" replace />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />

          {/* Employee Portal */}
          <Route path="/employee/dashboard" element={
            <ProtectedRoute requiredRole="employee">
              <EmployeeDashboard />
            </ProtectedRoute>
          } />
          <Route path="/employee/file-complaint" element={
            <ProtectedRoute requiredRole="employee">
              <FileComplaint />
            </ProtectedRoute>
          } />
          <Route path="/employee/cases" element={
            <ProtectedRoute requiredRole="employee">
              <MyCases />
            </ProtectedRoute>
          } />
          <Route path="/employee/cases/:caseId" element={
            <ProtectedRoute requiredRole="employee">
              <CaseDetail />
            </ProtectedRoute>
          } />
          <Route path="/employee/resources" element={
            <ProtectedRoute requiredRole="employee">
              <Resources />
            </ProtectedRoute>
          } />
          {/* Anonymous report is public - no auth required */}
          <Route path="/employee/anonymous-report" element={<AnonymousReport />} />

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
      </ChatProvider>
    </AuthProvider>
  );
}

export default App;
