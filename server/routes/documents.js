import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { DocumentAgent } from '../services/documentAgent/index.js';
import db from '../db/pg-init.js';

const router = express.Router();

// Get all documents
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT d.*, u.full_name as uploaded_by_name
      FROM documents d
      LEFT JOIN users u ON d.uploaded_by = u.id
      ORDER BY d.uploaded_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Search documents (semantic search using embeddings)
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }

    // For now, do a simple text search. In production, you'd generate embedding for the query
    // and do cosine similarity search against stored embeddings
    const result = await db.query(`
      SELECT d.*, u.full_name as uploaded_by_name
      FROM documents d
      LEFT JOIN users u ON d.uploaded_by = u.id
      WHERE d.title ILIKE $1 OR d.description ILIKE $1 OR d.content ILIKE $1
      ORDER BY d.uploaded_at DESC
    `, [`%${q}%`]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error searching documents:', error);
    res.status(500).json({ error: 'Failed to search documents' });
  }
});

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
