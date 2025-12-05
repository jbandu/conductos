import { GuardrailChecker } from './guardrails.js';
import { ContextManager } from './contextManager.js';
import { ResponseFormatter } from './responseFormatter.js';
import { callMCPTool } from '../mcpClient.js';

const SYSTEM_PROMPT = `You are IC Copilot, an AI assistant for Internal Committee members managing PoSH cases.\nAlways cite PoSH sections or case law when giving guidance and remind users that documents must be reviewed by humans.`;

export class ICCopilot {
  constructor(userId, organizationId, caseCode) {
    this.contextManager = new ContextManager(userId, organizationId, caseCode);
    this.guardrails = new GuardrailChecker();
    this.formatter = new ResponseFormatter();
  }

  async chat(userMessage) {
    const inputCheck = await this.guardrails.checkInput(userMessage);
    if (!inputCheck.allowed) {
      return this.formatter.formatGuardrailResponse(inputCheck.reason);
    }

    const context = await this.contextManager.getCurrentContext();
    const synthesized = `System context:\n${context}\n\nUser asked: ${userMessage}\n\nProvide concise guidance with citations and next steps.`;

    const draftResponse = `${synthesized}\n\nSuggested next steps:\n- Search PoSH Act for relevant sections\n- Offer to generate a notice template if needed`;
    const toolResults = await callMCPTool('search_posh_act', { query: userMessage });

    const baseMessage = `${draftResponse}\n\nReference sections: ${toolResults?.sections?.map((s) => s.section_number).join(', ') || 'pending data'}`;
    const outputCheck = await this.guardrails.checkOutput(baseMessage);
    const finalMessage = outputCheck.modified || baseMessage;

    this.contextManager.addExchange(userMessage, finalMessage);

    return this.formatter.format(finalMessage, {
      toolsUsed: ['search_posh_act'],
      citations: (toolResults?.sections || []).map((section) => ({
        type: 'act',
        reference: `Section ${section.section_number}`,
        source: section.citation || 'PoSH Act'
      })),
      suggestedActions: [
        { type: 'document', label: 'Generate Document', description: 'Use templates to draft MoM or notices' },
        { type: 'reminder', label: 'Set Reminder', description: 'Track inquiry deadlines in ConductOS' }
      ]
    });
  }
}
