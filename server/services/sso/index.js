/**
 * SSO Service - Main Entry Point
 * Unified interface for SAML 2.0 and OIDC/OAuth 2.0 authentication
 */

import { pool } from '../../db/pg-init.js';
import * as samlProvider from './samlProvider.js';
import * as oidcProvider from './oidcProvider.js';
import { mapAttributes, mapGroupsToRole, extractDomain, validateMappedAttributes } from './attributeMapper.js';
import { provisionUser, deactivateSSOIdentity, canUserUseSSO } from './jitProvisioning.js';
import { encrypt, decrypt, generateSecureToken, hashValue } from './encryption.js';
import jwt from 'jsonwebtoken';
import { config } from '../../config.js';

/**
 * Get all active SSO providers for an organization
 * @param {number} organizationId - Organization ID
 * @returns {Promise<Array>} - List of providers
 */
export async function getOrganizationProviders(organizationId) {
  const result = await pool.query(`
    SELECT id, name, display_name, provider_type, provider_vendor,
           is_active, is_primary, priority, allowed_domains,
           jit_enabled, jit_default_role
    FROM sso_identity_providers
    WHERE organization_id = $1
    ORDER BY is_primary DESC, priority ASC
  `, [organizationId]);

  return result.rows;
}

/**
 * Get SSO provider by ID
 * @param {string} providerId - Provider UUID
 * @returns {Promise<object>} - Provider configuration
 */
export async function getProvider(providerId) {
  const result = await pool.query(`
    SELECT * FROM sso_identity_providers WHERE id = $1
  `, [providerId]);

  if (result.rows.length === 0) {
    throw new Error('SSO provider not found');
  }

  return result.rows[0];
}

/**
 * Get SSO provider for email domain
 * @param {string} email - User email
 * @returns {Promise<object|null>} - Provider or null
 */
export async function getProviderForEmail(email) {
  const domain = extractDomain(email);
  if (!domain) return null;

  const result = await pool.query(`
    SELECT p.id, p.name, p.display_name, p.provider_type, p.provider_vendor,
           p.organization_id, o.name as organization_name
    FROM sso_identity_providers p
    JOIN sso_verified_domains d ON p.organization_id = d.organization_id
    JOIN organizations o ON p.organization_id = o.id
    WHERE d.domain = $1
      AND d.is_verified = TRUE
      AND p.is_active = TRUE
    ORDER BY p.is_primary DESC, p.priority ASC
    LIMIT 1
  `, [domain]);

  return result.rows.length > 0 ? result.rows[0] : null;
}

/**
 * Initiate SSO login
 * @param {string} providerId - Provider UUID
 * @param {object} options - Login options
 * @returns {Promise<object>} - { url, state }
 */
export async function initiateLogin(providerId, options = {}) {
  const provider = await getProvider(providerId);

  if (!provider.is_active) {
    throw new Error('SSO provider is not active');
  }

  if (provider.provider_type === 'saml') {
    return samlProvider.generateAuthRequest(providerId, options);
  } else if (provider.provider_type === 'oidc' || provider.provider_type === 'oauth2') {
    return oidcProvider.generateAuthUrl(providerId, options);
  } else {
    throw new Error(`Unsupported provider type: ${provider.provider_type}`);
  }
}

/**
 * Process SSO callback
 * @param {string} providerId - Provider UUID
 * @param {object} callbackData - Callback data (SAML response or OAuth params)
 * @param {object} options - Processing options
 * @returns {Promise<object>} - { user, token, redirectUrl }
 */
export async function processCallback(providerId, callbackData, options = {}) {
  const provider = await getProvider(providerId);

  let result;
  if (provider.provider_type === 'saml') {
    result = await samlProvider.processSAMLResponse(providerId, callbackData, options);
  } else if (provider.provider_type === 'oidc' || provider.provider_type === 'oauth2') {
    result = await oidcProvider.processCallback(providerId, callbackData, options);
  } else {
    throw new Error(`Unsupported provider type: ${provider.provider_type}`);
  }

  // Generate JWT token for the user
  const token = jwt.sign(
    {
      id: result.user.id,
      email: result.user.email,
      role: result.user.role,
      organization_id: result.user.organization_id,
      sso_session_id: result.session.id
    },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN || '7d' }
  );

  return {
    user: result.user,
    token,
    session: result.session,
    created: result.created,
    updated: result.updated
  };
}

/**
 * Initiate SSO logout
 * @param {string} sessionId - SSO session UUID
 * @param {object} options - Logout options
 * @returns {Promise<object>} - { url, localOnly }
 */
export async function initiateLogout(sessionId, options = {}) {
  const sessionResult = await pool.query(`
    SELECT s.*, p.provider_type
    FROM sso_sessions s
    JOIN sso_identity_providers p ON s.provider_id = p.id
    WHERE s.id = $1
  `, [sessionId]);

  if (sessionResult.rows.length === 0) {
    // Session not found, just return success
    return { url: null, localOnly: true };
  }

  const session = sessionResult.rows[0];

  if (session.provider_type === 'saml') {
    return samlProvider.generateLogoutRequest(sessionId, options);
  } else {
    return oidcProvider.generateLogoutUrl(sessionId, options);
  }
}

/**
 * Terminate all SSO sessions for a user
 * @param {number} userId - User ID
 * @param {string} reason - Termination reason
 * @returns {Promise<number>} - Number of sessions terminated
 */
