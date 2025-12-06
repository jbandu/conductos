import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { DocumentAgent } from '../services/documentAgent/index.js';
import db from '../db/pg-init.js';

const router = express.Router();

// Get all documents
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Combine documents from different knowledge base tables
    const documents = [];

    // Get legal documents
    const legalDocs = await db.query(`
      SELECT
        id::text,
        title,
        document_type as category,
        full_text as description,
        ARRAY[document_type, jurisdiction] as tags,
        'System Administrator' as uploaded_by_name,
        created_at,
        source_url as file_url
      FROM legal_documents
      ORDER BY created_at DESC
      LIMIT 10
    `);
    documents.push(...legalDocs.rows);

    // Get playbooks
    const playbooks = await db.query(`
      SELECT
        id::text,
        title,
        category,
        scenario as description,
        ARRAY[category, difficulty_level] as tags,
        'System Administrator' as uploaded_by_name,
        created_at,
        NULL as file_url
      FROM playbooks
      ORDER BY created_at DESC
      LIMIT 10
    `);
    documents.push(...playbooks.rows);

    // Get templates
    const templates = await db.query(`
      SELECT
        id::text,
        title,
        template_type as category,
        description,
        ARRAY[template_type] as tags,
        'System Administrator' as uploaded_by_name,
        created_at,
        NULL as file_url
      FROM templates
      WHERE is_active = TRUE
      ORDER BY created_at DESC
      LIMIT 10
    `);
    documents.push(...templates.rows);

    // Sort all documents by created_at
    documents.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json(documents);
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

    const searchPattern = `%${q}%`;
    const documents = [];

    // Search legal documents
    const legalDocs = await db.query(`
      SELECT
        id::text,
        title,
        document_type as category,
        full_text as description,
        ARRAY[document_type, jurisdiction] as tags,
        'System Administrator' as uploaded_by_name,
        created_at,
        source_url as file_url
      FROM legal_documents
      WHERE title ILIKE $1 OR full_text ILIKE $1 OR citation ILIKE $1
      ORDER BY created_at DESC
      LIMIT 10
    `, [searchPattern]);
    documents.push(...legalDocs.rows);

    // Search playbooks
    const playbooks = await db.query(`
      SELECT
        id::text,
        title,
        category,
        scenario as description,
        ARRAY[category, difficulty_level] as tags,
        'System Administrator' as uploaded_by_name,
        created_at,
        NULL as file_url
      FROM playbooks
      WHERE title ILIKE $1 OR scenario ILIKE $1 OR recommended_approach ILIKE $1
      ORDER BY created_at DESC
      LIMIT 10
    `, [searchPattern]);
    documents.push(...playbooks.rows);

    // Search templates
    const templates = await db.query(`
      SELECT
        id::text,
        title,
        template_type as category,
        description,
        ARRAY[template_type] as tags,
        'System Administrator' as uploaded_by_name,
        created_at,
        NULL as file_url
      FROM templates
      WHERE is_active = TRUE AND (title ILIKE $1 OR description ILIKE $1 OR template_content ILIKE $1)
      ORDER BY created_at DESC
      LIMIT 10
    `, [searchPattern]);
    documents.push(...templates.rows);

    // Sort all results by created_at
    documents.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json(documents);
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
