/**
 * Response Generator for ConductOS
 * Generates structured responses based on parsed intents
 */

import { caseService } from './caseService.js';
import { getHelpText } from './chatParser.js';

/**
 * Generate response for parsed intent
 * @param {string} intent - Parsed intent
 * @param {Object} params - Intent parameters
 * @param {string} mode - Current mode ('employee' or 'ic')
 * @returns {Promise<Object>} - Structured response
 */
export async function generateResponse(intent, params, mode) {
  switch (intent) {
    case 'COMPLAINT_START':
      return {
        type: 'intake_start',
        content: {
          message: "I'll help you file a complaint. This process takes about 3 minutes. Everything you share is confidential.\n\nLet's begin:",
          next_step: 'incident_date'
        }
      };

    case 'CASE_LIST':
      return await handleCaseList();

    case 'CASE_PENDING':
      return await handleCasePending();

    case 'CASE_OVERDUE':
      return await handleCaseOverdue();

    case 'CASE_TODAY':
      return await handleCaseToday();

    case 'CASE_STATUS':
      return await handleCaseStatus(params);

    case 'CASE_UPDATE':
      return await handleCaseUpdate(params);

    case 'INFO_POSH':
      return handleInfoPoSH();

    case 'INFO_CONCILIATION':
      return handleInfoConciliation();

    case 'UNKNOWN':
    default:
      return {
        type: 'text',
        content: getHelpText(mode)
      };
  }
}

/**
 * Handle CASE_LIST intent
 */
async function handleCaseList() {
  try {
    const cases = caseService.getAllCases();

    if (cases.length === 0) {
      return {
        type: 'text',
        content: 'No cases found in the system.'
      };
    }

    const pendingCount = cases.filter(c => c.status === 'under_review' || c.status === 'new').length;
    const overdueCount = cases.filter(c => c.is_overdue).length;

    return {
      type: 'case_list',
      content: {
        cases,
        summary: `Showing ${cases.length} case${cases.length !== 1 ? 's' : ''} (${pendingCount} pending, ${overdueCount} overdue)`
      }
    };
  } catch (error) {
    return {
      type: 'error',
      content: `Failed to retrieve cases: ${error.message}`
    };
  }
}

/**
 * Handle CASE_PENDING intent
 */
async function handleCasePending() {
  try {
    const allCases = caseService.getAllCases();
    const pendingCases = allCases.filter(c =>
      c.status === 'under_review' || c.status === 'new'
    );

    if (pendingCases.length === 0) {
      return {
        type: 'text',
        content: 'No pending cases found.'
      };
    }

    return {
      type: 'case_list',
      content: {
        cases: pendingCases,
        summary: `Showing ${pendingCases.length} pending case${pendingCases.length !== 1 ? 's' : ''}`
      }
    };
  } catch (error) {
    return {
      type: 'error',
      content: `Failed to retrieve pending cases: ${error.message}`
    };
  }
}

/**
 * Handle CASE_OVERDUE intent
 */
async function handleCaseOverdue() {
  try {
    const allCases = caseService.getAllCases();
    const overdueCases = allCases.filter(c => c.is_overdue);

    if (overdueCases.length === 0) {
      return {
        type: 'text',
        content: 'No overdue cases found. Great work!'
      };
    }

    return {
      type: 'case_list',
      content: {
        cases: overdueCases,
        summary: `⚠️ ${overdueCases.length} overdue case${overdueCases.length !== 1 ? 's' : ''} requiring immediate attention`
      }
    };
  } catch (error) {
    return {
      type: 'error',
      content: `Failed to retrieve overdue cases: ${error.message}`
    };
  }
}

/**
 * Handle CASE_TODAY intent
 */
async function handleCaseToday() {
  try {
    const allCases = caseService.getAllCases();
    const todayCases = allCases.filter(c => c.days_remaining === 0);

    if (todayCases.length === 0) {
      return {
        type: 'text',
        content: 'No cases with deadlines today.'
      };
    }

    return {
      type: 'case_list',
      content: {
        cases: todayCases,
        summary: `📅 ${todayCases.length} case${todayCases.length !== 1 ? 's' : ''} with deadline${todayCases.length !== 1 ? 's' : ''} today`
      }
    };
  } catch (error) {
    return {
      type: 'error',
      content: `Failed to retrieve today's deadlines: ${error.message}`
    };
  }
}

/**
 * Handle CASE_STATUS intent
 */
