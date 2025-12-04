import express from 'express';
import { chatService } from '../services/chatService.js';

const router = express.Router();

// POST process chat message
router.post('/', async (req, res) => {
  try {
    const { message, mode } = req.body;

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

    const response = await chatService.processMessage(message, mode);

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
