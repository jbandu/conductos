import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { DocumentAgent } from '../services/documentAgent/index.js';

const router = express.Router();

router.post('/generate/mom', authenticateToken, async (req, res) => {
  try {
    const { caseCode, sessionData } = req.body;
    const agent = new DocumentAgent(caseCode);
    await agent.initialize();
    const document = await agent.generateMoM(sessionData);
    res.json(document);
  } catch (error) {
    console.error('MoM generation error', error);
    res.status(500).json({ error: 'Failed to generate MoM' });
  }
});

router.post('/generate/notice', authenticateToken, async (req, res) => {
  try {
    const { caseCode } = req.body;
    const agent = new DocumentAgent(caseCode);
    await agent.initialize();
    const document = await agent.generateNoticeToRespondent();
    res.json(document);
  } catch (error) {
    console.error('Notice generation error', error);
    res.status(500).json({ error: 'Failed to generate notice' });
  }
});

export default router;
