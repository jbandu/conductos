import crypto from 'crypto';
import pool from '../../db/pg-init.js';
import { ICCopilot } from '../icCopilot/index.js';

const INTENT_MAP = [
  { key: 'evidence', intent: 'evidence', agent: 'compliance' },
  { key: 'deadline', intent: 'deadline_check', agent: 'compliance' },
  { key: 'witness', intent: 'investigation_guidance', agent: 'investigation' },
  { key: 'interview', intent: 'investigation_guidance', agent: 'investigation' },
  { key: 'template', intent: 'generate_document', agent: 'document' },
  { key: 'report', intent: 'draft_report', agent: 'document' },
  { key: 'posh', intent: 'legal_question', agent: 'knowledge' }
];

export class MultiAgentOrchestrator {
  constructor(userId, organizationId, caseId) {
    this.userId = userId;
    this.organizationId = organizationId;
    this.caseId = caseId;
    this.sessionId = crypto.randomUUID();
  }

  detectIntent(message) {
    const lowered = (message || '').toLowerCase();
    for (const candidate of INTENT_MAP) {
      if (lowered.includes(candidate.key)) {
        return { primary: candidate.intent, agent: candidate.agent, confidence: 0.7 };
      }
    }
    return { primary: 'general', agent: 'knowledge', confidence: 0.4 };
  }

  async process(message) {
    const started = Date.now();
    const intent = this.detectIntent(message);
    const copilot = new ICCopilot(this.userId, this.organizationId, this.caseId);
    const response = await copilot.chat(message);

    await this.logInteraction({
      message,
      intent,
      response,
      elapsed: Date.now() - started
    });

    return {
      ...response,
      agent: intent.agent,
      confidence: intent.confidence,
      sessionId: this.sessionId
    };
  }

  async logInteraction({ message, intent, response, elapsed }) {
    try {
      await pool.query(
        `INSERT INTO agent_interactions (
          session_id, user_id, organization_id, case_id,
          user_message, detected_intent, intent_confidence,
          primary_agent, secondary_agents, response, tools_used, citations, processing_time_ms
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [
          this.sessionId,
          this.userId,
          this.organizationId,
          this.caseId,
          message,
          intent.primary,
          intent.confidence,
          intent.agent,
          [],
          response?.message || '',
          response?.toolsUsed || [],
          JSON.stringify(response?.citations || []),
          elapsed
        ]
      );
    } catch (error) {
      console.error('Failed to log agent interaction', error.message);
    }
  }
}
