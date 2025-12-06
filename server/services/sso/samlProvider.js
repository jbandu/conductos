/**
 * SAML 2.0 Provider Service
 * Handles SAML authentication flows for enterprise SSO
 */

import { SAML } from '@node-saml/node-saml';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../../db/pg-init.js';
import { config } from '../../config.js';
import { mapAttributes, validateMappedAttributes } from './attributeMapper.js';
import { provisionUser } from './jitProvisioning.js';
import { generateSecureToken } from './encryption.js';

// Cache for SAML strategy instances
const samlInstanceCache = new Map();

/**
 * Get the base URL for callbacks
 */
function getBaseUrl() {
  return process.env.SSO_BASE_URL || config.CLIENT_URL || 'http://localhost:3001';
}

/**
 * Get or create a SAML instance for a provider
 * @param {object} providerConfig - Provider configuration from database
 * @returns {SAML} - SAML instance
 */
export function getSAMLInstance(providerConfig) {
  const cacheKey = `${providerConfig.id}-${providerConfig.updated_at}`;

  if (samlInstanceCache.has(cacheKey)) {
    return samlInstanceCache.get(cacheKey);
  }

  const baseUrl = getBaseUrl();

  const samlConfig = {
    // Service Provider (SP) configuration
    issuer: providerConfig.saml_entity_id || `${baseUrl}/api/sso/saml/${providerConfig.id}/metadata`,
    callbackUrl: `${baseUrl}/api/sso/saml/${providerConfig.id}/callback`,
    logoutCallbackUrl: `${baseUrl}/api/sso/saml/${providerConfig.id}/slo`,

    // Identity Provider (IdP) configuration
    entryPoint: providerConfig.saml_sso_url,
    logoutUrl: providerConfig.saml_slo_url,
    cert: providerConfig.saml_certificate,

    // Signature settings
    signatureAlgorithm: providerConfig.saml_signature_algorithm || 'sha256',
    digestAlgorithm: providerConfig.saml_digest_algorithm || 'sha256',
    wantAuthnResponseSigned: providerConfig.saml_want_response_signed !== false,
    wantAssertionsSigned: providerConfig.saml_want_assertions_signed !== false,

    // NameID format
    identifierFormat: providerConfig.saml_name_id_format ||
      'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',

    // AuthnContext
    authnContext: providerConfig.saml_authn_context ||
      'urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport',

    // Validation options
    validateInResponseTo: 'always',
    requestIdExpirationPeriodMs: 300000, // 5 minutes

    // Don't reject expired certificates (handle manually)
    maxAssertionAgeMs: 300000, // 5 minutes

    // Allow clock skew
    acceptedClockSkewMs: 60000, // 1 minute
  };

  const samlInstance = new SAML(samlConfig);

  // Cache the instance
  samlInstanceCache.set(cacheKey, samlInstance);

  // Clean up old cache entries
  if (samlInstanceCache.size > 100) {
    const oldestKey = samlInstanceCache.keys().next().value;
    samlInstanceCache.delete(oldestKey);
  }

  return samlInstance;
}

/**
 * Generate SAML authentication request
 * @param {string} providerId - Provider UUID
 * @param {object} options - Request options
 * @returns {object} - { url, requestId, state }
 */
export async function generateAuthRequest(providerId, options = {}) {
  // Get provider configuration
  const providerResult = await pool.query(`
    SELECT * FROM sso_identity_providers
    WHERE id = $1 AND is_active = TRUE AND provider_type = 'saml'
  `, [providerId]);

  if (providerResult.rows.length === 0) {
    throw new Error('SAML provider not found or inactive');
  }

  const providerConfig = providerResult.rows[0];
  const saml = getSAMLInstance(providerConfig);

  // Generate request ID and state
  const requestId = `_${uuidv4()}`;
  const state = generateSecureToken(32);
  const relayState = options.relayState || state;

  // Create auth request
  const authUrl = await new Promise((resolve, reject) => {
    saml.getAuthorizeUrl({
      host: new URL(getBaseUrl()).host,
      protocol: new URL(getBaseUrl()).protocol.replace(':', ''),
      id: requestId,
      ...options
    }, (err, url) => {
      if (err) reject(err);
      else resolve(url);
    });
  });

  // Store auth request for validation
  const expiresAt = new Date(Date.now() + 300000); // 5 minutes

  await pool.query(`
    INSERT INTO sso_auth_requests (
      provider_id,
      request_id,
      state,
      relay_state,
      ip_address,
      user_agent,
      expires_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
  `, [
    providerId,
    requestId,
    state,
    relayState,
    options.ipAddress,
    options.userAgent,
    expiresAt
  ]);

  // Log auth initiation
  await pool.query(`
    INSERT INTO sso_audit_log (
      organization_id,
      provider_id,
      event_type,
      event_status,
      ip_address,
      user_agent,
      metadata
    ) VALUES ($1, $2, 'login_initiated', 'success', $3, $4, $5)
  `, [
    providerConfig.organization_id,
    providerId,
    options.ipAddress,
    options.userAgent,
    JSON.stringify({ request_id: requestId })
  ]);

  return {
    url: authUrl,
    requestId,
    state: relayState
  };
}

