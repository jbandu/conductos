import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-warm-800 text-warm-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Left: Branding */}
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="h-10 w-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded flex items-center justify-center">
                <span className="text-white font-bold">K</span>
              </div>
              <div className="flex flex-col">
                <span className="text-white font-semibold text-lg leading-tight">
                  KelpHR
                </span>
                <span className="text-warm-400 text-sm leading-tight">ConductOS</span>
              </div>
            </div>
            <p className="text-sm text-warm-400 max-w-md leading-relaxed">
              Building safer workplaces through technology. Compliant with the Prevention of Sexual Harassment at Workplace Act, 2013.
            </p>
          </div>

          {/* Right: Links & Contact */}
          <div className="grid sm:grid-cols-2 gap-8">
            <div>
              <h3 className="text-white font-semibold mb-3">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="#" className="text-sm text-warm-400 hover:text-primary-400 transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="#" className="text-sm text-warm-400 hover:text-primary-400 transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link to="#" className="text-sm text-warm-400 hover:text-primary-400 transition-colors">
                    Contact Support
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-3">Need Help?</h3>
              <p className="text-sm text-warm-400 mb-2">
                Women Helpline (24/7)
              </p>
              <p className="text-lg font-semibold text-primary-400 mb-4">
                181
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-warm-700 flex flex-col sm:flex-row justify-between items-center text-sm text-warm-400">
          <p>© 2025 KelpHR. All rights reserved.</p>
          <p className="mt-2 sm:mt-0">Compliant with PoSH Act, 2013</p>
        </div>
      </div>
    </footer>
  );
}
