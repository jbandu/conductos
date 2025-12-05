import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { ProactiveInsightsEngine } from '../services/proactiveInsights/index.js';

const router = express.Router();
const engine = new ProactiveInsightsEngine();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const insights = await engine.getInsightsForUser(
      req.user.userId || req.user.id,
      req.user.organizationId || req.user.organization_id
    );
    res.json({ insights });
  } catch (error) {
    res.status(500).json({ error: error.message });
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
