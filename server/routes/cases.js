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

        console.log('Authenticated case creation by user:', decoded.email, 'ID:', decoded.id);

        // ALWAYS set complainant_id for authenticated users
        // This links the case to their account for visibility
        caseData.complainant_id = decoded.id;

        // For non-anonymous cases, also ensure email is set
        if (!caseData.is_anonymous) {
          if (!caseData.complainant_email) {
            caseData.complainant_email = decoded.email;
          }
        }

        console.log('Case data after auth:', {
          complainant_id: caseData.complainant_id,
          complainant_email: caseData.complainant_email,
          is_anonymous: caseData.is_anonymous
        });
      } catch (err) {
        // Token invalid or expired, proceed without auth (for anonymous cases)
        console.error('Auth token verification failed:', err.message);
        console.log('Proceeding with case creation without user context');
      }
    } else {
      console.log('No auth token provided, creating anonymous case');
    }

    const newCase = await caseService.createCase(caseData);

    console.log('Case created successfully:', newCase.case_code, 'complainant_id:', newCase.complainant_id);

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
    console.error('Case creation error:', error);
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
