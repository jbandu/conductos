import express from 'express';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/witnesses', authenticateToken, (req, res) => {
  res.status(501).json({ error: 'Witness registry is not available in this environment.' });
});

router.get('/witnesses/:caseId', authenticateToken, (req, res) => {
  res.status(501).json({ error: 'Witness listing not available yet.' });
});

router.post('/sessions', authenticateToken, (req, res) => {
  res.status(501).json({ error: 'Interview scheduling is not yet implemented.' });
});

router.get('/sessions', authenticateToken, (req, res) => {
  res.status(501).json({ error: 'Interview sessions cannot be retrieved in this build.' });
});

router.post('/generate-questions', authenticateToken, (req, res) => {
  res.status(501).json({ error: 'Question generation not available yet.' });
});

router.post('/cross-examination', authenticateToken, (req, res) => {
  res.status(501).json({ error: 'Cross-examination submission disabled in this build.' });
});

router.patch('/cross-examination/:id/review', authenticateToken, (req, res) => {
  res.status(501).json({ error: 'Cross-examination review disabled in this build.' });
});

router.post('/statements', authenticateToken, (req, res) => {
  res.status(501).json({ error: 'Statement recording not available yet.' });
});

router.get('/status/:caseId', authenticateToken, (req, res) => {
  res.status(501).json({ error: 'Examination status endpoint not ready.' });
});

export default router;
