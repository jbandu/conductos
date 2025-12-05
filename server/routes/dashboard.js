import express from 'express';
import { caseService } from '../services/caseServicePg.js';

const router = express.Router();

// GET /api/dashboard/summary
router.get('/summary', async (req, res) => {
  try {
    const allCases = await caseService.getAllCases();

    // Filter active cases (not closed)
    const activeCases = allCases.filter(c => c.status !== 'closed');

    // Count by status
    const byStatus = {
      new: 0,
      under_review: 0,
      conciliation: 0,
      investigating: 0,
      decision_pending: 0
    };

    activeCases.forEach(c => {
      if (byStatus.hasOwnProperty(c.status)) {
        byStatus[c.status]++;
      }
    });

    // Count overdue
    const overdueCount = activeCases.filter(c => c.is_overdue).length;

    // Count due today
    const dueToday = activeCases.filter(c => c.days_remaining === 0).length;

    // Count due this week (0-7 days)
    const dueThisWeek = activeCases.filter(c =>
      c.days_remaining >= 0 && c.days_remaining <= 7
    ).length;

    res.json({
      total_active: activeCases.length,
      by_status: byStatus,
      overdue_count: overdueCount,
      due_today: dueToday,
      due_this_week: dueThisWeek
    });
  } catch (error) {
    console.error('Dashboard summary error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