async function handleCaseStatus(params) {
  try {
    const { case_code } = params;

    if (!case_code) {
      return {
        type: 'text',
        content: 'Please provide a case code (e.g., KELP-2025-0001).'
      };
    }

    const caseData = caseService.getCaseByCode(case_code);

    if (!caseData) {
      return {
        type: 'text',
        content: `Case ${case_code} not found.`
      };
    }

    const history = caseService.getCaseHistoryByCode(case_code);

    return {
      type: 'case_detail',
      content: {
        case: caseData,
        history,
        message: `**Case ${caseData.case_code}**\n\n` +
          `**Status:** ${formatStatus(caseData.status)}\n` +
          `**Created:** ${formatDate(caseData.created_at)}\n` +
          `**Deadline:** ${formatDate(caseData.deadline_date)} (${formatDaysRemaining(caseData.days_remaining)})\n` +
          `**Conciliation Requested:** ${caseData.conciliation_requested ? 'Yes' : 'No'}\n\n` +
          `${caseData.is_anonymous ? `**Anonymous:** ${caseData.anonymous_alias}` : `**Complainant:** ${caseData.complainant_name}`}`
      }
    };
  } catch (error) {
    return {
      type: 'error',
      content: `Failed to retrieve case: ${error.message}`
    };
  }
}

/**
 * Handle CASE_UPDATE intent
 */
async function handleCaseUpdate(params) {
  try {
    const { case_code, new_status } = params;

    if (!case_code) {
      return {
        type: 'text',
        content: 'Please provide a case code (e.g., update KELP-2025-0001 status investigating).'
      };
    }

    if (!new_status) {
      return {
        type: 'text',
        content: `Please specify the new status. Valid statuses: new, under_review, conciliation, investigating, decision_pending, closed.`
      };
    }

    const updatedCase = caseService.updateCaseStatus(
      case_code,
      new_status,
      `Status updated via chat command`
    );

    return {
      type: 'case_update_success',
      content: {
        case: updatedCase,
        message: `✅ Case ${case_code} status updated to **${formatStatus(new_status)}**`
      }
    };
  } catch (error) {
    return {
      type: 'error',
      content: `Failed to update case: ${error.message}`
    };
  }
}

/**
 * Handle INFO_POSH intent
 */
function handleInfoPoSH() {
  return {
    type: 'text',
    content: `**PoSH (Prevention of Sexual Harassment)**

The Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013 is a legislative act in India that seeks to protect women from sexual harassment at their workplace.

**Key Points:**

• **Protection**: Provides protection against sexual harassment at workplace
• **ICC**: Establishes Internal Complaints Committee
• **Confidentiality**: Ensures confidential complaint handling
• **Timeline**: Mandates inquiry completion within 90 days
• **Non-retaliation**: Protects complainant from retaliation

**How to file a complaint:**

You can file a complaint through this system by typing "I want to report harassment". All complaints are handled confidentially by our Investigation Committee.`
  };
}

/**
 * Handle INFO_CONCILIATION intent
 */
function handleInfoConciliation() {
  return {
    type: 'text',
    content: `**What is Conciliation?**

Conciliation is a voluntary process where both parties (complainant and respondent) attempt to resolve the matter amicably with the help of the Investigation Committee.

**Key Points:**

• **Voluntary**: Both parties must agree to conciliation
• **Confidential**: The process is completely confidential
• **No recorded admission**: Anything discussed during conciliation cannot be used as evidence
• **Settlement**: If successful, a settlement is reached and recorded
• **Alternative**: If conciliation fails, the formal inquiry continues

**When filing a complaint**, you can indicate if you wish to request conciliation. The IC will reach out to the respondent to see if they agree to this process.`
  };
}

/**
 * Format status for display
 */
function formatStatus(status) {
  const statusMap = {
    'new': 'New',
    'under_review': 'Under Review',
    'conciliation': 'Conciliation',
    'investigating': 'Investigating',
    'decision_pending': 'Decision Pending',
    'closed': 'Closed'
  };
  return statusMap[status] || status;
}

/**
 * Format date for display
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Format days remaining for display
 */
function formatDaysRemaining(days) {
  if (days < 0) {
    return `⚠️ ${Math.abs(days)} days overdue`;
  }
  if (days === 0) {
    return '📅 Due today';
  }
  if (days <= 7) {
    return `⚡ ${days} days remaining`;
  }
  return `${days} days remaining`;
}
