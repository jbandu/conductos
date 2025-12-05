import express from 'express';
import bcrypt from 'bcrypt';
import pool from '../../db/pg-init.js';
import { authenticateToken, requireRole } from '../../middleware/auth.js';

const SALT_ROUNDS = 10;

const router = express.Router();

// All routes require hr_admin role
router.use(authenticateToken);
router.use(requireRole(['hr_admin']));

/**
 * GET /api/admin/users
 * List all users with optional filters
 */
router.get('/', async (req, res) => {
  try {
    const { role, status, search, organization_id } = req.query;

    let query = `
      SELECT
        u.id,
        u.full_name,
        u.email,
        u.role,
        u.is_active,
        u.is_super_admin,
        u.organization_id,
        u.last_login,
        u.created_at,
        o.name as organization_name
      FROM users u
      LEFT JOIN organizations o ON u.organization_id = o.id
      WHERE 1=1
    `;

    const params = [];

    // Filter by role
    if (role && role !== 'all') {
      params.push(role);
      query += ` AND u.role = $${params.length}`;
    }

    // Filter by status
    if (status === 'active') {
      query += ` AND u.is_active = true`;
    } else if (status === 'inactive') {
      query += ` AND u.is_active = false`;
    }

    // Filter by organization
    if (organization_id) {
      params.push(organization_id);
      query += ` AND u.organization_id = $${params.length}`;
    }

    // Search by name or email
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (u.full_name ILIKE $${params.length} OR u.email ILIKE $${params.length})`;
    }

    query += ` ORDER BY u.created_at DESC`;

    const result = await pool.query(query, params);

    res.json({
      users: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/**
 * GET /api/admin/users/:id
 * Get single user details
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT
        u.id,
        u.full_name,
        u.email,
        u.role,
        u.is_active,
        u.is_super_admin,
        u.organization_id,
        u.last_login,
        u.created_at,
        o.name as organization_name
      FROM users u
      LEFT JOIN organizations o ON u.organization_id = o.id
      WHERE u.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

/**
 * POST /api/admin/users
 * Create new user
 */
router.post('/', async (req, res) => {
  const client = await pool.connect();

  try {
    const { full_name, email, password, role, organization_id } = req.body;

    // Validation
    if (!full_name || !email || !password || !role) {
      return res.status(400).json({
        error: 'Missing required fields: full_name, email, password, role'
      });
    }

    // Validate role
    const validRoles = ['employee', 'ic_member', 'hr_admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        error: 'Invalid role. Must be one of: employee, ic_member, hr_admin'
      });
    }

    // Check if email already exists
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    await client.query('BEGIN');

    // Hash password before storing
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const result = await client.query(`
      INSERT INTO users (
        full_name,
        email,
        password_hash,
        role,
        organization_id,
        is_active,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, true, NOW())
      RETURNING id, full_name, email, role, is_active, organization_id, created_at
    `, [full_name, email, password_hash, role, organization_id || null]);

    const newUser = result.rows[0];

    // Log admin action
    await client.query(`
      INSERT INTO admin_audit_log (
        admin_user_id,
        action,
        target_user_id,
        new_value,
        timestamp
      ) VALUES ($1, $2, $3, $4, NOW())
    `, [
      req.user.id,
      'create_user',
      newUser.id,
      JSON.stringify({ role, email })
    ]);

    await client.query('COMMIT');

    res.status(201).json(newUser);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  } finally {
    client.release();
  }
});

/**
 * PATCH /api/admin/users/:id
 * Update user details
 */
router.patch('/:id', async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const { full_name, email, role, organization_id } = req.body;

    // Get current user data for audit log
    const currentUser = await client.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );

    if (currentUser.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Validate role if provided
    if (role) {
      const validRoles = ['employee', 'ic_member', 'hr_admin'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          error: 'Invalid role. Must be one of: employee, ic_member, hr_admin'
        });
      }
    }

    await client.query('BEGIN');

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (full_name) {
      values.push(full_name);
      updates.push(`full_name = $${paramIndex++}`);
    }
    if (email) {
      values.push(email);
      updates.push(`email = $${paramIndex++}`);
    }
    if (role) {
      values.push(role);
      updates.push(`role = $${paramIndex++}`);
    }
    if (organization_id !== undefined) {
      values.push(organization_id);
      updates.push(`organization_id = $${paramIndex++}`);
    }

    values.push(id);

    const result = await client.query(`
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, full_name, email, role, is_active, organization_id
    `, values);

    // Log admin action
    await client.query(`
      INSERT INTO admin_audit_log (
        admin_user_id,
        action,
        target_user_id,
        old_value,
        new_value,
        timestamp
      ) VALUES ($1, $2, $3, $4, $5, NOW())
    `, [
      req.user.id,
      'update_user',
      id,
      JSON.stringify({
        full_name: currentUser.rows[0].full_name,
        email: currentUser.rows[0].email,
        role: currentUser.rows[0].role
      }),
      JSON.stringify({ full_name, email, role })
    ]);

    await client.query('COMMIT');

    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  } finally {
    client.release();
  }
});

/**
 * PATCH /api/admin/users/:id/status
 * Activate or deactivate user
 */
router.patch('/:id/status', async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const { is_active } = req.body;

    if (typeof is_active !== 'boolean') {
      return res.status(400).json({ error: 'is_active must be a boolean' });
    }

    // Get current status for audit log
    const currentUser = await client.query(
      'SELECT is_active, email FROM users WHERE id = $1',
      [id]
    );

    if (currentUser.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    await client.query('BEGIN');

    const result = await client.query(`
      UPDATE users
      SET is_active = $1
      WHERE id = $2
      RETURNING id, full_name, email, role, is_active
    `, [is_active, id]);

    // Log admin action
    await client.query(`
      INSERT INTO admin_audit_log (
        admin_user_id,
        action,
        target_user_id,
        old_value,
        new_value,
        timestamp
      ) VALUES ($1, $2, $3, $4, $5, NOW())
    `, [
      req.user.id,
      is_active ? 'activate_user' : 'deactivate_user',
      id,
      JSON.stringify({ is_active: currentUser.rows[0].is_active }),
      JSON.stringify({ is_active })
    ]);

    await client.query('COMMIT');

    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating user status:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  } finally {
    client.release();
  }
});

/**
 * DELETE /api/admin/users/:id
 * Soft delete user (set is_active to false)
 */
router.delete('/:id', async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;

    // Prevent deleting super admin
    const user = await client.query(
      'SELECT is_super_admin, email FROM users WHERE id = $1',
      [id]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.rows[0].is_super_admin) {
      return res.status(403).json({ error: 'Cannot delete super admin user' });
    }

    await client.query('BEGIN');

    // Soft delete
    await client.query(`
      UPDATE users
      SET is_active = false
      WHERE id = $1
    `, [id]);

    // Log admin action
    await client.query(`
      INSERT INTO admin_audit_log (
        admin_user_id,
        action,
        target_user_id,
        old_value,
        timestamp
      ) VALUES ($1, $2, $3, $4, NOW())
    `, [
      req.user.id,
      'delete_user',
      id,
      JSON.stringify({ email: user.rows[0].email })
    ]);

    await client.query('COMMIT');

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  } finally {
    client.release();
  }
});

export default router;
