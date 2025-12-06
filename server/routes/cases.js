import express from 'express';
import { caseService } from '../services/caseServicePg.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET all cases with optional filters (requires authentication)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      is_overdue: req.query.is_overdue,
      search: req.query.search,
      // Add user-specific filtering
      user: req.user
    };
    const cases = await caseService.getAllCases(filters);
    res.json(cases);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create a new case (optional auth - anonymous cases allowed)
router.post('/', async (req, res) => {
  try {
    const caseData = { ...req.body };

    // Try to get authenticated user info from token (if present)
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token) {
      try {
        const jwt = await import('jsonwebtoken');
        const { config } = await import('../config.js');
        const decoded = jwt.default.verify(token, config.JWT_SECRET);
        // Set complainant_id from authenticated user
        if (!caseData.is_anonymous) {
          caseData.complainant_id = decoded.id;
          // Use user's email if not provided
          if (!caseData.complainant_email) {
            caseData.complainant_email = decoded.email;
          }
        }
      } catch (err) {
        // Token invalid or expired, proceed without auth (for anonymous cases)
        console.log('Optional auth failed, proceeding without user context');
      }
    }

    const newCase = await caseService.createCase(caseData);
    res.status(201).json({
      success: true,
      case: {
        case_code: newCase.case_code,
        status: newCase.status,
        created_at: newCase.created_at,
        deadline_date: newCase.deadline_date,
        days_remaining: newCase.days_remaining
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// GET a single case by case code
router.get('/:code', async (req, res) => {
  try {
    const caseData = await caseService.getCaseByCode(req.params.code);
    if (!caseData) {
      return res.status(404).json({ error: 'Case not found' });
    }

    // Include status history
    const history = await caseService.getCaseHistoryByCode(req.params.code);

    res.json({
      ...caseData,
      status_history: history
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH update case status
router.patch('/:code/status', async (req, res) => {
  try {
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'status is required' });
    }

    const updatedCase = await caseService.updateCaseStatus(
      req.params.code,
      status,
      notes || ''
    );

    res.json({
      success: true,
      case: updatedCase
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// GET case history
router.get('/:code/history', async (req, res) => {
  try {
    const history = await caseService.getCaseHistoryByCode(req.params.code);
    if (history.length === 0) {
      const caseData = await caseService.getCaseByCode(req.params.code);
      if (!caseData) {
        return res.status(404).json({ error: 'Case not found' });
      }
    }
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
