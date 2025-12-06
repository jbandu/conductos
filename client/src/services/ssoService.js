/**
 * SSO Service
 * Client-side SSO utilities and API calls
 */

const API_BASE = import.meta.env.VITE_API_URL || '';

/**
 * Check if SSO is available for an email domain
 * @param {string} email - User email
 * @returns {Promise<object>} - SSO availability info
 */
export async function checkSSOAvailability(email) {
  try {
    const response = await fetch(`${API_BASE}/api/sso/providers?email=${encodeURIComponent(email)}`);

    if (!response.ok) {
      throw new Error('Failed to check SSO availability');
    }

    return await response.json();
  } catch (error) {
    console.error('SSO availability check error:', error);
    return { sso_available: false };
  }
}

/**
 * Get SSO providers for an organization
 * @param {number} organizationId - Organization ID
 * @returns {Promise<Array>} - List of SSO providers
 */
export async function getOrganizationProviders(organizationId) {
  try {
    const response = await fetch(`${API_BASE}/api/sso/organization/${organizationId}/providers`);

    if (!response.ok) {
      throw new Error('Failed to get SSO providers');
    }

    const data = await response.json();
    return data.providers || [];
  } catch (error) {
    console.error('Get SSO providers error:', error);
    return [];
  }
}

/**
 * Initiate SSO login
 * @param {string} providerId - SSO provider ID
 * @param {string} providerType - Provider type (saml, oidc)
 */
export function initiateSSO(providerId, providerType = 'saml') {
  const endpoint = providerType === 'saml'
    ? `${API_BASE}/api/sso/saml/${providerId}/login`
    : `${API_BASE}/api/sso/oidc/${providerId}/login`;

  // Redirect to SSO login
  window.location.href = endpoint;
}

/**
 * Initiate SSO logout
 * @param {string} sessionId - SSO session ID
 * @param {string} token - Auth token
 * @returns {Promise<object>} - Logout result
 */
export async function initiateLogout(sessionId, token) {
  try {
    const response = await fetch(`${API_BASE}/api/sso/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ session_id: sessionId })
    });

    const data = await response.json();

    if (data.redirect_url) {
      // IdP logout required
      window.location.href = data.redirect_url;
      return { redirected: true };
    }

    return { success: true, local_only: data.local_only };
  } catch (error) {
    console.error('SSO logout error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Validate SSO session
 * @param {string} token - Auth token
 * @returns {Promise<object>} - Session validation result
 */
export async function validateSSOSession(token) {
  try {
    const response = await fetch(`${API_BASE}/api/sso/session/validate`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    return await response.json();
  } catch (error) {
    console.error('SSO session validation error:', error);
    return { valid: false, error: error.message };
  }
}

/**
 * Parse SSO callback token from URL
 * @returns {object|null} - Parsed callback data or null
 */
export function parseCallbackParams() {
  const params = new URLSearchParams(window.location.search);

  const token = params.get('token');
  const provider = params.get('provider');
  const error = params.get('sso_error');

  if (error) {
    return { error: decodeURIComponent(error), provider };
  }

  if (token) {
    return { token, provider };
  }

  return null;
}

/**
 * Get SSO provider icon based on vendor
 * @param {string} vendor - Provider vendor (okta, azure_ad, google, etc.)
 * @returns {string} - Icon name or default
 */
export function getProviderIcon(vendor) {
  const icons = {
    okta: 'okta',
    azure_ad: 'microsoft',
    google: 'google',
    onelogin: 'onelogin',
    ping: 'ping',
    auth0: 'auth0',
    custom: 'key'
  };

  return icons[vendor] || 'key';
}

/**
 * Get SSO provider display name
 * @param {string} vendor - Provider vendor
 * @returns {string} - Display name
 */
export function getProviderDisplayName(vendor) {
  const names = {
    okta: 'Okta',
    azure_ad: 'Microsoft Entra ID',
    google: 'Google Workspace',
    onelogin: 'OneLogin',
    ping: 'Ping Identity',
    auth0: 'Auth0',
    custom: 'Enterprise SSO'
  };

  return names[vendor] || 'Enterprise SSO';
}

export default {
  checkSSOAvailability,
  getOrganizationProviders,
  initiateSSO,
  initiateLogout,
  validateSSOSession,
  parseCallbackParams,
  getProviderIcon,
  getProviderDisplayName
};
