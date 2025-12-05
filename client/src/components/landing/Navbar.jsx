import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white shadow-md' : 'bg-white/90 backdrop-blur-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="h-8 w-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">K</span>
            </div>
            <div className="flex flex-col">
              <span className="text-warm-900 font-semibold text-lg leading-tight group-hover:text-primary-600 transition-colors">
                KelpHR
              </span>
              <span className="text-warm-500 text-xs leading-tight">ConductOS</span>
            </div>
          </Link>

          {/* Login Buttons */}
          <div className="flex items-center space-x-3">
            <Link
              to="/login/employee"
              className="px-4 py-2 text-warm-700 hover:text-primary-600 font-medium transition-colors text-sm"
            >
              Employee Login
            </Link>
            <Link
              to="/login/ic"
              className="px-4 py-2 bg-accent-600 hover:bg-accent-700 text-white rounded-lg font-medium transition-all hover:scale-105 shadow-sm text-sm"
            >
              IC Member Login
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
