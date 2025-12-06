/**
 * OpenID Connect (OIDC) / OAuth 2.0 Provider Service
 * Handles OIDC authentication flows for enterprise SSO
 */

import { Issuer, generators } from 'openid-client';
import { pool } from '../../db/pg-init.js';
import { config } from '../../config.js';
import { mapAttributes, validateMappedAttributes } from './attributeMapper.js';
import { provisionUser } from './jitProvisioning.js';
import { encrypt, decrypt, generateSecureToken, generateNonce, generatePKCE } from './encryption.js';

// Cache for OIDC client instances
const oidcClientCache = new Map();

/**
 * Get the base URL for callbacks
 */
function getBaseUrl() {
  return process.env.SSO_BASE_URL || config.CLIENT_URL || 'http://localhost:3001';
}

/**
 * Get or create an OIDC client for a provider
 * @param {object} providerConfig - Provider configuration from database
 * @returns {Promise<Client>} - OIDC Client instance
 */
export async function getOIDCClient(providerConfig) {
  const cacheKey = `${providerConfig.id}-${providerConfig.updated_at}`;

  if (oidcClientCache.has(cacheKey)) {
    return oidcClientCache.get(cacheKey);
  }

  let issuer;

  // Try to discover issuer from well-known endpoint
  if (providerConfig.oauth_issuer) {
    try {
      issuer = await Issuer.discover(providerConfig.oauth_issuer);
    } catch (error) {
      console.warn('OIDC discovery failed, using manual configuration:', error.message);
    }
  }

  // Fallback to manual configuration
  if (!issuer) {
    issuer = new Issuer({
      issuer: providerConfig.oauth_issuer || providerConfig.id,
      authorization_endpoint: providerConfig.oauth_authorization_url,
      token_endpoint: providerConfig.oauth_token_url,
      userinfo_endpoint: providerConfig.oauth_userinfo_url,
      jwks_uri: providerConfig.oauth_jwks_url,
      end_session_endpoint: providerConfig.oauth_end_session_url
    });
  }

  const baseUrl = getBaseUrl();

  // Create client
  const client = new issuer.Client({
    client_id: providerConfig.oauth_client_id,
    client_secret: providerConfig.oauth_client_secret_encrypted
      ? decrypt(providerConfig.oauth_client_secret_encrypted)
      : null,
    redirect_uris: [`${baseUrl}/api/sso/oidc/${providerConfig.id}/callback`],
    post_logout_redirect_uris: [`${baseUrl}/api/sso/oidc/${providerConfig.id}/logout-callback`],
    response_types: [providerConfig.oauth_response_type || 'code'],
    token_endpoint_auth_method: providerConfig.oauth_client_secret_encrypted
      ? 'client_secret_post'
      : 'none'
  });

  // Cache the client
  oidcClientCache.set(cacheKey, client);

  // Clean up old cache entries
  if (oidcClientCache.size > 100) {
    const oldestKey = oidcClientCache.keys().next().value;
    oidcClientCache.delete(oldestKey);
  }

  return client;
}

/**
 * Generate OIDC authentication URL
 * @param {string} providerId - Provider UUID
 * @param {object} options - Request options
 * @returns {object} - { url, state, nonce, codeVerifier }
 */
export async function generateAuthUrl(providerId, options = {}) {
  // Get provider configuration
  const providerResult = await pool.query(`
    SELECT * FROM sso_identity_providers
    WHERE id = $1 AND is_active = TRUE AND provider_type IN ('oidc', 'oauth2')
  `, [providerId]);

  if (providerResult.rows.length === 0) {
    throw new Error('OIDC provider not found or inactive');
  }

  const providerConfig = providerResult.rows[0];
  const client = await getOIDCClient(providerConfig);

  // Generate security parameters
  const state = generateSecureToken(32);
  const nonce = generateNonce();

  // Generate PKCE if enabled
  let codeVerifier = null;
  let codeChallenge = null;
  if (providerConfig.oauth_pkce_enabled !== false) {
    const pkce = generatePKCE();
    codeVerifier = pkce.codeVerifier;
    codeChallenge = pkce.codeChallenge;
  }

  // Build authorization URL
  const baseUrl = getBaseUrl();
  const authParams = {
    scope: (providerConfig.oauth_scopes || ['openid', 'profile', 'email']).join(' '),
    state,
    nonce,
    redirect_uri: `${baseUrl}/api/sso/oidc/${providerConfig.id}/callback`
  };

  // Add PKCE parameters if enabled
  if (codeChallenge) {
    authParams.code_challenge = codeChallenge;
    authParams.code_challenge_method = 'S256';
  }

  // Add optional parameters
  if (options.prompt) authParams.prompt = options.prompt;
  if (options.loginHint) authParams.login_hint = options.loginHint;
  if (options.acrValues) authParams.acr_values = options.acrValues;

  const authUrl = client.authorizationUrl(authParams);

  // Store auth request for validation
  const expiresAt = new Date(Date.now() + 600000); // 10 minutes

  await pool.query(`
    INSERT INTO sso_auth_requests (
      provider_id,
      request_id,
      state,
      nonce,
      code_verifier,
      redirect_uri,
      ip_address,
      user_agent,
      expires_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
  `, [
    providerId,
    state, // Use state as request_id for OIDC
    state,
    nonce,
    codeVerifier,
    authParams.redirect_uri,
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
    JSON.stringify({ state })
  ]);

  return {
    url: authUrl,
    state,
    nonce,
    codeVerifier
  };
}

