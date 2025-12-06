/**
 * SSO Routes
 * Handles SAML 2.0 and OIDC/OAuth 2.0 authentication flows
 */

import express from 'express';
import { config } from '../config.js';
import ssoService from '../services/sso/index.js';

const router = express.Router();

// Get client redirect URL
function getClientUrl() {
  return config.CLIENT_URL || 'http://localhost:5174';
}

// Error redirect helper
function redirectWithError(res, error, providerId = null) {
  const clientUrl = getClientUrl();
  const errorMessage = encodeURIComponent(error.message || 'Authentication failed');
  const errorUrl = `${clientUrl}/login?sso_error=${errorMessage}${providerId ? `&provider=${providerId}` : ''}`;
  res.redirect(errorUrl);
}

// ============================================================================
// Discovery Endpoints
// ============================================================================

/**
 * GET /api/sso/providers
 * Get available SSO providers for email domain
 */
router.get('/providers', async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const provider = await ssoService.getProviderForEmail(email);

    if (!provider) {
      return res.json({ sso_available: false });
    }

    res.json({
      sso_available: true,
      provider: {
        id: provider.id,
        name: provider.display_name || provider.name,
        type: provider.provider_type,
        organization: provider.organization_name
      }
    });
  } catch (error) {
    console.error('SSO provider lookup error:', error);
    res.status(500).json({ error: 'Failed to check SSO availability' });
  }
});

/**
 * GET /api/sso/organization/:orgId/providers
 * Get all SSO providers for an organization
 */
router.get('/organization/:orgId/providers', async (req, res) => {
  try {
    const { orgId } = req.params;
    const providers = await ssoService.getOrganizationProviders(parseInt(orgId, 10));

    res.json({
      providers: providers.map(p => ({
        id: p.id,
        name: p.name,
        display_name: p.display_name,
        type: p.provider_type,
        vendor: p.provider_vendor,
        is_active: p.is_active,
        is_primary: p.is_primary
      }))
    });
  } catch (error) {
    console.error('SSO providers list error:', error);
    res.status(500).json({ error: 'Failed to get SSO providers' });
  }
});

// ============================================================================
// SAML 2.0 Endpoints
// ============================================================================

/**
 * GET /api/sso/saml/:providerId/login
 * Initiate SAML authentication
 */
