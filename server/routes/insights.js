import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { ProactiveInsightsEngine } from '../services/proactiveInsights/index.js';
import db from '../db/pg-init.js';

const router = express.Router();
const engine = new ProactiveInsightsEngine();

router.get('/', authenticateToken, async (req, res) => {
  try {
    // Fetch insights directly from database
    const result = await db.query(`
      SELECT * FROM insights
      ORDER BY generated_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching insights:', error);
    res.status(500).json({ error: 'Failed to fetch insights' });
  }
});

// Update insight status
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await db.query(`
      UPDATE insights
      SET status = $1, resolved_at = CASE WHEN $1 = 'resolved' THEN NOW() ELSE NULL END
      WHERE id = $2
    `, [status, id]);

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating insight:', error);
    res.status(500).json({ error: 'Failed to update insight' });
  }
});

router.post('/:id/acknowledge', authenticateToken, async (req, res) => {
  try {
    await engine.acknowledgeInsight(req.params.id, req.user.userId || req.user.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/digest', authenticateToken, async (req, res) => {
  try {
    const digest = await engine.generateDailyDigest(req.user.organizationId || req.user.organization_id);
    res.json(digest);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/check', authenticateToken, async (req, res) => {
  try {
    const summary = await engine.runInsightChecks(req.user.organizationId || req.user.organization_id);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
