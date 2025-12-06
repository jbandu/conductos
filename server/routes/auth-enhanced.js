import express from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import pool from '../db/pg-init.js';
import { config } from '../config.js';
import { authenticateToken } from '../middleware/auth.js';
import {
  sendVerificationEmail,
  sendWelcomeEmail,
  sendSecurityAlertEmail,
  sendMagicLinkEmail,
  sendPasswordResetEmail,
  sendPasswordResetConfirmationEmail
} from '../services/emailService.js';

const router = express.Router();
const SALT_ROUNDS = 10;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_HISTORY_CHECK = 5; // Check last 5 passwords

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.NODE_ENV === 'production' ? 10 : 100,
  message: 'Too many attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: config.NODE_ENV === 'production' ? 5 : 50,
  message: 'Too many attempts, please try again in an hour',
});

/**
 * Helper: Generate secure token
 */
function generateSecureToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Helper: Hash token for storage
 */
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Helper: Generate JWT token
 */
function generateJWT(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      is_super_admin: user.is_super_admin,
      email_verified: user.email_verified
    },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN || '7d' }
  );
}

/**
 * Helper: Extract device info from request
 */
function getDeviceInfo(req) {
  const userAgent = req.headers['user-agent'] || 'Unknown';
  const ip = req.ip || req.connection?.remoteAddress || 'Unknown';

  return {
    ip,
    userAgent,
    device: userAgent.includes('Mobile') ? 'Mobile' : 'Desktop',
    browser: extractBrowser(userAgent),
    time: new Date().toISOString()
  };
}

function extractBrowser(userAgent) {
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  return 'Unknown';
}

/**
 * Helper: Log login attempt
 */
async function logLoginAttempt(userId, loginType, status, deviceInfo, failureReason = null) {
  try {
    await pool.query(`
      INSERT INTO login_history (user_id, login_type, status, ip_address, user_agent, failure_reason)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [userId, loginType, status, deviceInfo.ip, deviceInfo.userAgent, failureReason]);
  } catch (err) {
    console.error('Error logging login attempt:', err);
  }
}

/**
 * Helper: Password strength validation
 */
function validatePasswordStrength(password) {
  const errors = [];

  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.push(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`);
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    valid: errors.length === 0,
    errors,
    strength: calculatePasswordStrength(password)
  };
}

function calculatePasswordStrength(password) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
  if (/[^A-Za-z0-9!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;

  if (score <= 2) return 'weak';
  if (score <= 4) return 'fair';
  if (score <= 6) return 'good';
  return 'strong';
}

/**
 * Helper: Check password history
 */
async function isPasswordInHistory(userId, password) {
  try {
    const result = await pool.query(`
      SELECT password_hash FROM password_history
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `, [userId, PASSWORD_HISTORY_CHECK]);

    for (const row of result.rows) {
      const match = await bcrypt.compare(password, row.password_hash);
      if (match) return true;
    }
    return false;
  } catch (err) {
    console.error('Error checking password history:', err);
    return false;
  }
}

/**
 * ============================================================================
 * EMAIL VERIFICATION ENDPOINTS
 * ============================================================================
 */

/**
 * POST /api/auth/send-verification
 * Send/resend verification email
 */
router.post('/send-verification', authenticateToken, authLimiter, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user info
    const userResult = await pool.query(
      'SELECT id, email, full_name, email_verified FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    if (user.email_verified) {
      return res.status(400).json({ error: 'Email is already verified' });
    }

    // Generate verification token
    const token = generateSecureToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Delete existing tokens
    await pool.query(
      'DELETE FROM email_verification_tokens WHERE user_id = $1',
      [userId]
    );

    // Insert new token
    await pool.query(`
      INSERT INTO email_verification_tokens (user_id, email, token_hash, expires_at)
      VALUES ($1, $2, $3, $4)
    `, [userId, user.email, tokenHash, expiresAt]);

    // Send verification email
    await sendVerificationEmail(user.email, token, user.full_name);

    res.json({ message: 'Verification email sent successfully' });
  } catch (error) {
    console.error('Error sending verification email:', error);
    res.status(500).json({ error: 'Failed to send verification email' });
  }
});

