import { Router } from 'express';
import { MonitoringService } from '../services/monitoring/index.js';
import { getDashboardMetrics } from '../services/monitoring/simplified.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import db from '../db/pg-init.js';

const router = Router();
const monitoring = new MonitoringService();

router.get('/dashboard', requireAuth, requireAdmin, async (req, res) => {
  try {
    const metrics = await getDashboardMetrics();
    res.json(metrics);
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/analytics', requireAuth, async (req, res) => {
  try {
    const days = req.query.days ? parseInt(req.query.days) : 30;
    const analytics = await monitoring.getBusinessAnalytics(req.user.organizationId, days);
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/ai-costs', requireAuth, async (req, res) => {
  try {
    const days = req.query.days ? parseInt(req.query.days) : 30;
    const costs = await monitoring.getAiCostBreakdown(req.user.organizationId, days);
    res.json(costs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/alerts', requireAuth, requireAdmin, async (req, res) => {
  try {
    const status = req.query.status || 'active';
    const alerts = await db.query(
      `SELECT * FROM monitoring_alerts WHERE status=$1 ORDER BY created_at DESC LIMIT 50`,
      [status]
    );
    res.json({ alerts: alerts.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/alerts/:id/acknowledge', requireAuth, requireAdmin, async (req, res) => {
  try {
    const alert = await monitoring.acknowledgeAlert(req.params.id, req.user.userId);
    res.json(alert);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/alerts/:id/resolve', requireAuth, requireAdmin, async (req, res) => {
  try {
    const alert = await monitoring.resolveAlert(req.params.id);
    res.json(alert);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(503).json({ status: 'unhealthy', error: error.message });
  }
});

export default router;
