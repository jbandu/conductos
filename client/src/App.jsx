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
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import ICComposition from './pages/admin/ICComposition';

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

          {/* Application */}
          <Route path="/chat" element={
            <ProtectedRoute>
              <ChatPage />
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
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
