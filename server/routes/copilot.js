import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { ICCopilot } from '../services/icCopilot/index.js';

const router = express.Router();

router.post('/chat', authenticateToken, async (req, res) => {
  const { message, caseCode } = req.body;
  const userId = req.user?.userId || req.user?.id;
  const organizationId = req.user?.organizationId || req.user?.organization_id;

  try {
    const copilot = new ICCopilot(userId, organizationId, caseCode);
    const response = await copilot.chat(message || '');
    res.json(response);
  } catch (error) {
    console.error('Copilot chat error', error);
    res.status(500).json({ error: 'Copilot unavailable', detail: error.message });
  }
});

export default router;
