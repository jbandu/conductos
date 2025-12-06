/**
 * SSO Authentication Middleware
 * Handles SSO session validation and token refresh
 */

import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { pool } from '../db/pg-init.js';
import ssoService from '../services/sso/index.js';

/**
 * Middleware to validate SSO session along with JWT
 * Extends the base authenticateToken middleware with SSO-specific checks
 */
export const validateSSOSession = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);

    // If this is an SSO session, validate it
    if (decoded.sso_session_id) {
      const session = await ssoService.validateSession(decoded.sso_session_id);

      if (!session) {
        return res.status(401).json({
          error: 'SSO session expired',
          code: 'SSO_SESSION_EXPIRED',
          sso: true
        });
      }

      // Attach SSO session info to request
      req.ssoSession = {
        id: session.id,
        providerId: session.provider_id,
        expiresAt: session.expires_at
      };
    }

    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    return res.status(403).json({ error: 'Invalid token' });
  }
};

/**
 * Middleware to check if SSO is required for the user's organization
 * Should be applied to password login endpoints
 */
export const checkSSORequired = async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next();
  }

  try {
    // Check if there's an SSO provider for this email domain
    const provider = await ssoService.getProviderForEmail(email);

    if (provider) {
      // Check if SSO is enforced for the organization
      const isEnforced = await ssoService.isSSOEnforced(provider.organization_id);

      if (isEnforced) {
        return res.status(403).json({
          error: 'SSO is required for this organization',
          code: 'SSO_REQUIRED',
          sso: true,
          provider: {
            id: provider.id,
            name: provider.display_name || provider.name,
            type: provider.provider_type
          }
        });
      }
    }

    next();
  } catch (error) {
    console.error('SSO check error:', error);
    // Don't block login on SSO check errors
    next();
  }
};

/**
 * Middleware to check if user can bypass SSO
 * Applied to password login for users with SSO configured
 */
export const checkSSOBypass = async (req, res, next) => {
  const { user_id } = req.body;

  if (!user_id) {
    return next();
  }

  try {
    const canBypass = await ssoService.canBypassSSO(user_id);

    if (!canBypass) {
      return res.status(403).json({
        error: 'SSO login is required for this account',
        code: 'SSO_ONLY',
        sso: true
      });
    }

    next();
  } catch (error) {
    console.error('SSO bypass check error:', error);
    next();
  }
};

/**
 * Middleware to require SSO admin permissions
 * Only super admins and organization admins can configure SSO
 */
export const requireSSOAdmin = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Super admins can always manage SSO
  if (req.user.is_super_admin) {
    return next();
  }

  // Check if user is an admin for the specified organization
  const organizationId = req.params.orgId || req.body.organization_id || req.query.organization_id;

  if (!organizationId) {
    return res.status(400).json({ error: 'Organization ID is required' });
  }

  // Verify user is admin for this organization
  if (req.user.organization_id !== parseInt(organizationId, 10) || req.user.role !== 'hr_admin') {
    return res.status(403).json({ error: 'SSO admin permissions required' });
  }

  next();
};

/**
 * Middleware to add SSO metadata to response
 * Adds SSO session info to API responses
 */
export const addSSOMetadata = (req, res, next) => {
  const originalJson = res.json.bind(res);

  res.json = (data) => {
    if (req.ssoSession && typeof data === 'object' && data !== null) {
      data._sso = {
        session_id: req.ssoSession.id,
        expires_at: req.ssoSession.expiresAt
      };
    }
    return originalJson(data);
  };

  next();
};

/**
 * Middleware to terminate SSO session on password change
 * Should be applied to password change endpoints
 */
export const terminateSSOOnPasswordChange = async (req, res, next) => {
  // Store original send to intercept successful response
  const originalSend = res.send.bind(res);

  res.send = async function (body) {
    // If password change was successful, terminate SSO sessions
    if (res.statusCode >= 200 && res.statusCode < 300 && req.user?.id) {
      try {
        await ssoService.terminateUserSessions(req.user.id, 'password_change');
      } catch (error) {
        console.error('Failed to terminate SSO sessions after password change:', error);
      }
    }
    return originalSend(body);
  };

  next();
};

/**
 * Rate limiting configuration for SSO endpoints
 */
export const ssoRateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 attempts per window
  message: {
    error: 'Too many SSO attempts, please try again later',
    code: 'RATE_LIMITED'
  },
  standardHeaders: true,
  legacyHeaders: false,
};

export default {
  validateSSOSession,
  checkSSORequired,
  checkSSOBypass,
  requireSSOAdmin,
  addSSOMetadata,
  terminateSSOOnPasswordChange,
  ssoRateLimitConfig
};
