import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { PushNotificationService } from '../services/pushNotification/index.js';

const router = Router();
const pushService = new PushNotificationService();

router.post('/subscribe', requireAuth, async (req, res) => {
  try {
    await pushService.subscribe(req.user.userId, req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/unsubscribe', requireAuth, async (req, res) => {
  try {
    await pushService.unsubscribe(req.user.userId, req.body.endpoint);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