/**
 * POST /api/auth/verify-email
 * Verify email with token
 */
router.post('/verify-email', authLimiter, async (req, res) => {
  const client = await pool.connect();

  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Verification token is required' });
    }

    const tokenHash = hashToken(token);

    await client.query('BEGIN');

    // Find token
    const tokenResult = await client.query(`
      SELECT evt.*, u.full_name, u.role
      FROM email_verification_tokens evt
      JOIN users u ON evt.user_id = u.id
      WHERE evt.token_hash = $1
    `, [tokenHash]);

    if (tokenResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Invalid verification token' });
    }

    const tokenData = tokenResult.rows[0];

    // Check if already used
    if (tokenData.used_at) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'This verification link has already been used' });
    }

    // Check expiration
    if (new Date() > new Date(tokenData.expires_at)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Verification link has expired. Please request a new one.' });
    }

    // Mark user email as verified
    await client.query(`
      UPDATE users SET email_verified = true WHERE id = $1
    `, [tokenData.user_id]);

    // Mark token as used
    await client.query(`
      UPDATE email_verification_tokens SET used_at = NOW() WHERE id = $1
    `, [tokenData.id]);

    await client.query('COMMIT');

    // Send welcome email
    sendWelcomeEmail(tokenData.email, tokenData.full_name, tokenData.role).catch(console.error);

    res.json({ message: 'Email verified successfully!' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error verifying email:', error);
    res.status(500).json({ error: 'Failed to verify email' });
  } finally {
    client.release();
  }
});

/**
 * ============================================================================
 * ENHANCED PASSWORD RESET ENDPOINTS
 * ============================================================================
 */

/**
 * POST /api/auth/forgot-password
 * Request password reset with multiple methods
 */
router.post('/forgot-password', strictLimiter, async (req, res) => {
  const client = await pool.connect();

  try {
    const { email, method = 'email' } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    await client.query('BEGIN');

    // Find user
    const userResult = await client.query(
      'SELECT id, full_name, email, is_active FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    // Always return success to prevent email enumeration
    if (userResult.rows.length === 0 || !userResult.rows[0].is_active) {
      await client.query('ROLLBACK');
      return res.json({
        message: 'If an account exists with this email, you will receive password reset instructions.'
      });
    }

    const user = userResult.rows[0];

    // Check which reset methods are enabled
    const methodsResult = await client.query(
      'SELECT * FROM password_reset_methods WHERE user_id = $1',
      [user.id]
    );

    const resetMethods = methodsResult.rows[0] || { email_enabled: true };

    if (method === 'email' && !resetMethods.email_enabled) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Email reset is not enabled for this account' });
    }

    // Generate token
    const token = generateSecureToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Delete existing tokens
    await client.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [user.id]);

    // Insert new token
    await client.query(`
      INSERT INTO password_reset_tokens (user_id, token, expires_at)
      VALUES ($1, $2, $3)
    `, [user.id, token, expiresAt]);

    await client.query('COMMIT');

    // Send reset email
    sendPasswordResetEmail(user.email, token, user.full_name).catch(console.error);

    res.json({
      message: 'If an account exists with this email, you will receive password reset instructions.'
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
 * POST /api/auth/reset-password
 * Reset password with enhanced security
 */
router.post('/reset-password', strictLimiter, async (req, res) => {
  const client = await pool.connect();
  const deviceInfo = getDeviceInfo(req);

  try {
    const { token, new_password, confirm_password } = req.body;

    if (!token || !new_password) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    if (new_password !== confirm_password) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(new_password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        error: 'Password does not meet requirements',
        details: passwordValidation.errors,
        strength: passwordValidation.strength
      });
    }

    await client.query('BEGIN');

    // Find and verify token
    const tokenResult = await client.query(`
      SELECT prt.*, u.email, u.full_name, u.is_active
      FROM password_reset_tokens prt
      JOIN users u ON prt.user_id = u.id
      WHERE prt.token = $1
    `, [token]);

    if (tokenResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Invalid reset token' });
    }

    const tokenData = tokenResult.rows[0];

    if (!tokenData.is_active) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'User account is inactive' });
    }

    if (tokenData.used_at) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'This reset link has already been used' });
    }

    if (new Date() > new Date(tokenData.expires_at)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Reset link has expired. Please request a new one.' });
    }

    // Check password history
    const inHistory = await isPasswordInHistory(tokenData.user_id, new_password);
    if (inHistory) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: 'This password was used recently. Please choose a different password.'
      });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(new_password, SALT_ROUNDS);

    // Update user password
    await client.query(`
      UPDATE users
      SET password_hash = $1, password_reset_required = false, last_password_change = NOW()
      WHERE id = $2
    `, [passwordHash, tokenData.user_id]);

    // Mark token as used
    await client.query(`
      UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1
    `, [tokenData.id]);

    // Invalidate all existing sessions
    await client.query(`
      UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL
    `, [tokenData.user_id]);

    await client.query('COMMIT');

    // Send confirmation email and security alert
    Promise.all([
      sendPasswordResetConfirmationEmail(tokenData.email, tokenData.full_name),
      sendSecurityAlertEmail(tokenData.email, tokenData.full_name, 'password_changed', deviceInfo)
    ]).catch(console.error);

    // Log the password reset
    logLoginAttempt(tokenData.user_id, 'password', 'success', deviceInfo);

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

