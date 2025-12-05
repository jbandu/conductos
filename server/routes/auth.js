import express from 'express';
import bcrypt from 'bcrypt';
import db from '../db/pg-init.js';

const router = express.Router();
const SALT_ROUNDS = 10;

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user by email
    const result = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if role matches (optional - for role-specific login pages)
    if (role && user.role !== role) {
      return res.status(403).json({ error: 'Access denied for this role' });
    }

    // Update last login
    await db.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Return user data (without password hash)
    res.json({
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      role: user.role
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Signup endpoint
router.post('/signup', async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;

    // Validate input
    if (!fullName || !email || !password || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (!['employee', 'ic_member'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Check if user already exists
    const existing = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const result = await db.query(
      `INSERT INTO users (full_name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, full_name, email, role`,
      [fullName, email.toLowerCase(), passwordHash, role]
    );

    const user = result.rows[0];

    // Return user data
    res.status(201).json({
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      role: user.role
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user (for session validation)
router.get('/me', async (req, res) => {
  // TODO: Implement proper session/token validation
  // For now, this endpoint is a placeholder
  res.status(501).json({ error: 'Not implemented' });
});

export default router;