/**
 * Process OIDC callback
 * @param {string} providerId - Provider UUID
 * @param {object} callbackParams - Callback query parameters
 * @param {object} options - Processing options
 * @returns {object} - { user, session, tokens }
 */
export async function processCallback(providerId, callbackParams, options = {}) {
  // Get provider configuration
  const providerResult = await pool.query(`
    SELECT * FROM sso_identity_providers
    WHERE id = $1 AND is_active = TRUE AND provider_type IN ('oidc', 'oauth2')
  `, [providerId]);

  if (providerResult.rows.length === 0) {
    throw new Error('OIDC provider not found or inactive');
  }

  const providerConfig = providerResult.rows[0];

  // Verify state and get stored request
  const requestResult = await pool.query(`
    SELECT * FROM sso_auth_requests
    WHERE provider_id = $1 AND state = $2 AND status = 'pending' AND expires_at > NOW()
  `, [providerId, callbackParams.state]);

  if (requestResult.rows.length === 0) {
    await logAuthFailure(providerConfig, 'INVALID_STATE', 'Invalid or expired state parameter', options);
    throw new Error('Invalid or expired authentication request');
  }

  const authRequest = requestResult.rows[0];

  // Mark request as completed
  await pool.query(`
    UPDATE sso_auth_requests
    SET status = 'completed', completed_at = NOW()
    WHERE id = $1
  `, [authRequest.id]);

  // Handle error response
  if (callbackParams.error) {
    await logAuthFailure(
      providerConfig,
      callbackParams.error,
      callbackParams.error_description || callbackParams.error,
      options
    );
    throw new Error(`Authentication failed: ${callbackParams.error_description || callbackParams.error}`);
  }

  const client = await getOIDCClient(providerConfig);
  const baseUrl = getBaseUrl();

  // Exchange code for tokens
  let tokenSet;
  try {
    const tokenParams = {
      code: callbackParams.code,
      redirect_uri: `${baseUrl}/api/sso/oidc/${providerConfig.id}/callback`
    };

    // Add PKCE verifier if present
    if (authRequest.code_verifier) {
      tokenParams.code_verifier = authRequest.code_verifier;
    }

    tokenSet = await client.callback(
      `${baseUrl}/api/sso/oidc/${providerConfig.id}/callback`,
      callbackParams,
      {
        state: callbackParams.state,
        nonce: authRequest.nonce,
        code_verifier: authRequest.code_verifier
      }
    );
  } catch (error) {
    await logAuthFailure(providerConfig, 'TOKEN_ERROR', error.message, options);
    throw new Error(`Token exchange failed: ${error.message}`);
  }

  // Get user info
  let userInfo;
  try {
    userInfo = await client.userinfo(tokenSet.access_token);
  } catch (error) {
    // Try to get info from ID token claims
    if (tokenSet.claims && tokenSet.claims()) {
      userInfo = tokenSet.claims();
    } else {
      await logAuthFailure(providerConfig, 'USERINFO_ERROR', error.message, options);
      throw new Error(`Failed to get user info: ${error.message}`);
    }
  }

  // Map attributes
  const rawAttributes = {
    ...userInfo,
    ...(tokenSet.claims ? tokenSet.claims() : {})
  };

  const mappedAttributes = mapAttributes(
    rawAttributes,
    providerConfig.attribute_mapping,
    providerConfig.provider_type,
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
  const externalId = userInfo.sub || userInfo.id || mappedAttributes.email;

  const { user, identity, created, updated } = await provisionUser({
    providerId,
    externalId,
    mappedAttributes,
    providerConfig,
    ipAddress: options.ipAddress,
    userAgent: options.userAgent
  });

  // Create SSO session with tokens
  const sessionResult = await pool.query(`
    INSERT INTO sso_sessions (
      user_id,
      identity_id,
      provider_id,
      access_token_encrypted,
      refresh_token_encrypted,
      id_token,
      token_expires_at,
      ip_address,
      user_agent,
      expires_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *
  `, [
    user.id,
    identity.id,
    providerId,
    tokenSet.access_token ? encrypt(tokenSet.access_token) : null,
    tokenSet.refresh_token ? encrypt(tokenSet.refresh_token) : null,
    tokenSet.id_token,
    tokenSet.expires_at ? new Date(tokenSet.expires_at * 1000) : null,
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
    tokenSet: {
      accessToken: tokenSet.access_token,
      refreshToken: tokenSet.refresh_token,
      idToken: tokenSet.id_token,
      expiresAt: tokenSet.expires_at
    }
  };
}

/**
 * Refresh access token
 * @param {string} sessionId - SSO session UUID
 * @returns {object} - { accessToken, expiresAt }
 */
export async function refreshToken(sessionId) {
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

  if (!session.refresh_token_encrypted) {
    throw new Error('No refresh token available');
  }

  const refreshToken = decrypt(session.refresh_token_encrypted);
  const client = await getOIDCClient(session);

  try {
    const tokenSet = await client.refresh(refreshToken);

    // Update session with new tokens
    await pool.query(`
      UPDATE sso_sessions
      SET access_token_encrypted = $1,
          refresh_token_encrypted = COALESCE($2, refresh_token_encrypted),
          token_expires_at = $3
      WHERE id = $4
    `, [
      encrypt(tokenSet.access_token),
      tokenSet.refresh_token ? encrypt(tokenSet.refresh_token) : null,
      tokenSet.expires_at ? new Date(tokenSet.expires_at * 1000) : null,
      sessionId
    ]);

    // Log token refresh
    await pool.query(`
      INSERT INTO sso_audit_log (
        organization_id,
        user_id,
        provider_id,
        event_type,
        event_status,
        metadata
      ) VALUES ($1, $2, $3, 'token_refresh', 'success', $4)
    `, [
      session.organization_id,
      session.user_id,
      session.provider_id,
      JSON.stringify({ session_id: sessionId })
    ]);

    return {
      accessToken: tokenSet.access_token,
      expiresAt: tokenSet.expires_at
    };
  } catch (error) {
    // Mark session as invalid
    await pool.query(`
      UPDATE sso_sessions
      SET is_active = FALSE,
          terminated_at = NOW(),
          termination_reason = 'token_revoked'
      WHERE id = $1
    `, [sessionId]);

    throw new Error(`Token refresh failed: ${error.message}`);
  }
}

/**
 * Generate logout URL
 * @param {string} sessionId - SSO session UUID
 * @param {object} options - Logout options
 * @returns {object} - { url, localOnly }
 */
export async function generateLogoutUrl(sessionId, options = {}) {
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
  const client = await getOIDCClient(session);

  // Terminate local session
  await pool.query(`
    UPDATE sso_sessions
    SET is_active = FALSE,
        terminated_at = NOW(),
        termination_reason = 'logout'
    WHERE id = $1
  `, [sessionId]);

  // Check if IdP supports end session
  if (!client.issuer.end_session_endpoint) {
    return { url: null, localOnly: true };
  }

  const baseUrl = getBaseUrl();
  const logoutUrl = client.endSessionUrl({
    id_token_hint: session.id_token,
    post_logout_redirect_uri: `${baseUrl}/api/sso/oidc/${session.provider_id}/logout-callback`
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
 * Log authentication failure
 */
async function logAuthFailure(providerConfig, errorCode, errorMessage, options) {
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
    providerConfig.id,
    errorCode,
    errorMessage,
    options.ipAddress,
    options.userAgent,
    JSON.stringify({ error_code: errorCode })
  ]);
}

/**
 * Discover OIDC issuer configuration
 * @param {string} issuerUrl - Issuer URL or well-known URL
 * @returns {object} - Discovered configuration
 */
export async function discoverIssuer(issuerUrl) {
  try {
    const issuer = await Issuer.discover(issuerUrl);

    return {
      issuer: issuer.metadata.issuer,
      authorizationUrl: issuer.metadata.authorization_endpoint,
      tokenUrl: issuer.metadata.token_endpoint,
      userinfoUrl: issuer.metadata.userinfo_endpoint,
      jwksUrl: issuer.metadata.jwks_uri,
      endSessionUrl: issuer.metadata.end_session_endpoint,
      scopes: issuer.metadata.scopes_supported,
      responseTypes: issuer.metadata.response_types_supported,
      grantTypes: issuer.metadata.grant_types_supported
    };
  } catch (error) {
    throw new Error(`OIDC discovery failed: ${error.message}`);
  }
}

export default {
  getOIDCClient,
  generateAuthUrl,
  processCallback,
  refreshToken,
  generateLogoutUrl,
  discoverIssuer
};
