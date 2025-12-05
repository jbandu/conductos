import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import externalMemberService from '../services/externalMember/index.js';
import db from '../db/pg-init.js';

const router = express.Router();

// Get all external members (for admin)
router.get('/members', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT * FROM external_members
      ORDER BY created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching external members:', error);
    res.status(500).json({ error: 'Failed to fetch external members' });
  }
});

// Dashboard
router.get('/dashboard', authenticateToken, requireRole(['external_member']), async (req, res) => {
  try {
    const dashboard = await externalMemberService.getDashboard(req.user.id || req.user.userId);
    res.json(dashboard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cases for an organization
router.get('/organizations/:orgId/cases', authenticateToken, requireRole(['external_member']), async (req, res) => {
  try {
    const result = await externalMemberService.getOrganizationCases(
      req.user.id || req.user.userId,
      parseInt(req.params.orgId, 10),
      req.query
    );
    res.json(result);
  } catch (error) {
    res.status(error.message === 'Access denied' ? 403 : 500).json({ error: error.message });
  }
});

// Case detail
router.get('/cases/:caseId', authenticateToken, requireRole(['external_member']), async (req, res) => {
  try {
    const result = await externalMemberService.getCaseDetail(
      req.user.id || req.user.userId,
      parseInt(req.params.caseId, 10)
    );
    res.json(result);
  } catch (error) {
    res.status(error.message === 'Access denied' ? 403 : 404).json({ error: error.message });
  }
});

// Profile
router.get('/profile', authenticateToken, requireRole(['external_member']), async (req, res) => {
  try {
    const profile = await externalMemberService.getProfile(req.user.id || req.user.userId);
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/profile', authenticateToken, requireRole(['external_member']), async (req, res) => {
  try {
    const updated = await externalMemberService.updateProfile?.(
      req.user.id || req.user.userId,
      req.body
    );
    res.json(updated || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fees
router.get('/fees', authenticateToken, requireRole(['external_member']), async (req, res) => {
  try {
    const fees = await externalMemberService.getPendingFees(req.user.id || req.user.userId);
    res.json(fees);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
