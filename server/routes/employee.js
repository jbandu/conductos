import express from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { employeeService } from '../services/employee/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/evidence'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit
    files: 10
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedMimes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'audio/mpeg', 'audio/wav', 'audio/mp4',
      'video/mp4', 'video/webm',
      'text/plain'
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

// Middleware to require employee role
const requireEmployee = requireRole(['employee']);

// =============================================
// DASHBOARD
// =============================================

/**
 * GET /api/employee/dashboard
 * Get employee dashboard data
 */
router.get('/dashboard', authenticateToken, requireEmployee, async (req, res) => {
  try {
    const dashboard = await employeeService.getDashboard(req.user.id);
    res.json(dashboard);
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({ error: error.message });
  }
});

// =============================================
// COMPLAINTS
// =============================================

/**
 * POST /api/employee/complaints
 * Submit a new complaint
 */
router.post('/complaints', authenticateToken, requireEmployee, async (req, res) => {
  try {
    const result = await employeeService.submitComplaint({
      userId: req.user.id,
      organizationId: req.user.organization_id,
      complainantName: req.user.full_name || req.user.name,
      complainantEmail: req.user.email,
      ...req.body
    });
    res.status(201).json(result);
  } catch (error) {
    console.error('Error submitting complaint:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/employee/complaints/anonymous
 * Submit an anonymous complaint (no auth required)
 */
router.post('/complaints/anonymous', async (req, res) => {
  try {
    if (!req.body.passphrase || req.body.passphrase.length < 6) {
      return res.status(400).json({ error: 'Passphrase must be at least 6 characters' });
    }
    if (!req.body.description || req.body.description.length < 50) {
      return res.status(400).json({ error: 'Description must be at least 50 characters' });
    }
    if (!req.body.incidentDate) {
      return res.status(400).json({ error: 'Incident date is required' });
    }

    const result = await employeeService.submitAnonymousComplaint(req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error submitting anonymous complaint:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/employee/complaints/anonymous/lookup
 * Lookup an anonymous case
 */
router.post('/complaints/anonymous/lookup', async (req, res) => {
  try {
    const { anonymousCode, passphrase } = req.body;
    if (!anonymousCode || !passphrase) {
      return res.status(400).json({ error: 'Anonymous code and passphrase are required' });
    }

    const caseData = await employeeService.lookupAnonymousCase(anonymousCode, passphrase);
    res.json(caseData);
  } catch (error) {
    console.error('Error looking up anonymous case:', error);
    res.status(401).json({ error: 'Invalid code or passphrase' });
  }
});

// =============================================
// DRAFTS
// =============================================

/**
 * POST /api/employee/complaints/drafts
 * Save complaint draft
 */
router.post('/complaints/drafts', authenticateToken, requireEmployee, async (req, res) => {
  try {
    const draft = await employeeService.saveDraft(req.user.id, {
      organizationId: req.user.organization_id,
      ...req.body
    });
    res.json(draft);
  } catch (error) {
    console.error('Error saving draft:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/employee/complaints/drafts
 * Get user's drafts
 */
router.get('/complaints/drafts', authenticateToken, requireEmployee, async (req, res) => {
  try {
    const drafts = await employeeService.getDrafts(req.user.id);
    res.json({ drafts });
  } catch (error) {
    console.error('Error fetching drafts:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/employee/complaints/drafts/:draftId
 * Delete a draft
 */
router.delete('/complaints/drafts/:draftId', authenticateToken, requireEmployee, async (req, res) => {
  try {
    await employeeService.deleteDraft(req.user.id, req.params.draftId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting draft:', error);
    res.status(500).json({ error: error.message });
  }
});

// =============================================
// CASE MANAGEMENT
// =============================================

/**
 * GET /api/employee/cases
 * Get all cases for the employee
 */
router.get('/cases', authenticateToken, requireEmployee, async (req, res) => {
  try {
    const cases = await employeeService.getMyCases(req.user.id);
    res.json({ cases });
  } catch (error) {
    console.error('Error fetching cases:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/employee/cases/:caseId
 * Get case details
 */
router.get('/cases/:caseId', authenticateToken, requireEmployee, async (req, res) => {
  try {
    const caseDetail = await employeeService.getCaseDetail(
      req.user.id,
      parseInt(req.params.caseId)
    );
    res.json(caseDetail);
  } catch (error) {
    console.error('Error fetching case detail:', error);
    if (error.message.includes('access denied') || error.message.includes('not found')) {
      res.status(404).json({ error: 'Case not found' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

/**
 * GET /api/employee/cases/:caseId/timeline
 * Get case timeline
 */
router.get('/cases/:caseId/timeline', authenticateToken, requireEmployee, async (req, res) => {
  try {
    const timeline = await employeeService.getCaseTimeline(
      req.user.id,
      parseInt(req.params.caseId)
    );
    res.json({ timeline });
  } catch (error) {
    console.error('Error fetching timeline:', error);
    res.status(500).json({ error: error.message });
  }
});

// =============================================
// EVIDENCE
// =============================================

/**
 * POST /api/employee/cases/:caseId/evidence
 * Upload evidence to a case
 */
router.post('/cases/:caseId/evidence',
  authenticateToken,
  requireEmployee,
  upload.array('files', 10),
  async (req, res) => {
    try {
      const caseId = parseInt(req.params.caseId);
      const descriptions = req.body.descriptions ? JSON.parse(req.body.descriptions) : [];
      const uploadedEvidence = [];

      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const description = descriptions[i] || '';

        // Calculate checksum
        const checksum = crypto
          .createHash('sha256')
          .update(file.filename)
          .digest('hex');

        const evidence = await employeeService.uploadEvidence(
          req.user.id,
          caseId,
          {
            fileName: file.filename,
            originalName: file.originalname,
            mimeType: file.mimetype,
            fileSize: file.size,
            storagePath: file.path,
            checksum
          },
          description
        );

        uploadedEvidence.push(evidence);
      }

      res.status(201).json({ evidence: uploadedEvidence });
    } catch (error) {
      console.error('Error uploading evidence:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * GET /api/employee/cases/:caseId/evidence
 * Get evidence list for a case
 */
router.get('/cases/:caseId/evidence', authenticateToken, requireEmployee, async (req, res) => {
  try {
    const evidence = await employeeService.getCaseEvidence(
      req.user.id,
      parseInt(req.params.caseId)
    );
    res.json({ evidence });
  } catch (error) {
    console.error('Error fetching evidence:', error);
    res.status(500).json({ error: error.message });
  }
});

// =============================================
// MESSAGING
// =============================================

/**
 * GET /api/employee/cases/:caseId/messages
 * Get messages for a case
 */
router.get('/cases/:caseId/messages', authenticateToken, requireEmployee, async (req, res) => {
  try {
    const messages = await employeeService.getCaseMessages(
      req.user.id,
      parseInt(req.params.caseId)
    );
    res.json({ messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/employee/cases/:caseId/messages
 * Send a message to the IC
 */
router.post('/cases/:caseId/messages', authenticateToken, requireEmployee, async (req, res) => {
  try {
    if (!req.body.content || req.body.content.trim().length === 0) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    const message = await employeeService.sendMessage(
      req.user.id,
      parseInt(req.params.caseId),
      req.body.content,
      req.body.attachments || []
    );
    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /api/employee/cases/:caseId/messages/read
 * Mark messages as read
 */
router.patch('/cases/:caseId/messages/read', authenticateToken, requireEmployee, async (req, res) => {
  try {
    await employeeService.markMessagesRead(
      req.user.id,
      parseInt(req.params.caseId)
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking messages read:', error);
    res.status(500).json({ error: error.message });
  }
});

// =============================================
// RESOURCES
// =============================================

/**
 * GET /api/employee/resources
 * Get FAQ and resources
 */
router.get('/resources', async (req, res) => {
  try {
    const organizationId = req.query.organizationId || null;
    const resources = await employeeService.getResources(organizationId);
    res.json(resources);
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
