import express from 'express';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/upload/:caseId', authenticateToken, (req, res) => {
  res.status(501).json({ error: 'Evidence upload service not configured in this environment.' });
});

router.get('/case/:caseId', authenticateToken, (req, res) => {
  res.status(501).json({ error: 'Evidence listing not available yet.' });
});

router.get('/:id', authenticateToken, (req, res) => {
  res.status(501).json({ error: 'Evidence retrieval not available yet.' });
});

router.get('/:id/download', authenticateToken, (req, res) => {
  res.status(501).json({ error: 'Download endpoints are placeholder only.' });
});

router.post('/:id/analyze', authenticateToken, (req, res) => {
  res.status(501).json({ error: 'Evidence analysis is disabled in this build.' });
});

router.get('/:id/custody', authenticateToken, (req, res) => {
  res.status(501).json({ error: 'Custody chain not available yet.' });
});

router.post('/:id/request-access', authenticateToken, (req, res) => {
  res.status(501).json({ error: 'Access requests are not yet implemented.' });
});

router.post('/access-request/:id/review', authenticateToken, (req, res) => {
  res.status(501).json({ error: 'Access review is not yet implemented.' });
});

export default router;
