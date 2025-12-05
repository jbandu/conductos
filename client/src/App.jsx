import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import ChatPage from './pages/ChatPage';
import AboutPoSH from './pages/learn/AboutPoSH';
import ICLandingPage from './pages/ic/ICLandingPage';
import RoleSelection from './pages/auth/RoleSelection';
import EmployeeLogin from './pages/auth/EmployeeLogin';
import EmployeeSignup from './pages/auth/EmployeeSignup';
import ICLogin from './pages/auth/ICLogin';

function App() {
  return (
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
        <Route path="/signup/employee" element={<EmployeeSignup />} />

        {/* Application */}
        <Route path="/chat" element={<ChatPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
