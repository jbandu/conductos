import express from 'express';
import { caseService } from '../services/caseService.js';

const router = express.Router();

// GET all cases with optional filters
router.get('/', (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      is_overdue: req.query.is_overdue,
      search: req.query.search
    };
    const cases = caseService.getAllCases(filters);
    res.json(cases);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create a new case
router.post('/', (req, res) => {
  try {
    const newCase = caseService.createCase(req.body);
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
router.get('/:code', (req, res) => {
  try {
    const caseData = caseService.getCaseByCode(req.params.code);
    if (!caseData) {
      return res.status(404).json({ error: 'Case not found' });
    }

    // Include status history
    const history = caseService.getCaseHistoryByCode(req.params.code);

    res.json({
      ...caseData,
      status_history: history
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH update case status
router.patch('/:code/status', (req, res) => {
  try {
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'status is required' });
    }

    const updatedCase = caseService.updateCaseStatus(
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
router.get('/:code/history', (req, res) => {
  try {
    const history = caseService.getCaseHistoryByCode(req.params.code);
    if (history.length === 0) {
      const caseData = caseService.getCaseByCode(req.params.code);
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
