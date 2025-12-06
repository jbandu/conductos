/**
 * Just-In-Time (JIT) User Provisioning
 * Creates and updates users automatically based on SSO authentication
 */

import { pool } from '../../db/pg-init.js';
import { mapGroupsToRole } from './attributeMapper.js';

/**
 * Find or create a user based on SSO identity
 * @param {object} params - Provisioning parameters
 * @returns {object} - { user, identity, created, updated }
 */
export async function provisionUser({
  providerId,
  externalId,
  mappedAttributes,
  providerConfig,
  ipAddress,
  userAgent
}) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Check if SSO identity already exists
    const identityResult = await client.query(`
      SELECT si.*, u.id as user_id, u.email as user_email, u.role as user_role,
             u.is_active as user_is_active, u.name as user_name
      FROM sso_user_identities si
      JOIN users u ON si.user_id = u.id
      WHERE si.provider_id = $1 AND si.external_id = $2
    `, [providerId, externalId]);

    let user;
    let identity;
    let created = false;
    let updated = false;

    if (identityResult.rows.length > 0) {
      // Existing identity found
      identity = identityResult.rows[0];
      user = {
        id: identity.user_id,
        email: identity.user_email,
        role: identity.user_role,
        is_active: identity.user_is_active,
        name: identity.user_name
      };

      // Update user attributes if JIT update is enabled
      if (providerConfig.jit_update_on_login) {
        user = await updateUserFromSSO(client, user.id, mappedAttributes, providerConfig);
        updated = true;
      }

      // Update identity last login
      await client.query(`
        UPDATE sso_user_identities
        SET last_login_at = NOW(),
            login_count = login_count + 1,
            profile_data = $1,
            groups = $2,
            updated_at = NOW()
        WHERE id = $3
      `, [
        JSON.stringify(mappedAttributes),
        mappedAttributes.groups || [],
        identity.id
      ]);

    } else {
      // No existing identity - check if user exists by email
      const existingUserResult = await client.query(`
        SELECT id, email, role, is_active, name, organization_id
        FROM users
        WHERE email = $1 AND organization_id = $2
      `, [mappedAttributes.email, providerConfig.organization_id]);

      if (existingUserResult.rows.length > 0) {
        // User exists, link SSO identity
        user = existingUserResult.rows[0];

        identity = await createSSOIdentity(client, {
          userId: user.id,
          providerId,
          externalId,
          mappedAttributes
        });

        // Update user attributes if enabled
        if (providerConfig.jit_update_on_login) {
          user = await updateUserFromSSO(client, user.id, mappedAttributes, providerConfig);
          updated = true;
        }

      } else if (providerConfig.jit_enabled) {
        // Create new user via JIT provisioning
        user = await createUserFromSSO(client, {
          organizationId: providerConfig.organization_id,
          mappedAttributes,
          providerConfig
        });

        identity = await createSSOIdentity(client, {
          userId: user.id,
          providerId,
          externalId,
          mappedAttributes
        });

        created = true;
      } else {
        // JIT disabled and user doesn't exist
        await client.query('ROLLBACK');
        throw new Error('User not found and JIT provisioning is disabled');
      }
    }

    // Update user's last SSO login timestamp
    await client.query(`
      UPDATE users SET last_sso_login_at = NOW() WHERE id = $1
    `, [user.id]);

    // Log the provisioning event
    await logProvisioningEvent(client, {
      organizationId: providerConfig.organization_id,
      userId: user.id,
      providerId,
      identityId: identity.id,
      eventType: created ? 'user_provisioned' : (updated ? 'user_updated' : 'login_success'),
      ipAddress,
      userAgent,
      metadata: {
        email: mappedAttributes.email,
        external_id: externalId,
        created,
        updated
      }
    });

    await client.query('COMMIT');

    return { user, identity, created, updated };

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('JIT provisioning error:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Create a new user from SSO attributes
 */
async function createUserFromSSO(client, { organizationId, mappedAttributes, providerConfig }) {
  // Determine role from groups or use default
  const role = mapGroupsToRole(
    mappedAttributes.groups,
    providerConfig.group_mapping || {},
    providerConfig.jit_default_role || 'employee'
  );

  const name = mappedAttributes.display_name ||
    [mappedAttributes.first_name, mappedAttributes.last_name].filter(Boolean).join(' ') ||
    mappedAttributes.email.split('@')[0];

  const result = await client.query(`
    INSERT INTO users (
      organization_id,
      email,
      name,
      role,
      is_active,
      provisioned_via_sso,
      provisioned_at,
      sso_only,
      password_login_disabled,
      created_at
    ) VALUES ($1, $2, $3, $4, $5, TRUE, NOW(), TRUE, TRUE, NOW())
    RETURNING id, email, name, role, is_active, organization_id
  `, [
    organizationId,
    mappedAttributes.email,
    name,
    role,
    providerConfig.jit_auto_activate !== false
  ]);

  return result.rows[0];
}

/**
 * Update existing user from SSO attributes
 */
async function updateUserFromSSO(client, userId, mappedAttributes, providerConfig) {
  const updates = [];
  const values = [];
  let paramIndex = 1;

  // Update name if provided
  const name = mappedAttributes.display_name ||
    [mappedAttributes.first_name, mappedAttributes.last_name].filter(Boolean).join(' ');

  if (name) {
    updates.push(`name = $${paramIndex++}`);
    values.push(name);
  }

  // Update role based on groups if group mapping is configured
  if (mappedAttributes.groups && Object.keys(providerConfig.group_mapping || {}).length > 0) {
    const newRole = mapGroupsToRole(
      mappedAttributes.groups,
      providerConfig.group_mapping,
      null // Don't use default - only update if mapping found
    );

    if (newRole) {
      updates.push(`role = $${paramIndex++}`);
      values.push(newRole);
    }
  }

  if (updates.length === 0) {
    // No updates needed, fetch and return current user
    const result = await client.query(
      'SELECT id, email, name, role, is_active, organization_id FROM users WHERE id = $1',
      [userId]
    );
    return result.rows[0];
  }

  updates.push(`updated_at = NOW()`);
  values.push(userId);

  const result = await client.query(`
    UPDATE users
    SET ${updates.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING id, email, name, role, is_active, organization_id
  `, values);

  return result.rows[0];
}

/**
 * Create SSO identity link
 */
async function createSSOIdentity(client, { userId, providerId, externalId, mappedAttributes }) {
  const result = await client.query(`
    INSERT INTO sso_user_identities (
      user_id,
      provider_id,
      external_id,
      email,
      name_id,
      profile_data,
      groups,
      provisioned_at,
      last_login_at,
      login_count
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW(), 1)
    RETURNING *
  `, [
    userId,
    providerId,
    externalId,
    mappedAttributes.email,
    mappedAttributes.nameID || externalId,
    JSON.stringify(mappedAttributes),
    mappedAttributes.groups || []
  ]);

  return result.rows[0];
}

/**
 * Log provisioning event to audit log
 */
async function logProvisioningEvent(client, {
  organizationId,
  userId,
  providerId,
  identityId,
  eventType,
  ipAddress,
  userAgent,
  metadata
}) {
  await client.query(`
    INSERT INTO sso_audit_log (
      organization_id,
      user_id,
      provider_id,
      identity_id,
      event_type,
      event_status,
      ip_address,
      user_agent,
      metadata
    ) VALUES ($1, $2, $3, $4, $5, 'success', $6, $7, $8)
  `, [
    organizationId,
    userId,
    providerId,
    identityId,
    eventType,
    ipAddress,
    userAgent,
    JSON.stringify(metadata)
  ]);
}

/**
 * Deactivate a user's SSO identity
 */
export async function deactivateSSOIdentity(identityId, reason = 'manual') {
  const result = await pool.query(`
    UPDATE sso_user_identities
    SET is_active = FALSE,
        deactivated_at = NOW(),
        deactivation_reason = $1,
        updated_at = NOW()
    WHERE id = $2
    RETURNING *
  `, [reason, identityId]);

  return result.rows[0];
}

/**
 * Check if a user can use SSO for a given organization
 */
export async function canUserUseSSO(email, organizationId) {
  // Check if there's an active SSO provider for the email domain
  const domain = email.split('@')[1];

  const result = await pool.query(`
    SELECT p.id, p.name, p.provider_type, p.provider_vendor
    FROM sso_identity_providers p
    JOIN sso_verified_domains d ON p.organization_id = d.organization_id
    WHERE d.domain = $1
      AND d.is_verified = TRUE
      AND p.is_active = TRUE
      AND p.organization_id = $2
    ORDER BY p.is_primary DESC, p.priority ASC
    LIMIT 1
  `, [domain, organizationId]);

  return result.rows.length > 0 ? result.rows[0] : null;
}

export default {
  provisionUser,
  deactivateSSOIdentity,
  canUserUseSSO
};