export async function terminateUserSessions(userId, reason = 'forced') {
  const result = await pool.query(`
    UPDATE sso_sessions
    SET is_active = FALSE,
        terminated_at = NOW(),
        termination_reason = $1
    WHERE user_id = $2 AND is_active = TRUE
    RETURNING id
  `, [reason, userId]);

  return result.rowCount;
}

/**
 * Check if SSO is enforced for an organization
 * @param {number} organizationId - Organization ID
 * @returns {Promise<boolean>} - Whether SSO is enforced
 */
export async function isSSOEnforced(organizationId) {
  const result = await pool.query(`
    SELECT sso_enforced FROM organizations WHERE id = $1
  `, [organizationId]);

  return result.rows.length > 0 && result.rows[0].sso_enforced === true;
}

/**
 * Check if a user can bypass SSO
 * @param {number} userId - User ID
 * @returns {Promise<boolean>} - Whether user can bypass SSO
 */
export async function canBypassSSO(userId) {
  const result = await pool.query(`
    SELECT u.sso_only, u.password_login_disabled, o.sso_enforced, o.sso_bypass_allowed
    FROM users u
    JOIN organizations o ON u.organization_id = o.id
    WHERE u.id = $1
  `, [userId]);

  if (result.rows.length === 0) return true;

  const { sso_only, password_login_disabled, sso_enforced, sso_bypass_allowed } = result.rows[0];

  // If user is SSO-only or password login is disabled, cannot bypass
  if (sso_only || password_login_disabled) return false;

  // If SSO is enforced and bypass is not allowed, cannot bypass
  if (sso_enforced && !sso_bypass_allowed) return false;

  return true;
}

/**
 * Validate SSO session
 * @param {string} sessionId - SSO session UUID
 * @returns {Promise<object|null>} - Session info or null if invalid
 */
export async function validateSession(sessionId) {
  const result = await pool.query(`
    SELECT s.*, p.provider_type, p.organization_id
    FROM sso_sessions s
    JOIN sso_identity_providers p ON s.provider_id = p.id
    WHERE s.id = $1 AND s.is_active = TRUE AND s.expires_at > NOW()
  `, [sessionId]);

  if (result.rows.length === 0) return null;

  const session = result.rows[0];

  // Check if token needs refresh (for OIDC)
  if (session.provider_type !== 'saml' &&
      session.token_expires_at &&
      new Date(session.token_expires_at) < new Date(Date.now() + 300000)) {
    // Token expires in less than 5 minutes, try to refresh
    try {
      await oidcProvider.refreshToken(sessionId);
    } catch (error) {
      console.warn('Token refresh failed:', error.message);
      // Continue with potentially expired token
    }
  }

  return session;
}

/**
 * Get SP metadata for SAML provider
 * @param {string} providerId - Provider UUID
 * @returns {Promise<string>} - Metadata XML
 */
export async function getSAMLMetadata(providerId) {
  return samlProvider.generateMetadata(providerId);
}

/**
 * Get SSO audit log
 * @param {object} filters - Filter criteria
 * @returns {Promise<Array>} - Audit log entries
 */
export async function getAuditLog(filters = {}) {
  let query = `
    SELECT al.*, u.email as user_email, p.name as provider_name
    FROM sso_audit_log al
    LEFT JOIN users u ON al.user_id = u.id
    LEFT JOIN sso_identity_providers p ON al.provider_id = p.id
    WHERE 1=1
  `;
  const params = [];
  let paramIndex = 1;

  if (filters.organizationId) {
    query += ` AND al.organization_id = $${paramIndex++}`;
    params.push(filters.organizationId);
  }

  if (filters.userId) {
    query += ` AND al.user_id = $${paramIndex++}`;
    params.push(filters.userId);
  }

  if (filters.providerId) {
    query += ` AND al.provider_id = $${paramIndex++}`;
    params.push(filters.providerId);
  }

  if (filters.eventType) {
    query += ` AND al.event_type = $${paramIndex++}`;
    params.push(filters.eventType);
  }

  if (filters.eventStatus) {
    query += ` AND al.event_status = $${paramIndex++}`;
    params.push(filters.eventStatus);
  }

  if (filters.startDate) {
    query += ` AND al.created_at >= $${paramIndex++}`;
    params.push(filters.startDate);
  }

  if (filters.endDate) {
    query += ` AND al.created_at <= $${paramIndex++}`;
    params.push(filters.endDate);
  }

  query += ' ORDER BY al.created_at DESC';

  if (filters.limit) {
    query += ` LIMIT $${paramIndex++}`;
    params.push(filters.limit);
  }

  if (filters.offset) {
    query += ` OFFSET $${paramIndex++}`;
    params.push(filters.offset);
  }

  const result = await pool.query(query, params);
  return result.rows;
}

// Re-export utility functions
export {
  mapAttributes,
  mapGroupsToRole,
  extractDomain,
  validateMappedAttributes,
  provisionUser,
  deactivateSSOIdentity,
  canUserUseSSO,
  encrypt,
  decrypt,
  generateSecureToken,
  hashValue
};

// Export sub-modules
export { samlProvider, oidcProvider };

export default {
  getOrganizationProviders,
  getProvider,
  getProviderForEmail,
  initiateLogin,
  processCallback,
  initiateLogout,
  terminateUserSessions,
  isSSOEnforced,
  canBypassSSO,
  validateSession,
  getSAMLMetadata,
  getAuditLog,
  mapAttributes,
  mapGroupsToRole,
  extractDomain,
  provisionUser,
  samlProvider,
  oidcProvider
};