/**
 * Process SAML response (callback)
 * @param {string} providerId - Provider UUID
 * @param {object} samlResponse - SAML response data
 * @param {object} options - Processing options
 * @returns {object} - { user, session, token }
 */
export async function processSAMLResponse(providerId, samlResponse, options = {}) {
  // Get provider configuration
  const providerResult = await pool.query(`
    SELECT * FROM sso_identity_providers
    WHERE id = $1 AND is_active = TRUE AND provider_type = 'saml'
  `, [providerId]);

  if (providerResult.rows.length === 0) {
    throw new Error('SAML provider not found or inactive');
  }

  const providerConfig = providerResult.rows[0];
  const saml = getSAMLInstance(providerConfig);

  // Validate SAML response
  let profile;
  try {
    const result = await saml.validatePostResponse(samlResponse);
    profile = result.profile;
  } catch (error) {
    // Log failure
    await pool.query(`
      INSERT INTO sso_audit_log (
        organization_id,
        provider_id,
        event_type,
        event_status,
        error_code,
        error_message,
        ip_address,
        user_agent,
        metadata
      ) VALUES ($1, $2, 'login_failed', 'failure', $3, $4, $5, $6, $7)
    `, [
      providerConfig.organization_id,
      providerId,
      'SAML_VALIDATION_ERROR',
      error.message,
      options.ipAddress,
      options.userAgent,
      JSON.stringify({ error_details: error.message })
    ]);

    throw new Error(`SAML validation failed: ${error.message}`);
  }

  // Verify request ID if RelayState was used
  if (options.relayState) {
    const requestResult = await pool.query(`
      SELECT * FROM sso_auth_requests
      WHERE provider_id = $1 AND state = $2 AND status = 'pending' AND expires_at > NOW()
    `, [providerId, options.relayState]);

    if (requestResult.rows.length === 0) {
      throw new Error('Invalid or expired authentication request');
    }

    // Mark request as completed
    await pool.query(`
      UPDATE sso_auth_requests
      SET status = 'completed', completed_at = NOW()
      WHERE id = $1
    `, [requestResult.rows[0].id]);
  }

  // Map SAML attributes to user fields
  const rawAttributes = {
    ...profile,
    nameID: profile.nameID,
    nameIDFormat: profile.nameIDFormat,
    sessionIndex: profile.sessionIndex
  };

  const mappedAttributes = mapAttributes(
    rawAttributes,
    providerConfig.attribute_mapping,
    'saml',
    providerConfig.provider_vendor
  );

  // Validate mapped attributes
  const validation = validateMappedAttributes(mappedAttributes);
  if (!validation.valid) {
    await pool.query(`
      INSERT INTO sso_audit_log (
        organization_id,
        provider_id,
        event_type,
        event_status,
        error_code,
        error_message,
        ip_address,
        user_agent,
        metadata
      ) VALUES ($1, $2, 'attribute_mapping_error', 'failure', $3, $4, $5, $6, $7)
    `, [
      providerConfig.organization_id,
      providerId,
      'ATTRIBUTE_MAPPING_ERROR',
      validation.errors.join('; '),
      options.ipAddress,
      options.userAgent,
      JSON.stringify({ raw_attributes: rawAttributes, errors: validation.errors })
    ]);

    throw new Error(`Attribute mapping failed: ${validation.errors.join('; ')}`);
  }

  // Provision or link user
  const { user, identity, created, updated } = await provisionUser({
    providerId,
    externalId: profile.nameID || mappedAttributes.email,
    mappedAttributes,
    providerConfig,
    ipAddress: options.ipAddress,
    userAgent: options.userAgent
  });

  // Create SSO session
  const sessionResult = await pool.query(`
    INSERT INTO sso_sessions (
      user_id,
      identity_id,
      provider_id,
      session_index,
      name_id,
      saml_session_not_on_or_after,
      ip_address,
      user_agent,
      expires_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `, [
    user.id,
    identity.id,
    providerId,
    profile.sessionIndex,
    profile.nameID,
    profile.sessionNotOnOrAfter,
    options.ipAddress,
    options.userAgent,
    new Date(Date.now() + (providerConfig.session_duration_minutes || 480) * 60000)
  ]);

  const session = sessionResult.rows[0];

  return {
    user,
    identity,
    session,
    created,
    updated,
    rawProfile: profile
  };
}

/**
 * Generate SAML logout request
 * @param {string} sessionId - SSO session UUID
 * @param {object} options - Logout options
 * @returns {object} - { url, requestId }
 */
