import express from 'express';
import { chatService } from '../services/chatService.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// POST process chat message
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { message, mode } = req.body;
    const user = req.user; // Get authenticated user from middleware

    if (!message) {
      return res.status(400).json({
        error: 'message is required'
      });
    }

    if (!mode || !['employee', 'ic'].includes(mode)) {
      return res.status(400).json({
        error: 'mode must be either "employee" or "ic"'
      });
    }

    const response = await chatService.processMessage(message, mode, user);

    res.json({
      success: true,
      response
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
