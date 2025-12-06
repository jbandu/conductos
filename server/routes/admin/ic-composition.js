import express from 'express';
import pool from '../../db/pg-init.js';
import { authenticateToken, requireRole } from '../../middleware/auth.js';

const router = express.Router();

// All routes require hr_admin role
router.use(authenticateToken);
router.use(requireRole(['hr_admin']));

/**
 * GET /api/admin/ic-composition
 * Get current IC composition
 */
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        ic.id,
        ic.user_id,
        ic.role,
        ic.appointed_date,
        ic.term_end_date,
        ic.is_active,
        ic.created_at,
        u.full_name,
        u.email,
        u.organization_id,
        o.name as organization_name
      FROM ic_members ic
      JOIN users u ON ic.user_id = u.id
      LEFT JOIN organizations o ON u.organization_id = o.id
      ORDER BY
        CASE ic.role
          WHEN 'presiding_officer' THEN 1
          WHEN 'internal_member' THEN 2
          WHEN 'external_member' THEN 3
        END,
        ic.appointed_date DESC
    `);

    res.json({
      members: result.rows,
      composition: {
        presiding_officer: result.rows.filter(m => m.role === 'presiding_officer' && m.is_active).length,
        internal_members: result.rows.filter(m => m.role === 'internal_member' && m.is_active).length,
        external_members: result.rows.filter(m => m.role === 'external_member' && m.is_active).length,
        total_active: result.rows.filter(m => m.is_active).length
      }
    });
  } catch (error) {
    console.error('Error fetching IC composition:', error);
    res.status(500).json({ error: 'Failed to fetch IC composition' });
  }
});

/**
 * GET /api/admin/ic-composition/eligible-users
 * Get users eligible to be IC members (ic_member role)
 */
router.get('/eligible-users', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        u.id,
        u.full_name,
        u.email,
        u.organization_id,
        o.name as organization_name,
        CASE
          WHEN ic.id IS NOT NULL THEN true
          ELSE false
        END as is_ic_member
      FROM users u
      LEFT JOIN organizations o ON u.organization_id = o.id
      LEFT JOIN ic_members ic ON u.id = ic.user_id AND ic.is_active = true
      WHERE u.role = 'ic_member' AND u.is_active = true
      ORDER BY u.full_name
    `);

    res.json({ users: result.rows });
  } catch (error) {
    console.error('Error fetching eligible users:', error);
    res.status(500).json({ error: 'Failed to fetch eligible users' });
  }
});

/**
 * POST /api/admin/ic-composition
 * Add new IC member
 */
router.post('/', async (req, res) => {
  const client = await pool.connect();

  try {
    const { user_id, role, appointed_date, term_end_date } = req.body;

    // Validation
    if (!user_id || !role || !appointed_date) {
      return res.status(400).json({
        error: 'Missing required fields: user_id, role, appointed_date'
      });
    }

    // Validate role
    const validRoles = ['presiding_officer', 'internal_member', 'external_member'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        error: 'Invalid role. Must be one of: presiding_officer, internal_member, external_member'
      });
    }

    // Check if user exists and has ic_member role
    const userCheck = await client.query(
      'SELECT id, full_name, email, role, organization_id FROM users WHERE id = $1 AND is_active = true',
      [user_id]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found or inactive' });
    }

    const user = userCheck.rows[0];

    if (user.role !== 'ic_member') {
      return res.status(400).json({
        error: 'User must have ic_member role to be added to IC composition'
      });
    }

    if (!user.organization_id) {
      return res.status(400).json({
        error: 'User must belong to an organization to be added to IC composition'
      });
    }

    // Check if already an active IC member
    const existingMember = await client.query(
      'SELECT id FROM ic_members WHERE user_id = $1 AND is_active = true',
      [user_id]
    );

    if (existingMember.rows.length > 0) {
      return res.status(409).json({ error: 'User is already an active IC member' });
    }

    // PoSH Act validation: Only one presiding officer
    if (role === 'presiding_officer') {
      const existingPO = await client.query(
        'SELECT id FROM ic_members WHERE role = $1 AND is_active = true',
        ['presiding_officer']
      );

      if (existingPO.rows.length > 0) {
        return res.status(409).json({
          error: 'There can only be one active Presiding Officer. Please deactivate the existing one first.'
        });
      }
    }

    await client.query('BEGIN');

    // Add IC member
    const result = await client.query(`
      INSERT INTO ic_members (
        organization_id,
        user_id,
        role,
        appointed_date,
        term_end_date,
        is_active,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, true, NOW())
      RETURNING *
    `, [user.organization_id, user_id, role, appointed_date, term_end_date || null]);

    const newMember = result.rows[0];

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
      'add_ic_member',
      'ic_member',
      user_id,
      JSON.stringify({ role, appointed_date, term_end_date })
    ]);

    await client.query('COMMIT');

    // Fetch complete member details
    const memberDetails = await client.query(`
      SELECT
        ic.*,
        u.full_name,
        u.email
      FROM ic_members ic
      JOIN users u ON ic.user_id = u.id
      WHERE ic.id = $1
    `, [newMember.id]);

    res.status(201).json(memberDetails.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error adding IC member:', error);
    res.status(500).json({ error: 'Failed to add IC member' });
  } finally {
    client.release();
  }
});

/**
 * PATCH /api/admin/ic-composition/:id
 * Update IC member details
 */
