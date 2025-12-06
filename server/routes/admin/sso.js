/**
 * Admin SSO Configuration API
 * Endpoints for managing SSO providers, domains, and settings
 */

import express from 'express';
import { pool } from '../../db/pg-init.js';
import { authenticateToken, requireAdmin } from '../../middleware/auth.js';
import { requireSSOAdmin } from '../../middleware/ssoAuth.js';
import { encrypt, decrypt, generateSecureToken, hashValue } from '../../services/sso/encryption.js';
import { samlProvider, oidcProvider } from '../../services/sso/index.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// ============================================================================
// Identity Provider Management
// ============================================================================

/**
 * GET /api/admin/sso/providers
 * List all SSO providers for the user's organization
 */
router.get('/providers', async (req, res) => {
  try {
    const organizationId = req.user.organization_id;

    const result = await pool.query(`
      SELECT id, name, display_name, provider_type, provider_vendor,
             is_active, is_primary, priority, jit_enabled, jit_default_role,
             allowed_domains, created_at, updated_at
      FROM sso_identity_providers
      WHERE organization_id = $1
      ORDER BY is_primary DESC, priority ASC
    `, [organizationId]);

    res.json({ providers: result.rows });
  } catch (error) {
    console.error('List providers error:', error);
    res.status(500).json({ error: 'Failed to list SSO providers' });
  }
});

/**
 * GET /api/admin/sso/providers/:providerId
 * Get detailed provider configuration
 */