/**
 * GET /api/auth/password-strength
 * Check password strength (for real-time feedback)
 */
router.post('/password-strength', (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }

  const validation = validatePasswordStrength(password);

  res.json({
    strength: validation.strength,
    valid: validation.valid,
    requirements: {
      length: password.length >= PASSWORD_MIN_LENGTH,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    },
    suggestions: validation.errors
  });
});

/**
 * ============================================================================
 * MAGIC LINK (PASSWORDLESS) LOGIN
 * ============================================================================
 */

/**
 * POST /api/auth/magic-link/request
 * Request a magic link for passwordless login
 */
router.post('/magic-link/request', strictLimiter, async (req, res) => {
  const client = await pool.connect();

  try {
    const { email } = req.body;
    const deviceInfo = getDeviceInfo(req);

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    await client.query('BEGIN');

    // Find user
    const userResult = await client.query(
      'SELECT id, full_name, email, is_active FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    // Always return success to prevent email enumeration
    if (userResult.rows.length === 0 || !userResult.rows[0].is_active) {
      await client.query('ROLLBACK');
      return res.json({
        message: 'If an account exists with this email, you will receive a sign-in link.'
      });
    }

    const user = userResult.rows[0];

    // Generate magic link token
    const token = generateSecureToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Delete existing tokens for this user
    await client.query('DELETE FROM magic_link_tokens WHERE user_id = $1', [user.id]);

    // Insert new token
    await client.query(`
      INSERT INTO magic_link_tokens (user_id, email, token_hash, expires_at, ip_address)
      VALUES ($1, $2, $3, $4, $5)
    `, [user.id, user.email, tokenHash, expiresAt, deviceInfo.ip]);

    await client.query('COMMIT');

    // Send magic link email
    sendMagicLinkEmail(user.email, token, user.full_name).catch(console.error);

    res.json({
      message: 'If an account exists with this email, you will receive a sign-in link.'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error sending magic link:', error);
    res.status(500).json({ error: 'Failed to send magic link' });
  } finally {
    client.release();
  }
});

/**
 * POST /api/auth/magic-link/verify
 * Verify magic link and log in
 */
router.post('/magic-link/verify', authLimiter, async (req, res) => {
  const client = await pool.connect();
  const deviceInfo = getDeviceInfo(req);

  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    const tokenHash = hashToken(token);

    await client.query('BEGIN');

    // Find token
    const tokenResult = await client.query(`
      SELECT mlt.*, u.id as user_id, u.full_name, u.email, u.role, u.is_super_admin, u.is_active, u.email_verified
      FROM magic_link_tokens mlt
      JOIN users u ON mlt.user_id = u.id
      WHERE mlt.token_hash = $1
    `, [tokenHash]);

    if (tokenResult.rows.length === 0) {
      await client.query('ROLLBACK');
      logLoginAttempt(null, 'magic_link', 'failed', deviceInfo, 'Invalid token');
      return res.status(400).json({ error: 'Invalid or expired sign-in link' });
    }

    const tokenData = tokenResult.rows[0];

    if (!tokenData.is_active) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'User account is inactive' });
    }

    if (tokenData.used_at) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'This sign-in link has already been used' });
    }

    if (new Date() > new Date(tokenData.expires_at)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Sign-in link has expired. Please request a new one.' });
    }

    // Mark token as used
    await client.query('UPDATE magic_link_tokens SET used_at = NOW() WHERE id = $1', [tokenData.id]);

    // Update last login
    await client.query('UPDATE users SET last_login = NOW() WHERE id = $1', [tokenData.user_id]);

    // If email wasn't verified, verify it now
    if (!tokenData.email_verified) {
      await client.query('UPDATE users SET email_verified = true WHERE id = $1', [tokenData.user_id]);
    }

    await client.query('COMMIT');

    // Generate JWT
    const jwtToken = generateJWT({
      id: tokenData.user_id,
      email: tokenData.email,
      role: tokenData.role,
      is_super_admin: tokenData.is_super_admin,
      email_verified: true
    });

    // Log successful login
    logLoginAttempt(tokenData.user_id, 'magic_link', 'success', deviceInfo);

    res.json({
      token: jwtToken,
      user: {
        id: tokenData.user_id,
        fullName: tokenData.full_name,
        email: tokenData.email,
        role: tokenData.role,
        is_super_admin: tokenData.is_super_admin,
        email_verified: true
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error verifying magic link:', error);
    res.status(500).json({ error: 'Failed to verify sign-in link' });
  } finally {
    client.release();
  }
});

