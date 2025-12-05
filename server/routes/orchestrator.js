import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { MultiAgentOrchestrator } from '../services/orchestrator/index.js';
import pool from '../db/pg-init.js';

const router = express.Router();

router.post('/chat', authenticateToken, async (req, res) => {
  const { message, caseCode } = req.body;
  const userId = req.user?.userId || req.user?.id;
  const organizationId = req.user?.organizationId || req.user?.organization_id;

  try {
    let caseId;
    if (caseCode) {
      const existing = await pool.query('SELECT id FROM cases WHERE case_code = $1 LIMIT 1', [caseCode]);
      caseId = existing.rows[0]?.id;
    }

    const orchestrator = new MultiAgentOrchestrator(userId, organizationId, caseId);
    const response = await orchestrator.process(message || '');
    res.json(response);
  } catch (error) {
    console.error('Orchestrator chat error', error);
    res.status(500).json({ error: 'Orchestrator unavailable', detail: error.message });
  }
});

router.get('/analytics', authenticateToken, async (req, res) => {
  try {
    const organizationId = req.user?.organizationId || req.user?.organization_id;
    const result = await pool.query(
      `SELECT primary_agent, detected_intent, COUNT(*) AS count,
              AVG(processing_time_ms) AS avg_time
       FROM agent_interactions
       WHERE organization_id = $1
         AND created_at > NOW() - INTERVAL '30 days'
       GROUP BY primary_agent, detected_intent
       ORDER BY count DESC`,
      [organizationId]
    );
    res.json({ analytics: result.rows });
  } catch (error) {
    console.error('Analytics fetch failed', error);
    res.status(500).json({ error: 'Failed to load analytics' });
  }
});

export default router;