router.get('/saml/:providerId/login', async (req, res) => {
  try {
    const { providerId } = req.params;
    const { RelayState } = req.query;

    const result = await ssoService.initiateLogin(providerId, {
      relayState: RelayState,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.redirect(result.url);
  } catch (error) {
    console.error('SAML login initiation error:', error);
    redirectWithError(res, error, req.params.providerId);
  }
});

/**
 * POST /api/sso/saml/:providerId/callback
 * Handle SAML response (Assertion Consumer Service)
 */
router.post('/saml/:providerId/callback', express.urlencoded({ extended: false }), async (req, res) => {
  try {
    const { providerId } = req.params;
    const { SAMLResponse, RelayState } = req.body;

    if (!SAMLResponse) {
      throw new Error('No SAML response received');
    }

    const result = await ssoService.processCallback(providerId, { SAMLResponse }, {
      relayState: RelayState,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Redirect to client with token
    const clientUrl = getClientUrl();
    const redirectUrl = `${clientUrl}/sso/callback?token=${encodeURIComponent(result.token)}&provider=${providerId}`;
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('SAML callback error:', error);
    redirectWithError(res, error, req.params.providerId);
  }
});

/**
 * GET /api/sso/saml/:providerId/metadata
 * Get Service Provider metadata
 */
router.get('/saml/:providerId/metadata', async (req, res) => {
  try {
    const { providerId } = req.params;
    const metadata = await ssoService.getSAMLMetadata(providerId);

    res.set('Content-Type', 'application/xml');
    res.send(metadata);
  } catch (error) {
    console.error('SAML metadata error:', error);
    res.status(500).json({ error: 'Failed to generate metadata' });
  }
});

/**
 * GET/POST /api/sso/saml/:providerId/slo
 * Single Logout endpoint
 */
router.all('/saml/:providerId/slo', express.urlencoded({ extended: false }), async (req, res) => {
  try {
    const { providerId } = req.params;
    const samlResponse = req.body.SAMLResponse || req.query.SAMLResponse;
    const samlRequest = req.body.SAMLRequest || req.query.SAMLRequest;

    if (samlResponse) {
      // Logout response from IdP
      await ssoService.samlProvider.processSAMLLogoutResponse(providerId, { SAMLResponse: samlResponse }, {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
    } else if (samlRequest) {
      // IdP-initiated logout request
      // TODO: Process logout request
    }

    const clientUrl = getClientUrl();
    res.redirect(`${clientUrl}/login?logged_out=true`);
  } catch (error) {
    console.error('SAML SLO error:', error);
    const clientUrl = getClientUrl();
    res.redirect(`${clientUrl}/login?logged_out=true`);
  }
});

// ============================================================================
// OIDC / OAuth 2.0 Endpoints
// ============================================================================

/**
 * GET /api/sso/oidc/:providerId/login
 * Initiate OIDC authentication
 */
router.get('/oidc/:providerId/login', async (req, res) => {
  try {
    const { providerId } = req.params;
    const { login_hint, prompt } = req.query;

    const result = await ssoService.initiateLogin(providerId, {
      loginHint: login_hint,
      prompt,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.redirect(result.url);
  } catch (error) {
    console.error('OIDC login initiation error:', error);
    redirectWithError(res, error, req.params.providerId);
  }
});

/**
 * GET /api/sso/oidc/:providerId/callback
 * Handle OIDC callback
 */
router.get('/oidc/:providerId/callback', async (req, res) => {
  try {
    const { providerId } = req.params;
    const callbackParams = req.query;

    const result = await ssoService.processCallback(providerId, callbackParams, {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Redirect to client with token
    const clientUrl = getClientUrl();
    const redirectUrl = `${clientUrl}/sso/callback?token=${encodeURIComponent(result.token)}&provider=${providerId}`;
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('OIDC callback error:', error);
    redirectWithError(res, error, req.params.providerId);
  }
});

/**
 * GET /api/sso/oidc/:providerId/logout-callback
 * Handle OIDC logout callback
 */
router.get('/oidc/:providerId/logout-callback', async (req, res) => {
  try {
    const clientUrl = getClientUrl();
    res.redirect(`${clientUrl}/login?logged_out=true`);
  } catch (error) {
    console.error('OIDC logout callback error:', error);
    const clientUrl = getClientUrl();
    res.redirect(`${clientUrl}/login`);
  }
});

// ============================================================================
// Generic SSO Endpoints
// ============================================================================

/**
 * GET /api/sso/login/:providerId
 * Generic SSO login (auto-detects provider type)
 */
router.get('/login/:providerId', async (req, res) => {
  try {
    const { providerId } = req.params;
    const provider = await ssoService.getProvider(providerId);

    // Redirect to appropriate provider-specific endpoint
    if (provider.provider_type === 'saml') {
      res.redirect(`/api/sso/saml/${providerId}/login`);
    } else {
      res.redirect(`/api/sso/oidc/${providerId}/login`);
    }
  } catch (error) {
    console.error('SSO login error:', error);
    redirectWithError(res, error, req.params.providerId);
  }
});

/**
 * POST /api/sso/logout
 * Initiate SSO logout
 */
router.post('/logout', async (req, res) => {
  try {
    const { session_id } = req.body;

    if (!session_id) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    const result = await ssoService.initiateLogout(session_id, {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    if (result.localOnly || !result.url) {
      res.json({ success: true, local_only: true });
    } else {
      res.json({ success: true, redirect_url: result.url });
    }
  } catch (error) {
    console.error('SSO logout error:', error);
    // Still consider logout successful even on error
    res.json({ success: true, local_only: true });
  }
});

/**
 * GET /api/sso/session/validate
 * Validate SSO session
 */
router.get('/session/validate', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ valid: false, error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    // Decode JWT to get session ID
    const jwt = await import('jsonwebtoken');
    const decoded = jwt.default.verify(token, config.JWT_SECRET);

    if (!decoded.sso_session_id) {
      return res.json({ valid: true, sso: false });
    }

    const session = await ssoService.validateSession(decoded.sso_session_id);

    if (!session) {
      return res.status(401).json({ valid: false, error: 'SSO session expired' });
    }

    res.json({
      valid: true,
      sso: true,
      session: {
        id: session.id,
        provider_id: session.provider_id,
        expires_at: session.expires_at
      }
    });
  } catch (error) {
    console.error('Session validation error:', error);
    res.status(401).json({ valid: false, error: 'Invalid token' });
  }
});

export default router;