/**
 * ============================================================================
 * GOOGLE OAUTH ENDPOINTS
 * ============================================================================
 */

/**
 * POST /api/auth/google/callback
 * Handle Google OAuth callback
 */
router.post('/google/callback', authLimiter, async (req, res) => {
  const client = await pool.connect();
  const deviceInfo = getDeviceInfo(req);

  try {
    const { credential, role = 'employee' } = req.body;

    if (!credential) {
      return res.status(400).json({ error: 'Google credential is required' });
    }

    // Decode the JWT from Google (in production, verify with Google's public keys)
    const decoded = JSON.parse(Buffer.from(credential.split('.')[1], 'base64').toString());
    const { email, name, sub: googleId, email_verified, picture } = decoded;

    if (!email || !googleId) {
      return res.status(400).json({ error: 'Invalid Google credential' });
    }

    await client.query('BEGIN');

    // Check if user exists with this Google ID
    let userResult = await client.query(
      'SELECT * FROM users WHERE google_id = $1',
      [googleId]
    );

    let user = userResult.rows[0];
    let isNewUser = false;

    if (!user) {
      // Check if user exists with this email
      userResult = await client.query(
        'SELECT * FROM users WHERE email = $1',
        [email.toLowerCase()]
      );

      user = userResult.rows[0];

      if (user) {
        // Link Google account to existing user
        await client.query(`
          UPDATE users
          SET google_id = $1, avatar_url = $2, email_verified = true, auth_provider = 'google'
          WHERE id = $3
        `, [googleId, picture, user.id]);

        // Send security alert
        sendSecurityAlertEmail(user.email, user.full_name, 'google_connected', deviceInfo).catch(console.error);
      } else {
        // Create new user with Google
        // Only allow employees to sign up via Google
        if (role !== 'employee') {
          await client.query('ROLLBACK');
          return res.status(400).json({
            error: 'Only employees can register using Google. IC members must use email registration.'
          });
        }

        const result = await client.query(`
          INSERT INTO users (full_name, email, password_hash, role, google_id, avatar_url, email_verified, auth_provider, is_active)
          VALUES ($1, $2, $3, $4, $5, $6, true, 'google', true)
          RETURNING id, full_name, email, role, is_super_admin, email_verified
        `, [name, email.toLowerCase(), '', role, googleId, picture]);

        user = result.rows[0];
        isNewUser = true;

        // Send welcome email
        sendWelcomeEmail(user.email, user.full_name, user.role).catch(console.error);
      }
    }

    // Check if user is active
    if (!user.is_active) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Account is inactive' });
    }

    // Update last login
    await client.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    await client.query('COMMIT');

    // Generate JWT
    const token = generateJWT({
      id: user.id,
      email: user.email,
      role: user.role,
      is_super_admin: user.is_super_admin,
      email_verified: true
    });

    // Log login
    logLoginAttempt(user.id, 'google', 'success', deviceInfo);

    res.json({
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
        is_super_admin: user.is_super_admin,
        email_verified: true,
        avatar_url: picture
      },
      isNewUser
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error with Google auth:', error);
    res.status(500).json({ error: 'Failed to authenticate with Google' });
  } finally {
    client.release();
  }
});

