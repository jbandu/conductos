export class ResponseFormatter {
  format(message, metadata) {
    const citationFootnotes = metadata.citations?.length
      ? `\n\n**Sources:**\n${metadata.citations.map((c, i) => `[${i + 1}] ${c.reference} (${c.source})`).join('\n')}`
      : '';
    const disclaimer = 'This is AI-generated guidance. The IC remains the decision-maker. For complex situations, consult legal counsel.';
    return {
      message: `${message}${citationFootnotes}`,
      citations: metadata.citations || [],
      toolsUsed: metadata.toolsUsed || [],
      suggestedActions: metadata.suggestedActions || [],
      disclaimer
    };
  }

  formatGuardrailResponse(reason) {
    return {
      message: reason,
      citations: [],
      toolsUsed: [],
      suggestedActions: [
        {
          type: 'escalate',
          label: 'Consult Legal Counsel',
          description: 'This question may require professional legal advice'
        }
      ],
      disclaimer: 'IC Copilot maintains guardrails to ensure appropriate use.'
    };
  }
}