router.get('/providers/:providerId', async (req, res) => {
  try {
    const { providerId } = req.params;
    const organizationId = req.user.organization_id;

    const result = await pool.query(`
      SELECT * FROM sso_identity_providers
      WHERE id = $1 AND organization_id = $2
    `, [providerId, organizationId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    const provider = result.rows[0];

    // Don't expose encrypted secrets
    delete provider.oauth_client_secret_encrypted;

    // Mask certificate for display
    if (provider.saml_certificate) {
      provider.saml_certificate_preview = provider.saml_certificate.substring(0, 50) + '...';
      delete provider.saml_certificate;
    }

    res.json({ provider });
  } catch (error) {
    console.error('Get provider error:', error);
    res.status(500).json({ error: 'Failed to get SSO provider' });
  }
});

/**
 * POST /api/admin/sso/providers
 * Create a new SSO provider
 */
router.post('/providers', requireAdmin, async (req, res) => {
  try {
    const organizationId = req.user.organization_id;
    const {
      name,
      display_name,
      provider_type,
      provider_vendor,
      is_primary,
      priority,
      // SAML config
      saml_entity_id,
      saml_sso_url,
      saml_slo_url,
      saml_certificate,
      saml_metadata_url,
      saml_signature_algorithm,
      saml_name_id_format,
      saml_want_assertions_signed,
      saml_want_response_signed,
      // OIDC/OAuth config
      oauth_client_id,
      oauth_client_secret,
      oauth_issuer,
      oauth_authorization_url,
      oauth_token_url,
      oauth_userinfo_url,
      oauth_jwks_url,
      oauth_scopes,
      oauth_pkce_enabled,
      // JIT settings
      jit_enabled,
      jit_default_role,
      jit_update_on_login,
      jit_auto_activate,
      // Attribute and group mapping
      attribute_mapping,
      group_mapping,
      allowed_domains,
      // Session settings
      session_duration_minutes
    } = req.body;

    // Validate required fields
    if (!name || !provider_type) {
      return res.status(400).json({ error: 'Name and provider type are required' });
    }

    // If SAML and metadata URL provided, fetch metadata
    let samlConfig = {};
    if (provider_type === 'saml' && saml_metadata_url) {
      try {
        const metadata = await samlProvider.fetchIdPMetadata(saml_metadata_url);
        samlConfig = {
          saml_entity_id: saml_entity_id || metadata.entityId,
          saml_sso_url: saml_sso_url || metadata.ssoUrl,
          saml_slo_url: saml_slo_url || metadata.sloUrl,
          saml_certificate: saml_certificate || metadata.certificate
        };
      } catch (error) {
        console.warn('Failed to fetch IdP metadata:', error);
        // Continue with manual config
      }
    }

    // If OIDC and issuer provided, discover configuration
    let oidcConfig = {};
    if ((provider_type === 'oidc' || provider_type === 'oauth2') && oauth_issuer) {
      try {
        const discovered = await oidcProvider.discoverIssuer(oauth_issuer);
        oidcConfig = {
          oauth_authorization_url: oauth_authorization_url || discovered.authorizationUrl,
          oauth_token_url: oauth_token_url || discovered.tokenUrl,
          oauth_userinfo_url: oauth_userinfo_url || discovered.userinfoUrl,
          oauth_jwks_url: oauth_jwks_url || discovered.jwksUrl
        };
      } catch (error) {
        console.warn('Failed to discover OIDC issuer:', error);
        // Continue with manual config
      }
    }

    const result = await pool.query(`
      INSERT INTO sso_identity_providers (
        organization_id,
        name,
        display_name,
        provider_type,
        provider_vendor,
        is_primary,
        priority,
        saml_entity_id,
        saml_sso_url,
        saml_slo_url,
        saml_certificate,
        saml_metadata_url,
        saml_signature_algorithm,
        saml_name_id_format,
        saml_want_assertions_signed,
        saml_want_response_signed,
        oauth_client_id,
        oauth_client_secret_encrypted,
        oauth_issuer,
        oauth_authorization_url,
        oauth_token_url,
        oauth_userinfo_url,
        oauth_jwks_url,
        oauth_scopes,
        oauth_pkce_enabled,
        jit_enabled,
        jit_default_role,
        jit_update_on_login,
        jit_auto_activate,
        attribute_mapping,
        group_mapping,
        allowed_domains,
        session_duration_minutes,
        created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
        $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
        $31, $32, $33, $34
      )
      RETURNING id, name, display_name, provider_type, provider_vendor, is_active
    `, [
      organizationId,
      name,
      display_name || name,
      provider_type,
      provider_vendor,
      is_primary || false,
      priority || 0,
      samlConfig.saml_entity_id || saml_entity_id,
      samlConfig.saml_sso_url || saml_sso_url,
      samlConfig.saml_slo_url || saml_slo_url,
      samlConfig.saml_certificate || saml_certificate,
      saml_metadata_url,
      saml_signature_algorithm || 'sha256',
      saml_name_id_format || 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
      saml_want_assertions_signed !== false,
      saml_want_response_signed !== false,
      oauth_client_id,
      oauth_client_secret ? encrypt(oauth_client_secret) : null,
      oauth_issuer,
      oidcConfig.oauth_authorization_url || oauth_authorization_url,
      oidcConfig.oauth_token_url || oauth_token_url,
      oidcConfig.oauth_userinfo_url || oauth_userinfo_url,
      oidcConfig.oauth_jwks_url || oauth_jwks_url,
      oauth_scopes || ['openid', 'profile', 'email'],
      oauth_pkce_enabled !== false,
      jit_enabled !== false,
      jit_default_role || 'employee',
      jit_update_on_login !== false,
      jit_auto_activate !== false,
      JSON.stringify(attribute_mapping || {}),
      JSON.stringify(group_mapping || {}),
      allowed_domains || [],
      session_duration_minutes || 480,
      req.user.id
    ]);

    // Log provider creation
    await pool.query(`
      INSERT INTO sso_audit_log (
        organization_id,
        user_id,
        provider_id,
        event_type,
        event_status,
        metadata
      ) VALUES ($1, $2, $3, 'provider_configured', 'success', $4)
    `, [
      organizationId,
      req.user.id,
      result.rows[0].id,
      JSON.stringify({ name, provider_type })
    ]);

    res.status(201).json({
      message: 'SSO provider created successfully',
      provider: result.rows[0]
    });
  } catch (error) {
    console.error('Create provider error:', error);
    res.status(500).json({ error: 'Failed to create SSO provider' });
  }
});

/**
 * PUT /api/admin/sso/providers/:providerId
 * Update SSO provider configuration
 */
router.put('/providers/:providerId', requireAdmin, async (req, res) => {
  try {
    const { providerId } = req.params;
    const organizationId = req.user.organization_id;
    const updates = req.body;

    // Verify provider belongs to organization
    const checkResult = await pool.query(`
      SELECT id FROM sso_identity_providers
      WHERE id = $1 AND organization_id = $2
    `, [providerId, organizationId]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    // Build dynamic update query
    const allowedFields = [
      'name', 'display_name', 'is_active', 'is_primary', 'priority',
      'saml_entity_id', 'saml_sso_url', 'saml_slo_url', 'saml_certificate',
      'saml_metadata_url', 'saml_signature_algorithm', 'saml_name_id_format',
      'saml_want_assertions_signed', 'saml_want_response_signed',
      'oauth_client_id', 'oauth_issuer', 'oauth_authorization_url',
      'oauth_token_url', 'oauth_userinfo_url', 'oauth_jwks_url',
      'oauth_scopes', 'oauth_pkce_enabled',
      'jit_enabled', 'jit_default_role', 'jit_update_on_login', 'jit_auto_activate',
      'attribute_mapping', 'group_mapping', 'allowed_domains',
      'session_duration_minutes', 'force_reauthentication'
    ];

    const setClauses = [];
    const values = [];
    let paramIndex = 1;

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        let value = updates[field];

        // Handle JSON fields
        if (['attribute_mapping', 'group_mapping'].includes(field)) {
          value = JSON.stringify(value);
        }

        setClauses.push(`${field} = $${paramIndex++}`);
        values.push(value);
      }
    }

    // Handle client secret separately (encrypted)
    if (updates.oauth_client_secret) {
      setClauses.push(`oauth_client_secret_encrypted = $${paramIndex++}`);
      values.push(encrypt(updates.oauth_client_secret));
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    setClauses.push(`updated_by = $${paramIndex++}`);
    values.push(req.user.id);

    setClauses.push(`updated_at = NOW()`);

    values.push(providerId);

    const result = await pool.query(`
      UPDATE sso_identity_providers
      SET ${setClauses.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, name, display_name, is_active
    `, values);

    // Log provider update
    await pool.query(`
      INSERT INTO sso_audit_log (
        organization_id,
        user_id,
        provider_id,
        event_type,
        event_status,
        metadata
      ) VALUES ($1, $2, $3, 'provider_updated', 'success', $4)
    `, [
      organizationId,
      req.user.id,
      providerId,
      JSON.stringify({ updated_fields: Object.keys(updates) })
    ]);

    res.json({
      message: 'SSO provider updated successfully',
      provider: result.rows[0]
    });
  } catch (error) {
    console.error('Update provider error:', error);
    res.status(500).json({ error: 'Failed to update SSO provider' });
  }
});

/**
 * POST /api/admin/sso/providers/:providerId/activate
 * Activate an SSO provider
 */
router.post('/providers/:providerId/activate', requireAdmin, async (req, res) => {
  try {
    const { providerId } = req.params;
    const organizationId = req.user.organization_id;

    const result = await pool.query(`
      UPDATE sso_identity_providers
      SET is_active = TRUE, updated_at = NOW(), updated_by = $1
      WHERE id = $2 AND organization_id = $3
      RETURNING id, name, is_active
    `, [req.user.id, providerId, organizationId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    // Log activation
    await pool.query(`
      INSERT INTO sso_audit_log (
        organization_id, user_id, provider_id,
        event_type, event_status, metadata
      ) VALUES ($1, $2, $3, 'provider_activated', 'success', '{}')
    `, [organizationId, req.user.id, providerId]);

    res.json({ message: 'SSO provider activated', provider: result.rows[0] });
  } catch (error) {
    console.error('Activate provider error:', error);
    res.status(500).json({ error: 'Failed to activate SSO provider' });
  }
});

/**
 * POST /api/admin/sso/providers/:providerId/deactivate
 * Deactivate an SSO provider
 */
router.post('/providers/:providerId/deactivate', requireAdmin, async (req, res) => {
  try {
    const { providerId } = req.params;
    const organizationId = req.user.organization_id;

    const result = await pool.query(`
      UPDATE sso_identity_providers
      SET is_active = FALSE, updated_at = NOW(), updated_by = $1
      WHERE id = $2 AND organization_id = $3
      RETURNING id, name, is_active
    `, [req.user.id, providerId, organizationId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    // Log deactivation
    await pool.query(`
      INSERT INTO sso_audit_log (
        organization_id, user_id, provider_id,
        event_type, event_status, metadata
      ) VALUES ($1, $2, $3, 'provider_deactivated', 'success', '{}')
    `, [organizationId, req.user.id, providerId]);

    res.json({ message: 'SSO provider deactivated', provider: result.rows[0] });
  } catch (error) {
    console.error('Deactivate provider error:', error);
    res.status(500).json({ error: 'Failed to deactivate SSO provider' });
  }
});

/**
 * DELETE /api/admin/sso/providers/:providerId
 * Delete an SSO provider
 */
router.delete('/providers/:providerId', requireAdmin, async (req, res) => {
  try {
    const { providerId } = req.params;
    const organizationId = req.user.organization_id;

    // Check for active user identities
    const identitiesResult = await pool.query(`
      SELECT COUNT(*) as count FROM sso_user_identities
      WHERE provider_id = $1 AND is_active = TRUE
    `, [providerId]);

    if (parseInt(identitiesResult.rows[0].count, 10) > 0) {
      return res.status(400).json({
        error: 'Cannot delete provider with active user identities',
        active_identities: parseInt(identitiesResult.rows[0].count, 10)
      });
    }

    const result = await pool.query(`
      DELETE FROM sso_identity_providers
      WHERE id = $1 AND organization_id = $2
      RETURNING id, name
    `, [providerId, organizationId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    res.json({ message: 'SSO provider deleted', provider: result.rows[0] });
  } catch (error) {
    console.error('Delete provider error:', error);
    res.status(500).json({ error: 'Failed to delete SSO provider' });
  }
});

// ============================================================================
// Domain Management
// ============================================================================

/**
 * GET /api/admin/sso/domains
 * List verified domains for the organization
 */
router.get('/domains', async (req, res) => {
  try {
    const organizationId = req.user.organization_id;

    const result = await pool.query(`
      SELECT id, domain, verification_method, is_verified,
             verified_at, expires_at, created_at
      FROM sso_verified_domains
      WHERE organization_id = $1
      ORDER BY is_verified DESC, domain ASC
    `, [organizationId]);

    res.json({ domains: result.rows });
  } catch (error) {
    console.error('List domains error:', error);
    res.status(500).json({ error: 'Failed to list domains' });
  }
});

/**
 * POST /api/admin/sso/domains
 * Add a domain for verification
 */
router.post('/domains', requireAdmin, async (req, res) => {
  try {
    const organizationId = req.user.organization_id;
    const { domain, verification_method = 'dns_txt' } = req.body;

    if (!domain) {
      return res.status(400).json({ error: 'Domain is required' });
    }

    // Normalize domain
    const normalizedDomain = domain.toLowerCase().trim();

    // Check if domain already exists
    const existingResult = await pool.query(`
      SELECT id FROM sso_verified_domains
      WHERE domain = $1
    `, [normalizedDomain]);

    if (existingResult.rows.length > 0) {
      return res.status(400).json({ error: 'Domain is already registered' });
    }

    // Generate verification token
    const verificationToken = generateSecureToken(16);
    const verificationRecord = `conductos-verify=${verificationToken}`;

    const result = await pool.query(`
      INSERT INTO sso_verified_domains (
        organization_id,
        domain,
        verification_method,
        verification_token,
        verification_record,
        expires_at,
        created_by
      ) VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '7 days', $6)
      RETURNING id, domain, verification_method, verification_record, expires_at
    `, [
      organizationId,
      normalizedDomain,
      verification_method,
      verificationToken,
      verificationRecord,
      req.user.id
    ]);

    res.status(201).json({
      message: 'Domain added for verification',
      domain: result.rows[0],
      instructions: getDomainVerificationInstructions(verification_method, verificationRecord)
    });
  } catch (error) {
    console.error('Add domain error:', error);
    res.status(500).json({ error: 'Failed to add domain' });
  }
});

/**
 * POST /api/admin/sso/domains/:domainId/verify
 * Verify a domain
 */
router.post('/domains/:domainId/verify', requireAdmin, async (req, res) => {
  try {
    const { domainId } = req.params;
    const organizationId = req.user.organization_id;

    const domainResult = await pool.query(`
      SELECT * FROM sso_verified_domains
      WHERE id = $1 AND organization_id = $2
    `, [domainId, organizationId]);

    if (domainResult.rows.length === 0) {
      return res.status(404).json({ error: 'Domain not found' });
    }

    const domain = domainResult.rows[0];

    // In production, perform actual DNS verification
    // For now, simulate verification or allow manual verification
    const { manual_verification } = req.body;

    if (manual_verification && req.user.is_super_admin) {
      // Allow super admin to manually verify
      await pool.query(`
        UPDATE sso_verified_domains
        SET is_verified = TRUE,
            verified_at = NOW(),
            verification_method = 'manual'
        WHERE id = $1
      `, [domainId]);

      // Log verification
      await pool.query(`
        INSERT INTO sso_audit_log (
          organization_id, user_id,
          event_type, event_status, metadata
        ) VALUES ($1, $2, 'domain_verified', 'success', $3)
      `, [
        organizationId,
        req.user.id,
        JSON.stringify({ domain: domain.domain, method: 'manual' })
      ]);

      return res.json({ message: 'Domain verified manually', verified: true });
    }

    // TODO: Implement actual DNS verification
    // For now, return instructions
    res.json({
      message: 'Domain verification pending',
      verified: false,
      instructions: getDomainVerificationInstructions(
        domain.verification_method,
        domain.verification_record
      )
    });
  } catch (error) {
    console.error('Verify domain error:', error);
    res.status(500).json({ error: 'Failed to verify domain' });
  }
});

/**
 * DELETE /api/admin/sso/domains/:domainId
 * Remove a domain
 */
router.delete('/domains/:domainId', requireAdmin, async (req, res) => {
  try {
    const { domainId } = req.params;
    const organizationId = req.user.organization_id;

    const result = await pool.query(`
      DELETE FROM sso_verified_domains
      WHERE id = $1 AND organization_id = $2
      RETURNING id, domain
    `, [domainId, organizationId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Domain not found' });
    }

    res.json({ message: 'Domain removed', domain: result.rows[0] });
  } catch (error) {
    console.error('Delete domain error:', error);
    res.status(500).json({ error: 'Failed to delete domain' });
  }
});

// ============================================================================
// SSO Settings and Audit Log
// ============================================================================

/**
 * GET /api/admin/sso/settings
 * Get organization SSO settings
 */
router.get('/settings', async (req, res) => {
  try {
    const organizationId = req.user.organization_id;

    const result = await pool.query(`
      SELECT sso_enabled, sso_enforced, sso_bypass_allowed, sso_settings
      FROM organizations
      WHERE id = $1
    `, [organizationId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    res.json({ settings: result.rows[0] });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to get SSO settings' });
  }
});

/**
 * PUT /api/admin/sso/settings
 * Update organization SSO settings
 */
router.put('/settings', requireAdmin, async (req, res) => {
  try {
    const organizationId = req.user.organization_id;
    const { sso_enabled, sso_enforced, sso_bypass_allowed, sso_settings } = req.body;

    const result = await pool.query(`
      UPDATE organizations
      SET sso_enabled = COALESCE($1, sso_enabled),
          sso_enforced = COALESCE($2, sso_enforced),
          sso_bypass_allowed = COALESCE($3, sso_bypass_allowed),
          sso_settings = COALESCE($4, sso_settings)
      WHERE id = $5
      RETURNING sso_enabled, sso_enforced, sso_bypass_allowed, sso_settings
    `, [
      sso_enabled,
      sso_enforced,
      sso_bypass_allowed,
      sso_settings ? JSON.stringify(sso_settings) : null,
      organizationId
    ]);

    res.json({ message: 'SSO settings updated', settings: result.rows[0] });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update SSO settings' });
  }
});

/**
 * GET /api/admin/sso/audit-log
 * Get SSO audit log
 */
router.get('/audit-log', async (req, res) => {
  try {
    const organizationId = req.user.organization_id;
    const {
      event_type,
      event_status,
      provider_id,
      user_id,
      start_date,
      end_date,
      limit = 50,
      offset = 0
    } = req.query;

    let query = `
      SELECT al.*, u.email as user_email, p.name as provider_name
      FROM sso_audit_log al
      LEFT JOIN users u ON al.user_id = u.id
      LEFT JOIN sso_identity_providers p ON al.provider_id = p.id
      WHERE al.organization_id = $1
    `;
    const params = [organizationId];
    let paramIndex = 2;

    if (event_type) {
      query += ` AND al.event_type = $${paramIndex++}`;
      params.push(event_type);
    }

    if (event_status) {
      query += ` AND al.event_status = $${paramIndex++}`;
      params.push(event_status);
    }

    if (provider_id) {
      query += ` AND al.provider_id = $${paramIndex++}`;
      params.push(provider_id);
    }

    if (user_id) {
      query += ` AND al.user_id = $${paramIndex++}`;
      params.push(user_id);
    }

    if (start_date) {
      query += ` AND al.created_at >= $${paramIndex++}`;
      params.push(start_date);
    }

    if (end_date) {
      query += ` AND al.created_at <= $${paramIndex++}`;
      params.push(end_date);
    }

    query += ` ORDER BY al.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const result = await pool.query(query, params);

    // Get total count
    const countResult = await pool.query(`
      SELECT COUNT(*) FROM sso_audit_log WHERE organization_id = $1
    `, [organizationId]);

    res.json({
      entries: result.rows,
      total: parseInt(countResult.rows[0].count, 10),
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    });
  } catch (error) {
    console.error('Get audit log error:', error);
    res.status(500).json({ error: 'Failed to get SSO audit log' });
  }
});

/**
 * GET /api/admin/sso/user-identities
 * List SSO user identities
 */
router.get('/user-identities', async (req, res) => {
  try {
    const organizationId = req.user.organization_id;
    const { provider_id, is_active, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT si.*, u.email as user_email, u.name as user_name, p.name as provider_name
      FROM sso_user_identities si
      JOIN users u ON si.user_id = u.id
      JOIN sso_identity_providers p ON si.provider_id = p.id
      WHERE p.organization_id = $1
    `;
    const params = [organizationId];
    let paramIndex = 2;

    if (provider_id) {
      query += ` AND si.provider_id = $${paramIndex++}`;
      params.push(provider_id);
    }

    if (is_active !== undefined) {
      query += ` AND si.is_active = $${paramIndex++}`;
      params.push(is_active === 'true');
    }

    query += ` ORDER BY si.last_login_at DESC NULLS LAST LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const result = await pool.query(query, params);

    res.json({
      identities: result.rows,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    });
  } catch (error) {
    console.error('Get user identities error:', error);
    res.status(500).json({ error: 'Failed to get SSO user identities' });
  }
});

// ============================================================================
// SCIM Configuration (for enterprise provisioning)
// ============================================================================

/**
 * GET /api/admin/sso/scim
 * Get SCIM configuration
 */
router.get('/scim', async (req, res) => {
  try {
    const organizationId = req.user.organization_id;

    const result = await pool.query(`
      SELECT id, is_enabled, create_users, update_users,
             deactivate_users, sync_groups, rate_limit_per_minute,
             attribute_mapping, last_sync_at, created_at, updated_at
      FROM scim_configurations
      WHERE organization_id = $1
    `, [organizationId]);

    res.json({
      scim: result.rows.length > 0 ? result.rows[0] : null
    });
  } catch (error) {
    console.error('Get SCIM config error:', error);
    res.status(500).json({ error: 'Failed to get SCIM configuration' });
  }
});

/**
 * POST /api/admin/sso/scim/generate-token
 * Generate a new SCIM bearer token
 */
router.post('/scim/generate-token', requireAdmin, async (req, res) => {
  try {
    const organizationId = req.user.organization_id;

    // Generate new token
    const token = generateSecureToken(32);
    const tokenHash = hashValue(token);

    // Upsert SCIM configuration
    await pool.query(`
      INSERT INTO scim_configurations (organization_id, bearer_token_hash, is_enabled)
      VALUES ($1, $2, TRUE)
      ON CONFLICT (organization_id)
      DO UPDATE SET bearer_token_hash = $2, updated_at = NOW()
    `, [organizationId, tokenHash]);

    res.json({
      message: 'SCIM token generated',
      token: token, // Only shown once
      warning: 'Store this token securely. It cannot be retrieved again.'
    });
  } catch (error) {
    console.error('Generate SCIM token error:', error);
    res.status(500).json({ error: 'Failed to generate SCIM token' });
  }
});

// ============================================================================
// Helper Functions
// ============================================================================

function getDomainVerificationInstructions(method, record) {
  switch (method) {
    case 'dns_txt':
      return {
        method: 'DNS TXT Record',
        steps: [
          'Log in to your DNS provider or registrar',
          'Add a new TXT record to your domain',
          `Set the record value to: ${record}`,
          'Wait for DNS propagation (may take up to 48 hours)',
          'Click Verify to confirm domain ownership'
        ]
      };
    case 'dns_cname':
      return {
        method: 'DNS CNAME Record',
        steps: [
          'Log in to your DNS provider or registrar',
          'Add a new CNAME record',
          `Name: conductos-verify`,
          `Value: ${record}.conductos.app`,
          'Wait for DNS propagation',
          'Click Verify to confirm domain ownership'
        ]
      };
    default:
      return {
        method: 'Manual Verification',
        steps: [
          'Contact your administrator for manual verification'
        ]
      };
  }
}

export default router;