/**
 * POST /api/auth/google/link
 * Link Google account to existing user
 */
router.post('/google/link', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  const deviceInfo = getDeviceInfo(req);

  try {
    const { credential } = req.body;
    const userId = req.user.id;

    if (!credential) {
      return res.status(400).json({ error: 'Google credential is required' });
    }

    const decoded = JSON.parse(Buffer.from(credential.split('.')[1], 'base64').toString());
    const { email, sub: googleId, picture } = decoded;

    await client.query('BEGIN');

    // Check if this Google account is already linked to another user
    const existingResult = await client.query(
      'SELECT id FROM users WHERE google_id = $1 AND id != $2',
      [googleId, userId]
    );

    if (existingResult.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: 'This Google account is already linked to another user'
      });
    }

    // Get current user
    const userResult = await client.query(
      'SELECT email, full_name FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Link Google account
    await client.query(`
      UPDATE users
      SET google_id = $1, avatar_url = COALESCE(avatar_url, $2)
      WHERE id = $3
    `, [googleId, picture, userId]);

    // Add to OAuth connections table
    await client.query(`
      INSERT INTO oauth_connections (user_id, provider, provider_user_id, provider_email, is_primary)
      VALUES ($1, 'google', $2, $3, true)
      ON CONFLICT (user_id, provider) DO UPDATE SET
        provider_user_id = EXCLUDED.provider_user_id,
        provider_email = EXCLUDED.provider_email,
        updated_at = NOW()
    `, [userId, googleId, email]);

    await client.query('COMMIT');

    // Send security alert
    sendSecurityAlertEmail(user.email, user.full_name, 'google_connected', deviceInfo).catch(console.error);

    res.json({ message: 'Google account linked successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error linking Google account:', error);
    res.status(500).json({ error: 'Failed to link Google account' });
  } finally {
    client.release();
  }
});

/**
 * DELETE /api/auth/google/unlink
 * Unlink Google account from user
 */
router.delete('/google/unlink', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  const deviceInfo = getDeviceInfo(req);

  try {
    const userId = req.user.id;

    await client.query('BEGIN');

    // Get user and check if they have a password set
    const userResult = await client.query(
      'SELECT email, full_name, password_hash, auth_provider FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // If user signed up with Google and has no password, don't allow unlinking
    if (user.auth_provider === 'google' && !user.password_hash) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: 'Please set a password before unlinking Google. Your account was created with Google.'
      });
    }

    // Unlink Google account
    await client.query(`
      UPDATE users SET google_id = NULL WHERE id = $1
    `, [userId]);

    // Remove from OAuth connections
    await client.query(`
      DELETE FROM oauth_connections WHERE user_id = $1 AND provider = 'google'
    `, [userId]);

    await client.query('COMMIT');

    // Send security alert
    sendSecurityAlertEmail(user.email, user.full_name, 'google_disconnected', deviceInfo).catch(console.error);

    res.json({ message: 'Google account unlinked successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error unlinking Google account:', error);
    res.status(500).json({ error: 'Failed to unlink Google account' });
  } finally {
    client.release();
  }
});

/**
 * ============================================================================
 * SECURITY SETTINGS ENDPOINTS
 * ============================================================================
 */

