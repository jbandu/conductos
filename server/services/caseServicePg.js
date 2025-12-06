import pool from '../db/pg-init.js';
import { generateCaseCode } from '../db/utils.js';
import { sendCaseStatusUpdateEmail } from './emailService.js';

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
  async getAllCases(filters = {}) {
    // Use SQL date functions to calculate days_remaining and is_overdue
    let query = `
      SELECT *,
        (deadline_date - CURRENT_DATE) as days_remaining,
        (deadline_date < CURRENT_DATE) as is_overdue
      FROM cases
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    // Filter by user role - employees only see their own cases
    if (filters.user) {
      const { role, email, id } = filters.user;

      // Employees can only see their own cases
      if (role === 'employee') {
        query += ` AND (complainant_email = $${paramIndex} OR complainant_id = $${paramIndex + 1})`;
        params.push(email, id);
        paramIndex += 2;
      }
      // IC members and admins see all cases (no additional filter)
    }

    // Filter by status
    if (filters.status) {
      query += ` AND status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    // Filter by overdue - use SQL date comparison
    if (filters.is_overdue === 'true') {
      query += ` AND deadline_date < CURRENT_DATE`;
    }

    // Search in case_code or description
    if (filters.search) {
      query += ` AND (case_code ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    return result.rows;
  },

  /**
   * Get cases by complainant email or user ID
   * Used for employees to view their own cases
   */
  async getCasesByEmail(email, userId = null) {
    const query = `
      SELECT *,
        (deadline_date - CURRENT_DATE) as days_remaining,
        (deadline_date < CURRENT_DATE) as is_overdue
      FROM cases
      WHERE complainant_email = $1 OR complainant_id = $2
      ORDER BY created_at DESC
    `;

    const result = await pool.query(query, [email, userId]);
    return result.rows;
  },

  /**
   * Get a single case by ID
   */
  async getCaseById(id) {
    const result = await pool.query(`
      SELECT *,
        (deadline_date - CURRENT_DATE) as days_remaining,
        (deadline_date < CURRENT_DATE) as is_overdue
      FROM cases
      WHERE id = $1
    `, [id]);
    return result.rows[0];
  },

  /**
   * Get a single case by case code
   */
  async getCaseByCode(caseCode) {
    const result = await pool.query(`
      SELECT *,
        (deadline_date - CURRENT_DATE) as days_remaining,
        (deadline_date < CURRENT_DATE) as is_overdue
      FROM cases
      WHERE case_code = $1
    `, [caseCode]);
    return result.rows[0];
  },

  /**
   * Create a new case
   */
  async createCase(caseData) {
    // Validate input
    const errors = this.validateCaseData(caseData);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    const caseCode = await generateCaseCode(pool);
    const createdAt = new Date();
    const deadlineDate = this.calculateDeadline(createdAt);

    const query = `
      INSERT INTO cases (
        case_code, status, incident_date, description, is_anonymous,
        anonymous_alias, contact_method, complainant_name, complainant_email,
        complainant_id, conciliation_requested, deadline_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id
    `;

    const values = [
      caseCode,
      'new',
      caseData.incident_date,
      caseData.description,
      caseData.is_anonymous || false,
      caseData.anonymous_alias || null,
      caseData.contact_method || null,
      caseData.complainant_name || null,
      caseData.complainant_email || null,
      caseData.complainant_id || null,
      caseData.conciliation_requested || false,
      deadlineDate
    ];

    // Use transaction for multi-step write
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const result = await client.query(query, values);
      const caseId = result.rows[0].id;

      // Record initial status in history
      await client.query(
        'INSERT INTO status_history (case_id, new_status, notes) VALUES ($1, $2, $3)',
        [caseId, 'new', 'Case created']
      );

      await client.query('COMMIT');
      return this.getCaseById(caseId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * Update case status
   */
  async updateCaseStatus(caseCode, status, notes = '') {
    const currentCase = await this.getCaseByCode(caseCode);
    if (!currentCase) {
      throw new Error('Case not found');
    }

    const validStatuses = ['new', 'under_review', 'conciliation', 'investigating', 'decision_pending', 'closed'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    // Use transaction for multi-step write
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(
        'UPDATE cases SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE case_code = $2',
        [status, caseCode]
      );

      // Record status change
      await client.query(
        'INSERT INTO status_history (case_id, old_status, new_status, notes) VALUES ($1, $2, $3, $4)',
        [currentCase.id, currentCase.status, status, notes]
      );

      await client.query('COMMIT');

      // Get user email and name for notification
      const userResult = await client.query(
        'SELECT email, full_name FROM users WHERE id = $1',
        [currentCase.complainant_id]
      );

      if (userResult.rows.length > 0) {
        const user = userResult.rows[0];
        // Send email notification asynchronously (don't block)
        sendCaseStatusUpdateEmail(
          user.email,
          user.full_name,
          currentCase.id,
          currentCase.status,
          status
        ).catch(err => {
          console.error('Failed to send case status update email:', err);
        });
      }

      return this.getCaseByCode(caseCode);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * Get status history for a case by case code
   */
  async getCaseHistoryByCode(caseCode) {
    const caseData = await this.getCaseByCode(caseCode);
    if (!caseData) return [];

    const result = await pool.query(
      'SELECT * FROM status_history WHERE case_id = $1 ORDER BY changed_at DESC',
      [caseData.id]
    );
    return result.rows;
  },

  /**
   * Get status history for a case by ID
   */
  async getCaseHistory(caseId) {
    const result = await pool.query(
      'SELECT * FROM status_history WHERE case_id = $1 ORDER BY changed_at DESC',
      [caseId]
    );
    return result.rows;
  }
};
