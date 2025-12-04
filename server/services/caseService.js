import db from '../db/init.js';
import { generateCaseCode } from '../db/utils.js';

export const caseService = {
  /**
   * Validate case data
   */
  validateCaseData(caseData) {
    const errors = [];

    // Validate incident_date
    if (!caseData.incident_date) {
      errors.push('incident_date is required');
    } else {
      const incidentDate = new Date(caseData.incident_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (incidentDate > today) {
        errors.push('incident_date cannot be in the future');
      }
    }

    // Validate description
    if (!caseData.description) {
      errors.push('description is required');
    } else if (caseData.description.length < 50) {
      errors.push('description must be at least 50 characters');
    }

    // Validate anonymous case requirements
    if (caseData.is_anonymous) {
      if (!caseData.anonymous_alias) {
        errors.push('anonymous_alias is required for anonymous cases');
      }
      if (!caseData.contact_method) {
        errors.push('contact_method is required for anonymous cases');
      }
    } else {
      // Non-anonymous case requirements
      if (!caseData.complainant_name) {
        errors.push('complainant_name is required for non-anonymous cases');
      }
      if (!caseData.complainant_email) {
        errors.push('complainant_email is required for non-anonymous cases');
      }
    }

    return errors;
  },

  /**
   * Calculate deadline date (90 days from creation)
   */
  calculateDeadline(createdAt = new Date()) {
    const deadline = new Date(createdAt);
    deadline.setDate(deadline.getDate() + 90);
    return deadline.toISOString().split('T')[0];
  },

  /**
   * Calculate days remaining until deadline
   */
  calculateDaysRemaining(deadlineDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadline = new Date(deadlineDate);
    deadline.setHours(0, 0, 0, 0);
    const diffTime = deadline - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  },

  /**
   * Add computed fields to case object
   */
  enrichCase(caseData) {
    if (!caseData) return null;
    return {
      ...caseData,
      days_remaining: this.calculateDaysRemaining(caseData.deadline_date),
      is_overdue: this.calculateDaysRemaining(caseData.deadline_date) < 0
    };
  },

  /**
   * Get all cases with optional filters
   */
  getAllCases(filters = {}) {
    let query = 'SELECT * FROM cases WHERE 1=1';
    const params = [];

    // Filter by status
    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    // Filter by overdue
    if (filters.is_overdue === 'true') {
      const today = new Date().toISOString().split('T')[0];
      query += ' AND deadline_date < ?';
      params.push(today);
    }

    // Search in case_code or description
    if (filters.search) {
      query += ' AND (case_code LIKE ? OR description LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    query += ' ORDER BY created_at DESC';

    const stmt = db.prepare(query);
    const cases = stmt.all(...params);

    return cases.map(c => this.enrichCase(c));
  },

  /**
   * Get a single case by ID
   */
  getCaseById(id) {
    const stmt = db.prepare('SELECT * FROM cases WHERE id = ?');
    const caseData = stmt.get(id);
    return this.enrichCase(caseData);
  },

  /**
   * Get a single case by case code
   */
  getCaseByCode(caseCode) {
    const stmt = db.prepare('SELECT * FROM cases WHERE case_code = ?');
    const caseData = stmt.get(caseCode);
    return this.enrichCase(caseData);
  },

  /**
   * Create a new case
   */
  createCase(caseData) {
    // Validate input
    const errors = this.validateCaseData(caseData);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    const caseCode = generateCaseCode();
    const createdAt = new Date();
    const deadlineDate = this.calculateDeadline(createdAt);

    const stmt = db.prepare(`
      INSERT INTO cases (
        case_code, status, incident_date, description, is_anonymous,
        anonymous_alias, contact_method, complainant_name, complainant_email,
        conciliation_requested, deadline_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      caseCode,
      'new',
      caseData.incident_date,
      caseData.description,
      caseData.is_anonymous ? 1 : 0,
      caseData.anonymous_alias || null,
      caseData.contact_method || null,
      caseData.complainant_name || null,
      caseData.complainant_email || null,
      caseData.conciliation_requested ? 1 : 0,
      deadlineDate
    );

    // Record initial status in history
    const historyStmt = db.prepare(`
      INSERT INTO status_history (case_id, new_status, notes)
      VALUES (?, ?, ?)
    `);
    historyStmt.run(info.lastInsertRowid, 'new', 'Case created');

    return this.getCaseById(info.lastInsertRowid);
  },

  /**
   * Update case status
   */
  updateCaseStatus(caseCode, status, notes = '') {
    const currentCase = this.getCaseByCode(caseCode);
    if (!currentCase) {
      throw new Error('Case not found');
    }

    const validStatuses = ['new', 'under_review', 'conciliation', 'investigating', 'decision_pending', 'closed'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const stmt = db.prepare(`
      UPDATE cases
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE case_code = ?
    `);

    stmt.run(status, caseCode);

    // Record status change
    const historyStmt = db.prepare(`
      INSERT INTO status_history (case_id, old_status, new_status, notes)
      VALUES (?, ?, ?, ?)
    `);
    historyStmt.run(currentCase.id, currentCase.status, status, notes);

    return this.getCaseByCode(caseCode);
  },

  /**
   * Get status history for a case by case code
   */
  getCaseHistoryByCode(caseCode) {
    const caseData = this.getCaseByCode(caseCode);
    if (!caseData) return [];

    const stmt = db.prepare(`
      SELECT * FROM status_history
      WHERE case_id = ?
      ORDER BY changed_at DESC
    `);
    return stmt.all(caseData.id);
  },

  /**
   * Get status history for a case by ID
   */
  getCaseHistory(caseId) {
    const stmt = db.prepare(`
      SELECT * FROM status_history
      WHERE case_id = ?
      ORDER BY changed_at DESC
    `);
    return stmt.all(caseId);
  }
};
