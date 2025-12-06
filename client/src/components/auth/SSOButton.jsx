/**
 * SSO Login Button Component
 * Displays SSO login options based on provider configuration
 */

import React, { useState, useEffect } from 'react';
import { checkSSOAvailability, initiateSSO, getProviderDisplayName } from '../../services/ssoService';

// Provider icons as SVG
const ProviderIcons = {
  microsoft: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zm12.6 0H12.6V0H24v11.4z"/>
    </svg>
  ),
  google: (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  ),
  okta: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.389 0 0 5.35 0 12s5.35 12 12 12 12-5.35 12-12S18.611 0 12 0zm0 18c-3.325 0-6-2.675-6-6s2.675-6 6-6 6 2.675 6 6-2.675 6-6 6z"/>
    </svg>
  ),
  key: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
    </svg>
  )
};

/**
 * SSO Button Component
 * @param {object} props - Component props
 * @param {string} props.email - User email for SSO detection
 * @param {function} props.onSSOAvailable - Callback when SSO is detected
 * @param {string} props.className - Additional CSS classes
 */
export function SSOButton({ email, onSSOAvailable, className = '' }) {
  const [ssoInfo, setSSOInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  // Check SSO availability when email changes
  useEffect(() => {
    const checkSSO = async () => {
      if (!email || !email.includes('@')) {
        setSSOInfo(null);
        return;
      }

      // Debounce the check
      setIsChecking(true);
      try {
        const result = await checkSSOAvailability(email);
        setSSOInfo(result.sso_available ? result : null);

        if (result.sso_available && onSSOAvailable) {
          onSSOAvailable(result.provider);
        }
      } catch (error) {
        console.error('SSO check error:', error);
        setSSOInfo(null);
      } finally {
        setIsChecking(false);
      }
    };

    const timeoutId = setTimeout(checkSSO, 500);
    return () => clearTimeout(timeoutId);
  }, [email, onSSOAvailable]);

  const handleSSOLogin = () => {
    if (!ssoInfo?.provider) return;

    setIsLoading(true);
    initiateSSO(ssoInfo.provider.id, ssoInfo.provider.type);
  };

  if (!ssoInfo) {
    return null;
  }

  const providerVendor = ssoInfo.provider.vendor || 'key';
  const icon = ProviderIcons[providerVendor === 'azure_ad' ? 'microsoft' : providerVendor] || ProviderIcons.key;
  const displayName = ssoInfo.provider.name || getProviderDisplayName(providerVendor);

  return (
    <div className={className}>
      {/* SSO Available Message */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm text-blue-800">
            SSO is available for <strong>{ssoInfo.provider.organization}</strong>
          </span>
        </div>
      </div>

      {/* SSO Login Button */}
      <button
        type="button"
        onClick={handleSSOLogin}
        disabled={isLoading}
        className="w-full flex items-center justify-center px-6 py-3 bg-warm-800 text-white rounded-lg font-medium hover:bg-warm-900 active:bg-warm-950 disabled:bg-warm-400 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Redirecting to SSO...
          </>
        ) : (
          <>
            <span className="mr-3">{icon}</span>
            Sign in with {displayName}
          </>
        )}
      </button>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-warm-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-warm-500">Or continue with password</span>
        </div>
      </div>
    </div>
  );
}

/**
 * SSO Provider List Component
 * Shows multiple SSO options for an organization
 */
export function SSOProviderList({ providers, onSelect, className = '' }) {
  const [isLoading, setIsLoading] = useState(null);

  const handleSelect = (provider) => {
    setIsLoading(provider.id);
    if (onSelect) {
      onSelect(provider);
    }
    initiateSSO(provider.id, provider.type);
  };

  if (!providers || providers.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {providers.map((provider) => {
        const icon = ProviderIcons[provider.vendor === 'azure_ad' ? 'microsoft' : provider.vendor] || ProviderIcons.key;

        return (
          <button
            key={provider.id}
            type="button"
            onClick={() => handleSelect(provider)}
            disabled={isLoading === provider.id}
            className="w-full flex items-center px-4 py-3 bg-white border border-warm-200 rounded-lg hover:bg-warm-50 hover:border-warm-300 transition-colors disabled:opacity-50"
          >
            <span className="text-warm-600 mr-3">{icon}</span>
            <span className="flex-1 text-left font-medium text-warm-800">
              {provider.display_name || provider.name}
            </span>
            {isLoading === provider.id ? (
              <svg className="animate-spin h-5 w-5 text-warm-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-5 h-5 text-warm-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * SSO Required Notice Component
 * Shows when SSO is enforced for an organization
 */
export function SSORequiredNotice({ provider, onContinue, className = '' }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = () => {
    setIsLoading(true);
    if (onContinue) {
      onContinue(provider);
    }
    initiateSSO(provider.id, provider.type);
  };

  const icon = ProviderIcons[provider.vendor === 'azure_ad' ? 'microsoft' : provider.vendor] || ProviderIcons.key;

  return (
    <div className={`text-center ${className}`}>
      <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      </div>

      <h2 className="text-xl font-bold text-warm-900 mb-2">
        Single Sign-On Required
      </h2>
      <p className="text-warm-600 mb-6">
        Your organization requires you to sign in using {provider.name || 'corporate SSO'}.
      </p>

      <button
        type="button"
        onClick={handleContinue}
        disabled={isLoading}
        className="w-full flex items-center justify-center px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:bg-primary-300 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Redirecting...
          </>
        ) : (
          <>
            <span className="mr-3">{icon}</span>
            Continue with {provider.name || 'SSO'}
          </>
        )}
      </button>
    </div>
  );
}

export default SSOButton;
