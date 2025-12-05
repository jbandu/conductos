import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { PatternAnalysisEngine } from '../services/patternAnalysis/index.js';

const router = express.Router();
const engine = new PatternAnalysisEngine();

router.post('/analyze/:caseId', authenticateToken, async (req, res) => {
  try {
    const analysis = await engine.analyzeCase(Number(req.params.caseId));
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/similar/:caseId', authenticateToken, async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 5;
    const patterns = await engine.findSimilarPatterns(Number(req.params.caseId), limit);
    res.json({ patterns });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/risk/:caseId', authenticateToken, async (req, res) => {
  try {
    const assessment = await engine.getRiskAssessment(Number(req.params.caseId));
    res.json(assessment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/benchmarks', authenticateToken, async (req, res) => {
  try {
    const benchmarks = await engine.getCaseBenchmarks(req.user.organizationId || req.user.organization_id);
    res.json(benchmarks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
