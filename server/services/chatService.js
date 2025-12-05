import { parseCommand } from './chatParser.js';
import { generateResponse } from './responseGenerator.js';

export const chatService = {
  /**
   * Process chat message and return response
   * Uses natural language parser and response generator
   */
  async processMessage(message, mode, user = null) {
    // Parse the command to extract intent and parameters
    const { intent, params } = parseCommand(message, mode);

    // Generate appropriate response based on intent
    const response = await generateResponse(intent, params, mode, user);

    return response;
  }
};
