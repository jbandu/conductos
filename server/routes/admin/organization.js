import express from 'express';
import pool from '../../db/pg-init.js';
import { authenticateToken, requireRole } from '../../middleware/auth.js';

const router = express.Router();

// All routes require admin authentication
router.use(authenticateToken);
router.use(requireRole(['hr_admin']));

/**
 * GET /api/admin/organization
 * Get organization details
 */
router.get('/', async (req, res) => {
  try {
    // Get organization ID from the admin user's profile
    const userResult = await pool.query(
      'SELECT organization_id FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0 || !userResult.rows[0].organization_id) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const orgId = userResult.rows[0].organization_id;

    const result = await pool.query(
      'SELECT * FROM organizations WHERE id = $1',
      [orgId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching organization:', error);
    res.status(500).json({ error: 'Failed to fetch organization details' });
  }
});

/**
 * PATCH /api/admin/organization
 * Update organization details
 */
router.patch('/', async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get organization ID from the admin user's profile
    const userResult = await client.query(
      'SELECT organization_id FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0 || !userResult.rows[0].organization_id) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Organization not found' });
    }

    const orgId = userResult.rows[0].organization_id;

    const {
      name,
      domain,
      industry,
      employee_count,
      address,
      city,
      state,
      district_officer_email
    } = req.body;

    // Build update query dynamically based on provided fields
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount}`);
      values.push(name);
      paramCount++;
    }

    if (domain !== undefined) {
      updates.push(`domain = $${paramCount}`);
      values.push(domain);
      paramCount++;
    }

    if (industry !== undefined) {
      updates.push(`industry = $${paramCount}`);
      values.push(industry);
      paramCount++;
    }

    if (employee_count !== undefined) {
      updates.push(`employee_count = $${paramCount}`);
      values.push(employee_count);
      paramCount++;
    }

    if (address !== undefined) {
      updates.push(`address = $${paramCount}`);
      values.push(address);
      paramCount++;
    }

    if (city !== undefined) {
      updates.push(`city = $${paramCount}`);
      values.push(city);
      paramCount++;
    }

    if (state !== undefined) {
      updates.push(`state = $${paramCount}`);
      values.push(state);
      paramCount++;
    }

    if (district_officer_email !== undefined) {
      updates.push(`district_officer_email = $${paramCount}`);
      values.push(district_officer_email);
      paramCount++;
    }

    if (updates.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'No fields to update' });
    }

    // Add organization ID to values
    values.push(orgId);

    const query = `
      UPDATE organizations
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await client.query(query, values);

    // Log admin action
    await client.query(`
      INSERT INTO admin_audit_log (
        admin_id,
        action,
        target_type,
        target_id,
        new_value
      ) VALUES ($1, $2, $3, $4, $5)
    `, [
      req.user.id,
      'update_organization',
      'organization',
      orgId,
      JSON.stringify(req.body)
    ]);

    await client.query('COMMIT');

    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating organization:', error);

    if (error.code === '23505') { // Unique violation
      return res.status(409).json({ error: 'Domain already in use' });
    }

    res.status(500).json({ error: 'Failed to update organization' });
  } finally {
    client.release();
  }
});

/**
 * GET /api/admin/organization/stats
 * Get organization statistics
 */
router.get('/stats', async (req, res) => {
  try {
    // Get organization ID from the admin user's profile
    const userResult = await pool.query(
      'SELECT organization_id FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0 || !userResult.rows[0].organization_id) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const orgId = userResult.rows[0].organization_id;

    // Get user counts by role
    const userStats = await pool.query(`
      SELECT
        role,
        COUNT(*) as count,
        COUNT(*) FILTER (WHERE is_active = true) as active_count
      FROM users
      WHERE organization_id = $1
      GROUP BY role
    `, [orgId]);

    // Get total cases
    const caseStats = await pool.query(`
      SELECT
        COUNT(*) as total_cases,
        COUNT(*) FILTER (WHERE status = 'new') as new_cases,
        COUNT(*) FILTER (WHERE status = 'investigating') as investigating_cases,
        COUNT(*) FILTER (WHERE status = 'resolved') as resolved_cases,
        COUNT(*) FILTER (WHERE status = 'closed') as closed_cases
      FROM cases c
      JOIN users u ON c.complainant_id = u.id
      WHERE u.organization_id = $1
    `, [orgId]);

    // Get IC composition
    const icStats = await pool.query(`
      SELECT
        COUNT(*) as total_members,
        COUNT(*) FILTER (WHERE is_active = true) as active_members,
        COUNT(*) FILTER (WHERE role = 'presiding_officer' AND is_active = true) as presiding_officers,
        COUNT(*) FILTER (WHERE role = 'internal_member' AND is_active = true) as internal_members,
        COUNT(*) FILTER (WHERE role = 'external_member' AND is_active = true) as external_members
      FROM ic_members icm
      JOIN users u ON icm.user_id = u.id
      WHERE u.organization_id = $1
    `, [orgId]);

    res.json({
      users: userStats.rows,
      cases: caseStats.rows[0],
      ic_composition: icStats.rows[0]
    });
  } catch (error) {
    console.error('Error fetching organization stats:', error);
    res.status(500).json({ error: 'Failed to fetch organization statistics' });
  }
});

/**
 * PATCH /api/admin/organization/settings
 * Update organization settings (JSONB field)
 */
router.patch('/settings', async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get organization ID from the admin user's profile
    const userResult = await client.query(
      'SELECT organization_id FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0 || !userResult.rows[0].organization_id) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Organization not found' });
    }

    const orgId = userResult.rows[0].organization_id;
    const { settings } = req.body;

    if (!settings || typeof settings !== 'object') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Invalid settings object' });
    }

    // Merge with existing settings
    const result = await client.query(`
      UPDATE organizations
      SET settings = settings || $1::jsonb
      WHERE id = $2
      RETURNING *
    `, [JSON.stringify(settings), orgId]);

    // Log admin action
    await client.query(`
      INSERT INTO admin_audit_log (
        admin_id,
        action,
        target_type,
        target_id,
        new_value
      ) VALUES ($1, $2, $3, $4, $5)
    `, [
      req.user.id,
      'update_organization_settings',
      'organization',
      orgId,
      JSON.stringify(settings)
    ]);

    await client.query('COMMIT');

    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating organization settings:', error);
    res.status(500).json({ error: 'Failed to update organization settings' });
  } finally {
    client.release();
  }
});

export default router;
