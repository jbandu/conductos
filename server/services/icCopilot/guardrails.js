export class GuardrailChecker {
  constructor() {
    this.blockedPatterns = [
      /what punishment should/i,
      /should (?:he|she|they) be (?:fired|terminated|punished)/i,
      /is (?:he|she|they) guilty/i,
      /did (?:he|she|they) (?:do it|commit)/i
    ];
    this.sensitivePatterns = [
      /(?:name|email|phone|address) of (?:complainant|respondent)/i,
      /(?:identify|reveal|disclose) (?:the )?(?:complainant|victim)/i
    ];
    this.piiPatterns = [
      /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b(?=.*(?:complainant|respondent|harassed|accused))/i,
      /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/,
      /\b\d{10}\b/
    ];
  }

  async checkInput(message) {
    for (const pattern of this.blockedPatterns) {
      if (pattern.test(message)) {
        return { allowed: false, reason: 'I cannot provide opinions on guilt, innocence, or specific punishments.' };
      }
    }
    for (const pattern of this.sensitivePatterns) {
      if (pattern.test(message)) {
        return { allowed: true, warning: 'I will respond while preserving confidentiality under Section 16.' };
      }
    }
    return { allowed: true };
  }

  async checkOutput(response) {
    let modified = response;
    for (const pattern of this.piiPatterns) {
      modified = modified.replace(pattern, '[REDACTED]');
    }
    if (!modified.includes('AI-generated')) {
      modified += '\n\n---\n*This is AI-generated guidance based on PoSH references. Consult counsel for legal advice.*';
    }
    return { allowed: true, modified: modified !== response ? modified : undefined };
  }
}
