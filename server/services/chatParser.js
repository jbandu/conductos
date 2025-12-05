/**
 * Natural Language Command Parser for ConductOS
 * Parses user messages and returns structured intents with extracted parameters
 */

// Case code regex pattern
const CASE_CODE_PATTERN = /KELP-\d{4}-\d{4}/i;

// Intent trigger patterns
const INTENT_PATTERNS = {
  COMPLAINT_START: [
    /file\s+(a\s+)?complaint/i,
    /report\s+(an?\s+)?incident/i,
    /report\s+(an?\s+)?harassment/i,
    /i\s+want\s+to\s+report/i,
    /i\s+need\s+to\s+report/i,
    /submit\s+(a\s+)?complaint/i,
    /make\s+(a\s+)?complaint/i
  ],

  CASE_LIST: [
    /show\s+(all\s+)?cases/i,
    /list\s+(all\s+)?cases/i,
    /view\s+(all\s+)?cases/i,
    /my\s+cases/i,
    /all\s+cases/i,
    /display\s+cases/i,
    /check\s+my\s+case\s+status/i
  ],

  CASE_PENDING: [
    /pending\s+cases/i,
    /show\s+pending/i,
    /pending/i,
    /cases?\s+(that\s+are\s+)?pending/i,
    /under\s+review/i
  ],

  CASE_OVERDUE: [
    /overdue\s+cases/i,
    /show\s+overdue/i,
    /overdue/i,
    /cases?\s+(that\s+are\s+)?overdue/i,
    /past\s+deadline/i,
    /delayed\s+cases/i
  ],

  CASE_TODAY: [
    /today'?s\s+deadlines?/i,
    /due\s+today/i,
    /deadline\s+today/i,
    /\btoday\b/i,
    /cases?\s+due\s+today/i
  ],

  CASE_STATUS: [
    /status\s+(of\s+)?(case\s+)?KELP-\d{4}-\d{4}/i,
    /check\s+(case\s+)?KELP-\d{4}-\d{4}/i,
    /view\s+(case\s+)?KELP-\d{4}-\d{4}/i,
    /show\s+(case\s+)?KELP-\d{4}-\d{4}/i,
    /KELP-\d{4}-\d{4}\s+status/i,
    /what'?s\s+the\s+status\s+of\s+KELP-\d{4}-\d{4}/i
  ],

  CASE_UPDATE: [
    /update\s+(case\s+)?KELP-\d{4}-\d{4}/i,
    /change\s+(case\s+)?KELP-\d{4}-\d{4}/i,
    /set\s+(case\s+)?KELP-\d{4}-\d{4}/i,
    /move\s+(case\s+)?KELP-\d{4}-\d{4}/i
  ],

  INFO_POSH: [
    /what\s+is\s+posh/i,
    /posh\s+policy/i,
    /tell\s+me\s+about\s+posh/i,
    /posh\s+act/i,
    /explain\s+posh/i,
    /\bposh\b/i
  ],

  INFO_CONCILIATION: [
    /what\s+is\s+conciliation/i,
    /conciliation/i,
    /tell\s+me\s+about\s+conciliation/i,
    /explain\s+conciliation/i
  ]
};

// Valid status values for case updates
const VALID_STATUSES = [
  'new',
  'under_review',
  'conciliation',
  'investigating',
  'decision_pending',
  'closed'
];

/**
 * Extract case code from message
 * @param {string} message - User message
 * @returns {string|null} - Case code or null
 */
function extractCaseCode(message) {
  const match = message.match(CASE_CODE_PATTERN);
  return match ? match[0].toUpperCase() : null;
}

/**
 * Extract status from message
 * @param {string} message - User message
 * @returns {string|null} - Status or null
 */
function extractStatus(message) {
  const lowerMessage = message.toLowerCase();

  for (const status of VALID_STATUSES) {
    if (lowerMessage.includes(status.replace('_', ' '))) {
      return status;
    }
  }

  return null;
}

/**
 * Check if message matches any pattern in the array
 * @param {string} message - User message
 * @param {RegExp[]} patterns - Array of regex patterns
 * @returns {boolean}
 */
