export class ContextManager {
  constructor(userId, organizationId, caseCode) {
    this.userId = userId;
    this.organizationId = organizationId;
    this.caseCode = caseCode;
    this.conversationHistory = [];
    this.maxHistoryTurns = 10;
  }

  async getCurrentContext() {
    const userSection = `## Current User\n- User ID: ${this.userId || 'anonymous'}\n- Organization: ${this.organizationId || 'unknown'}`;
    const caseSection = this.caseCode
      ? `## Current Case Context\n- Case Code: ${this.caseCode}\n- Status: pending\n- Days Remaining: TBD`
      : '## Current Case Context\n- No case pinned to this conversation';
    return `${userSection}\n\n${caseSection}`;
  }

  buildMessages(userMessage) {
    const messages = [];
    for (const turn of this.conversationHistory.slice(-this.maxHistoryTurns)) {
      messages.push({ role: 'user', content: turn.user });
      messages.push({ role: 'assistant', content: turn.assistant });
    }
    messages.push({ role: 'user', content: userMessage });
    return messages;
  }

  addExchange(userMessage, assistantMessage) {
    this.conversationHistory.push({ user: userMessage, assistant: assistantMessage, timestamp: new Date() });
    if (this.conversationHistory.length > this.maxHistoryTurns * 2) {
      this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryTurns);
    }
  }
}
