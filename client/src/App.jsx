import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import ChatPage from './pages/ChatPage';
import AboutPoSH from './pages/learn/AboutPoSH';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/learn" element={<AboutPoSH />} />
        <Route path="/about-posh" element={<AboutPoSH />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