/**
 * GET /api/auth/security/status
 * Get current security status for user
 */
router.get('/security/status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(`
      SELECT
        u.email_verified,
        u.mfa_enabled,
        u.google_id IS NOT NULL as google_connected,
        u.auth_provider,
        u.last_password_change,
        u.failed_login_attempts,
        u.locked_until,
        prm.email_enabled as reset_email_enabled,
        prm.security_questions_enabled,
        prm.trusted_device_enabled,
        prm.backup_codes_count,
        (SELECT COUNT(*) FROM trusted_devices WHERE user_id = $1 AND is_trusted = true) as trusted_devices_count,
        (SELECT COUNT(*) FROM login_history WHERE user_id = $1 AND created_at > NOW() - INTERVAL '30 days') as recent_logins
      FROM users u
      LEFT JOIN password_reset_methods prm ON u.id = prm.user_id
      WHERE u.id = $1
    `, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const status = result.rows[0];

    // Calculate security score
    let securityScore = 0;
    if (status.email_verified) securityScore += 20;
    if (status.mfa_enabled) securityScore += 30;
    if (status.google_connected) securityScore += 10;
    if (status.last_password_change && new Date(status.last_password_change) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)) securityScore += 20;
    if (status.trusted_devices_count > 0) securityScore += 10;
    if (status.backup_codes_count > 0) securityScore += 10;

    res.json({
      emailVerified: status.email_verified,
      mfaEnabled: status.mfa_enabled,
      googleConnected: status.google_connected,
      authProvider: status.auth_provider,
      lastPasswordChange: status.last_password_change,
      failedLoginAttempts: status.failed_login_attempts,
      accountLocked: status.locked_until ? new Date() < new Date(status.locked_until) : false,
      lockedUntil: status.locked_until,
      passwordResetMethods: {
        email: status.reset_email_enabled,
        securityQuestions: status.security_questions_enabled,
        trustedDevice: status.trusted_device_enabled,
        backupCodesCount: status.backup_codes_count
      },
      trustedDevicesCount: parseInt(status.trusted_devices_count),
      recentLoginsCount: parseInt(status.recent_logins),
      securityScore,
      recommendations: getSecurityRecommendations(status)
    });
  } catch (error) {
    console.error('Error fetching security status:', error);
    res.status(500).json({ error: 'Failed to fetch security status' });
  }
});

function getSecurityRecommendations(status) {
  const recommendations = [];

  if (!status.email_verified) {
    recommendations.push({
      priority: 'high',
      action: 'verify_email',
      message: 'Verify your email address to secure your account'
    });
  }

  if (!status.mfa_enabled) {
    recommendations.push({
      priority: 'high',
      action: 'enable_mfa',
      message: 'Enable two-factor authentication for additional security'
    });
  }

  if (!status.google_connected) {
    recommendations.push({
      priority: 'low',
      action: 'link_google',
      message: 'Link your Google account for easier sign-in'
    });
  }

  if (!status.last_password_change || new Date(status.last_password_change) < new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)) {
    recommendations.push({
      priority: 'medium',
      action: 'change_password',
      message: 'Consider updating your password regularly'
    });
  }

  if (status.backup_codes_count === 0 && status.mfa_enabled) {
    recommendations.push({
      priority: 'medium',
      action: 'generate_backup_codes',
      message: 'Generate backup codes for account recovery'
    });
  }

  return recommendations;
}

/**
 * GET /api/auth/login-history
 * Get recent login history
 */
router.get('/login-history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);

    const result = await pool.query(`
      SELECT
        login_type,
        status,
        ip_address,
        user_agent,
        created_at
      FROM login_history
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `, [userId, limit]);

    res.json(result.rows.map(row => ({
      loginType: row.login_type,
      status: row.status,
      ipAddress: row.ip_address,
      device: row.user_agent?.includes('Mobile') ? 'Mobile' : 'Desktop',
      browser: extractBrowser(row.user_agent || ''),
      timestamp: row.created_at
    })));
  } catch (error) {
    console.error('Error fetching login history:', error);
    res.status(500).json({ error: 'Failed to fetch login history' });
  }
});

export default router;
