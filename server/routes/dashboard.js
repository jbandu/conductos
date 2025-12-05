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

// GET /api/dashboard/stats - For IC Dashboard
router.get('/stats', async (req, res) => {
  try {
    const allCases = await caseService.getAllCases();

    // Calculate stats
    const total = allCases.length;
    const closedCases = allCases.filter(c => c.status === 'closed');
    const activeCases = allCases.filter(c => c.status !== 'closed');
    const overdue = activeCases.filter(c => c.is_overdue).length;
    const dueToday = activeCases.filter(c => c.days_remaining === 0).length;

    // New cases in last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const newCases = allCases.filter(c => {
      const reportedDate = new Date(c.reported_at);
      return reportedDate >= sevenDaysAgo;
    }).length;

    // In progress cases (not new, not closed)
    const inProgress = activeCases.filter(c =>
      c.status !== 'new' && c.status !== 'closed'
    ).length;

    res.json({
      stats: {
        total,
        overdue,
        dueToday,
        newCases,
        inProgress,
        closed: closedCases.length
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