export async function generateLogoutRequest(sessionId, options = {}) {
  // Get session and provider info
  const sessionResult = await pool.query(`
    SELECT s.*, p.*
    FROM sso_sessions s
    JOIN sso_identity_providers p ON s.provider_id = p.id
    WHERE s.id = $1 AND s.is_active = TRUE
  `, [sessionId]);

  if (sessionResult.rows.length === 0) {
    throw new Error('SSO session not found');
  }

  const session = sessionResult.rows[0];

  if (!session.saml_slo_url) {
    // No SLO URL configured, just terminate locally
    await terminateSession(sessionId, 'logout');
    return { url: null, localOnly: true };
  }

  const saml = getSAMLInstance(session);

  const logoutUrl = await new Promise((resolve, reject) => {
    saml.getLogoutUrl({
      user: {
        nameID: session.name_id,
        sessionIndex: session.session_index
      }
    }, {}, (err, url) => {
      if (err) reject(err);
      else resolve(url);
    });
  });

  // Log logout initiation
  await pool.query(`
    INSERT INTO sso_audit_log (
      organization_id,
      user_id,
      provider_id,
      event_type,
      event_status,
      ip_address,
      user_agent,
      metadata
    ) VALUES ($1, $2, $3, 'logout_initiated', 'success', $4, $5, $6)
  `, [
    session.organization_id,
    session.user_id,
    session.provider_id,
    options.ipAddress,
    options.userAgent,
    JSON.stringify({ session_id: sessionId })
  ]);

  return { url: logoutUrl, localOnly: false };
}

/**
 * Process SAML logout response
 */
export async function processSAMLLogoutResponse(providerId, samlResponse, options = {}) {
  const providerResult = await pool.query(`
    SELECT * FROM sso_identity_providers
    WHERE id = $1 AND provider_type = 'saml'
  `, [providerId]);

  if (providerResult.rows.length === 0) {
    throw new Error('SAML provider not found');
  }

  const providerConfig = providerResult.rows[0];
  const saml = getSAMLInstance(providerConfig);

  // Validate logout response
  try {
    await saml.validateLogoutResponse(samlResponse);
  } catch (error) {
    console.error('SAML logout validation error:', error);
    // Continue with local logout even if validation fails
  }

  // Terminate all active sessions for this provider and user
  if (options.nameID) {
    await pool.query(`
      UPDATE sso_sessions
      SET is_active = FALSE,
          terminated_at = NOW(),
          termination_reason = 'logout'
      WHERE provider_id = $1
        AND name_id = $2
        AND is_active = TRUE
    `, [providerId, options.nameID]);
  }

  return { success: true };
}

/**
 * Generate SP metadata XML
 * @param {string} providerId - Provider UUID
 * @returns {string} - SAML metadata XML
 */
export async function generateMetadata(providerId) {
  const providerResult = await pool.query(`
    SELECT * FROM sso_identity_providers
    WHERE id = $1 AND provider_type = 'saml'
  `, [providerId]);

  if (providerResult.rows.length === 0) {
    throw new Error('SAML provider not found');
  }

  const providerConfig = providerResult.rows[0];
  const saml = getSAMLInstance(providerConfig);

  const metadata = saml.generateServiceProviderMetadata();
  return metadata;
}

/**
 * Terminate an SSO session
 */
async function terminateSession(sessionId, reason) {
  await pool.query(`
    UPDATE sso_sessions
    SET is_active = FALSE,
        terminated_at = NOW(),
        termination_reason = $1
    WHERE id = $2
  `, [reason, sessionId]);
}

/**
 * Fetch and parse IdP metadata from URL
 * @param {string} metadataUrl - IdP metadata URL
 * @returns {object} - Parsed metadata
 */
export async function fetchIdPMetadata(metadataUrl) {
  const response = await fetch(metadataUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch IdP metadata: ${response.status}`);
  }

  const xml = await response.text();
  // Parse metadata XML and extract relevant fields
  // This is a simplified version - in production, use proper XML parsing

  const metadata = {
    entityId: extractXMLValue(xml, 'entityID'),
    ssoUrl: extractXMLValue(xml, 'SingleSignOnService', 'Location'),
    sloUrl: extractXMLValue(xml, 'SingleLogoutService', 'Location'),
    certificate: extractCertificate(xml)
  };

  return metadata;
}

// Helper functions for XML extraction (simplified)
function extractXMLValue(xml, elementName, attribute = null) {
  const regex = attribute
    ? new RegExp(`<[^>]*${elementName}[^>]*${attribute}="([^"]*)"`, 'i')
    : new RegExp(`${elementName}="([^"]*)"`, 'i');

  const match = xml.match(regex);
  return match ? match[1] : null;
}

function extractCertificate(xml) {
  const match = xml.match(/<ds:X509Certificate>([^<]+)<\/ds:X509Certificate>/i) ||
    xml.match(/<X509Certificate>([^<]+)<\/X509Certificate>/i);
  return match ? match[1].replace(/\s/g, '') : null;
}

export default {
  getSAMLInstance,
  generateAuthRequest,
  processSAMLResponse,
  generateLogoutRequest,
  processSAMLLogoutResponse,
  generateMetadata,
  fetchIdPMetadata
};
