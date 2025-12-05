import express from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import pool from '../db/pg-init.js';
import { sendPasswordResetEmail } from '../services/emailService.js';

const router = express.Router();
const SALT_ROUNDS = 10;

/**
 * POST /api/auth/forgot-password
 * Request a password reset email
 */
router.post('/forgot-password', async (req, res) => {
  const client = await pool.connect();

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    await client.query('BEGIN');

    // Find user by email
    const userResult = await client.query(
      'SELECT id, full_name, email, is_active FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    // Always return success to prevent email enumeration
    if (userResult.rows.length === 0 || !userResult.rows[0].is_active) {
      await client.query('ROLLBACK');
      return res.json({
        message: 'If an account exists with this email, you will receive a password reset link shortly.'
      });
    }

    const user = userResult.rows[0];

    // Generate secure random token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Token expires in 1 hour
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    // Delete any existing tokens for this user
    await client.query(
      'DELETE FROM password_reset_tokens WHERE user_id = $1',
      [user.id]
    );

    // Insert new token
    await client.query(`
      INSERT INTO password_reset_tokens (user_id, token, expires_at)
      VALUES ($1, $2, $3)
    `, [user.id, resetToken, expiresAt]);

    await client.query('COMMIT');

    // Send email (async, don't wait)
    sendPasswordResetEmail(user.email, resetToken, user.full_name).catch(err => {
      console.error('Failed to send password reset email:', err);
    });

    res.json({
      message: 'If an account exists with this email, you will receive a password reset link shortly.'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in forgot-password:', error);
    res.status(500).json({ error: 'Failed to process password reset request' });
  } finally {
    client.release();
  }
});

/**
 * GET /api/auth/verify-reset-token/:token
 * Verify if a reset token is valid
 */
router.get('/verify-reset-token/:token', async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    const result = await pool.query(`
      SELECT
        prt.id,
        prt.user_id,
        prt.expires_at,
        prt.used_at,
        u.email,
        u.full_name
      FROM password_reset_tokens prt
      JOIN users u ON prt.user_id = u.id
      WHERE prt.token = $1
    `, [token]);

    if (result.rows.length === 0) {
      return res.status(400).json({
        valid: false,
        error: 'Invalid reset token'
      });
    }

    const tokenData = result.rows[0];

    // Check if token has been used
    if (tokenData.used_at) {
      return res.status(400).json({
        valid: false,
        error: 'This reset link has already been used'
      });
    }

    // Check if token has expired
    if (new Date() > new Date(tokenData.expires_at)) {
      return res.status(400).json({
        valid: false,
        error: 'This reset link has expired. Please request a new one.'
      });
    }

    res.json({
      valid: true,
      email: tokenData.email
    });
  } catch (error) {
    console.error('Error verifying reset token:', error);
    res.status(500).json({ error: 'Failed to verify reset token' });
  }
});

/**
 * POST /api/auth/reset-password
 * Reset password using valid token
 */
router.post('/reset-password', async (req, res) => {
  const client = await pool.connect();

  try {
    const { token, new_password } = req.body;

    if (!token || !new_password) {
      return res.status(400).json({
        error: 'Token and new password are required'
      });
    }

    if (new_password.length < 8) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters long'
      });
    }

    await client.query('BEGIN');

    // Verify token
    const tokenResult = await client.query(`
      SELECT
        prt.id,
        prt.user_id,
        prt.expires_at,
        prt.used_at,
        u.email,
        u.full_name,
        u.is_active
      FROM password_reset_tokens prt
      JOIN users u ON prt.user_id = u.id
      WHERE prt.token = $1
    `, [token]);

    if (tokenResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Invalid reset token' });
    }

    const tokenData = tokenResult.rows[0];

    // Check if user is active
    if (!tokenData.is_active) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'User account is inactive' });
    }

    // Check if token has been used
    if (tokenData.used_at) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: 'This reset link has already been used'
      });
    }

    // Check if token has expired
    if (new Date() > new Date(tokenData.expires_at)) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: 'This reset link has expired. Please request a new one.'
      });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(new_password, SALT_ROUNDS);

    // Update user password
    await client.query(`
      UPDATE users
      SET password_hash = $1, updated_at = NOW()
      WHERE id = $2
    `, [passwordHash, tokenData.user_id]);

    // Mark token as used
    await client.query(`
      UPDATE password_reset_tokens
      SET used_at = NOW()
      WHERE id = $1
    `, [tokenData.id]);

    await client.query('COMMIT');

    res.json({
      message: 'Password reset successfully. You can now log in with your new password.'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error resetting password:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  } finally {
    client.release();
  }
});

export default router;