function matchesPattern(message, patterns) {
  return patterns.some(pattern => pattern.test(message));
}

/**
 * Parse command and extract intent with parameters
 * @param {string} message - User message
 * @param {string} mode - Current mode ('employee' or 'ic')
 * @returns {Object} - { intent: string, params: object }
 */
export function parseCommand(message, mode = 'employee') {
  if (!message || typeof message !== 'string') {
    return { intent: 'UNKNOWN', params: {} };
  }

  const trimmedMessage = message.trim();

  // Employee mode intents
  if (mode === 'employee') {
    // Complaint filing
    if (matchesPattern(trimmedMessage, INTENT_PATTERNS.COMPLAINT_START)) {
      return { intent: 'COMPLAINT_START', params: {} };
    }

    // Case list (employee view limited to own cases)
    if (matchesPattern(trimmedMessage, INTENT_PATTERNS.CASE_LIST)) {
      return { intent: 'CASE_LIST', params: {} };
    }

    // Case status lookup (only for own cases)
    if (matchesPattern(trimmedMessage, INTENT_PATTERNS.CASE_STATUS)) {
      const caseCode = extractCaseCode(trimmedMessage);
      return {
        intent: 'CASE_STATUS',
        params: { case_code: caseCode }
      };
    }

    // Information about PoSH
    if (matchesPattern(trimmedMessage, INTENT_PATTERNS.INFO_POSH)) {
      return { intent: 'INFO_POSH', params: {} };
    }

    // Information about conciliation
    if (matchesPattern(trimmedMessage, INTENT_PATTERNS.INFO_CONCILIATION)) {
      return { intent: 'INFO_CONCILIATION', params: {} };
    }

    return { intent: 'UNKNOWN', params: { mode: 'employee' } };
  }

  // IC mode intents
  if (mode === 'ic') {
    // Case update (check before case status to avoid false positives)
    if (matchesPattern(trimmedMessage, INTENT_PATTERNS.CASE_UPDATE)) {
      const caseCode = extractCaseCode(trimmedMessage);
      const status = extractStatus(trimmedMessage);

      return {
        intent: 'CASE_UPDATE',
        params: {
          case_code: caseCode,
          new_status: status
        }
      };
    }

    // Case status lookup
    if (matchesPattern(trimmedMessage, INTENT_PATTERNS.CASE_STATUS)) {
      const caseCode = extractCaseCode(trimmedMessage);
      return {
        intent: 'CASE_STATUS',
        params: { case_code: caseCode }
      };
    }

    // Overdue cases (check before pending to avoid false positives)
    if (matchesPattern(trimmedMessage, INTENT_PATTERNS.CASE_OVERDUE)) {
      return { intent: 'CASE_OVERDUE', params: {} };
    }

    // Pending cases
    if (matchesPattern(trimmedMessage, INTENT_PATTERNS.CASE_PENDING)) {
      return { intent: 'CASE_PENDING', params: {} };
    }

    // Today's deadlines
    if (matchesPattern(trimmedMessage, INTENT_PATTERNS.CASE_TODAY)) {
      return { intent: 'CASE_TODAY', params: {} };
    }

    // List all cases
    if (matchesPattern(trimmedMessage, INTENT_PATTERNS.CASE_LIST)) {
      return { intent: 'CASE_LIST', params: {} };
    }

    return { intent: 'UNKNOWN', params: { mode: 'ic' } };
  }

  return { intent: 'UNKNOWN', params: {} };
}

/**
 * Get help text for a given mode
 * @param {string} mode - Current mode ('employee' or 'ic')
 * @returns {string} - Help text
 */
export function getHelpText(mode) {
  if (mode === 'employee') {
    return `I can help you with:

• **File a complaint**: "I want to report harassment"
• **Check case status**: "status KELP-2025-0001"
• **Learn about policies**: "what is PoSH?"

What would you like to do?`;
  }

  return `I can help you with:

• **View cases**: "show all cases", "pending cases", "overdue"
• **Check status**: "status KELP-2025-0001"
• **Update status**: "update KELP-2025-0001 status investigating"
• **Today's deadlines**: "today's deadlines"

What would you like to do?`;
}
