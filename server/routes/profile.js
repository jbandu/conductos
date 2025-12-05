import express from 'express';
import bcrypt from 'bcrypt';
import pool from '../db/pg-init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const SALT_ROUNDS = 10;

// All routes require authentication
router.use(authenticateToken);

/**
 * GET /api/profile
 * Get current user's profile
 */
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        u.id,
        u.full_name,
        u.email,
        u.role,
        u.is_super_admin,
        u.is_active,
        u.organization_id,
        u.created_at,
        u.last_login,
        o.name as organization_name
      FROM users u
      LEFT JOIN organizations o ON u.organization_id = o.id
      WHERE u.id = $1
    `, [req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

/**
 * PATCH /api/profile
 * Update current user's profile
 * Users can only update their own full_name
 */
router.patch('/', async (req, res) => {
  try {
    const { full_name } = req.body;

    if (!full_name || full_name.trim().length === 0) {
      return res.status(400).json({ error: 'Full name is required' });
    }

    const result = await pool.query(`
      UPDATE users
      SET full_name = $1
      WHERE id = $2
      RETURNING id, full_name, email, role, is_super_admin
    `, [full_name.trim(), req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

/**
 * POST /api/profile/change-password
 * Change current user's password
 */
router.post('/change-password', async (req, res) => {
  try {
    const { current_password, new_password, confirm_password } = req.body;

    // Validation
    if (!current_password || !new_password || !confirm_password) {
      return res.status(400).json({
        error: 'All fields are required: current_password, new_password, confirm_password'
      });
    }

    if (new_password !== confirm_password) {
      return res.status(400).json({ error: 'New passwords do not match' });
    }

    if (new_password.length < 8) {
      return res.status(400).json({
        error: 'New password must be at least 8 characters long'
      });
    }

    // Get current user's password hash
    const userResult = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(
      current_password,
      userResult.rows[0].password_hash
    );

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(new_password, SALT_ROUNDS);

    // Update password
    await pool.query(`
      UPDATE users
      SET password_hash = $1
      WHERE id = $2
    `, [newPasswordHash, req.user.id]);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

export default router;