router.patch('/:id', async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const { role, appointed_date, term_end_date } = req.body;

    // Get current member data
    const currentMember = await client.query(
      'SELECT * FROM ic_members WHERE id = $1',
      [id]
    );

    if (currentMember.rows.length === 0) {
      return res.status(404).json({ error: 'IC member not found' });
    }

    // Validate role if provided
    if (role) {
      const validRoles = ['presiding_officer', 'internal_member', 'external_member'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          error: 'Invalid role. Must be one of: presiding_officer, internal_member, external_member'
        });
      }

      // Check presiding officer constraint
      if (role === 'presiding_officer' && currentMember.rows[0].role !== 'presiding_officer') {
        const existingPO = await client.query(
          'SELECT id FROM ic_members WHERE role = $1 AND is_active = true AND id != $2',
          ['presiding_officer', id]
        );

        if (existingPO.rows.length > 0) {
          return res.status(409).json({
            error: 'There can only be one active Presiding Officer'
          });
        }
      }
    }

    await client.query('BEGIN');

    // Build update query
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (role) {
      values.push(role);
      updates.push(`role = $${paramIndex++}`);
    }
    if (appointed_date) {
      values.push(appointed_date);
      updates.push(`appointed_date = $${paramIndex++}`);
    }
    if (term_end_date !== undefined) {
      values.push(term_end_date);
      updates.push(`term_end_date = $${paramIndex++}`);
    }

    values.push(id);

    const result = await client.query(`
      UPDATE ic_members
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `, values);

    // Log admin action
    await client.query(`
      INSERT INTO admin_audit_log (
        admin_id,
        action,
        target_type,
        target_id,
        old_value,
        new_value
      ) VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      req.user.id,
      'update_ic_member',
      'ic_member',
      currentMember.rows[0].user_id,
      JSON.stringify({
        role: currentMember.rows[0].role,
        appointed_date: currentMember.rows[0].appointed_date,
        term_end_date: currentMember.rows[0].term_end_date
      }),
      JSON.stringify({ role, appointed_date, term_end_date })
    ]);

    await client.query('COMMIT');

    // Fetch complete member details
    const memberDetails = await client.query(`
      SELECT
        ic.*,
        u.full_name,
        u.email
      FROM ic_members ic
      JOIN users u ON ic.user_id = u.id
      WHERE ic.id = $1
    `, [id]);

    res.json(memberDetails.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating IC member:', error);
    res.status(500).json({ error: 'Failed to update IC member' });
  } finally {
    client.release();
  }
});

/**
 * PATCH /api/admin/ic-composition/:id/deactivate
 * Deactivate IC member
 */
router.patch('/:id/deactivate', async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;

    // Get current member data
    const currentMember = await client.query(
      'SELECT * FROM ic_members WHERE id = $1',
      [id]
    );

    if (currentMember.rows.length === 0) {
      return res.status(404).json({ error: 'IC member not found' });
    }

    await client.query('BEGIN');

    await client.query(`
      UPDATE ic_members
      SET is_active = false
      WHERE id = $1
    `, [id]);

    // Log admin action
    await client.query(`
      INSERT INTO admin_audit_log (
        admin_id,
        action,
        target_type,
        target_id,
        old_value,
        new_value
      ) VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      req.user.id,
      'deactivate_ic_member',
      'ic_member',
      currentMember.rows[0].user_id,
      JSON.stringify({ is_active: true }),
      JSON.stringify({ is_active: false })
    ]);

    await client.query('COMMIT');

    res.json({ message: 'IC member deactivated successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deactivating IC member:', error);
    res.status(500).json({ error: 'Failed to deactivate IC member' });
  } finally {
    client.release();
  }
});

/**
 * GET /api/admin/ic-composition/compliance-check
 * Check if IC composition meets PoSH Act requirements
 */
router.get('/compliance-check', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        role,
        COUNT(*) as count
      FROM ic_members
      WHERE is_active = true
      GROUP BY role
    `);

    const composition = {};
    result.rows.forEach(row => {
      composition[row.role] = parseInt(row.count);
    });

    // PoSH Act requirements:
    // 1. Must have exactly 1 Presiding Officer (senior woman employee)
    // 2. Must have at least 2 internal members (half must be women - not checked here)
    // 3. Must have exactly 1 external member (from NGO/expert)

    const issues = [];
    const warnings = [];

    if (!composition.presiding_officer || composition.presiding_officer === 0) {
      issues.push('Missing Presiding Officer (required: 1 senior woman employee)');
    } else if (composition.presiding_officer > 1) {
      issues.push('Multiple Presiding Officers (only 1 allowed)');
    }

    if (!composition.internal_member || composition.internal_member < 2) {
      issues.push('Insufficient internal members (required: at least 2, half must be women)');
    }

    if (!composition.external_member || composition.external_member === 0) {
      issues.push('Missing external member (required: 1 from NGO/expert in women\'s issues)');
    } else if (composition.external_member > 1) {
      warnings.push('Multiple external members (typically only 1 required)');
    }

    const isCompliant = issues.length === 0;

    res.json({
      compliant: isCompliant,
      composition: {
        presiding_officer: composition.presiding_officer || 0,
        internal_members: composition.internal_member || 0,
        external_members: composition.external_member || 0,
        total: (composition.presiding_officer || 0) + (composition.internal_member || 0) + (composition.external_member || 0)
      },
      issues,
      warnings,
      requirements: {
        presiding_officer: '1 (senior woman employee)',
        internal_members: 'At least 2 (half must be women)',
        external_member: '1 (from NGO or expert in women\'s issues)'
      }
    });
  } catch (error) {
    console.error('Error checking IC compliance:', error);
    res.status(500).json({ error: 'Failed to check IC compliance' });
  }
});

export default router;
