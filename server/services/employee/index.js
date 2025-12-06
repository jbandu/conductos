import pool from '../../db/pg-init.js';
import { generateCaseCode } from '../../db/utils.js';
import crypto from 'crypto';

/**
 * Employee Portal Service
 * Handles dashboard, complaints, evidence, messaging, and anonymous reporting
 */
export const employeeService = {
  // =============================================
  // DASHBOARD
  // =============================================

  /**
   * Get employee dashboard data
   */
  async getDashboard(userId) {
    // Get user's cases with summary
    const casesResult = await pool.query(`
      SELECT
        c.id,
        c.case_code,
        c.status,
        c.description,
        c.created_at as filed_at,
        c.deadline_date,
        (c.deadline_date - CURRENT_DATE) as days_remaining,
        (SELECT COUNT(*) FROM case_messages m
         WHERE m.case_id = c.id AND m.sender_type = 'ic_member' AND m.is_read = FALSE
        ) as unread_messages
      FROM cases c
      WHERE c.complainant_id = $1
      ORDER BY c.created_at DESC
      LIMIT 5
    `, [userId]);

    // Check for pending drafts
    const draftsResult = await pool.query(`
      SELECT id, current_step, updated_at, draft_data
      FROM complaint_drafts
      WHERE user_id = $1 AND status = 'draft'
      ORDER BY updated_at DESC
      LIMIT 1
    `, [userId]);

    // Get quick stats
    const statsResult = await pool.query(`
      SELECT
        COUNT(*) as total_cases,
        COUNT(*) FILTER (WHERE status = 'new') as pending_review,
        COUNT(*) FILTER (WHERE status IN ('under_review', 'investigating', 'conciliation')) as under_investigation,
        COUNT(*) FILTER (WHERE status = 'closed') as resolved
      FROM cases
      WHERE complainant_id = $1
    `, [userId]);

    return {
      cases: casesResult.rows,
      pendingDraft: draftsResult.rows[0] || null,
      stats: statsResult.rows[0] || { total_cases: 0, pending_review: 0, under_investigation: 0, resolved: 0 }
    };
  },

  // =============================================
  // COMPLAINT SUBMISSION
  // =============================================

  /**
   * Submit a new complaint
   */
  async submitComplaint(data) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Generate case code
      const caseCode = await generateCaseCode(client);

      // Calculate deadline (90 days from now)
      const deadlineDate = new Date();
      deadlineDate.setDate(deadlineDate.getDate() + 90);

      // Insert case
      const caseResult = await client.query(`
        INSERT INTO cases (
          case_code, organization_id, status, description,
          incident_date, incident_location, incident_types,
          complainant_id, complainant_name, complainant_email,
          complainant_phone, complainant_department, complainant_designation,
          respondent_name, respondent_department, respondent_designation,
          respondent_relationship,
          is_anonymous, deadline_date, created_at
        ) VALUES (
          $1, $2, 'new', $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, FALSE, $17, NOW()
        ) RETURNING *
      `, [
        caseCode,
        data.organizationId,
        data.description,
        data.incidentDate,
        data.incidentLocation,
        data.incidentTypes || [],
        data.userId,
        data.complainantName,
        data.complainantEmail,
        data.complainantPhone || null,
        data.complainantDepartment || null,
        data.complainantDesignation || null,
        data.respondentName,
        data.respondentDepartment || null,
        data.respondentDesignation || null,
        data.respondentRelationship || null,
        deadlineDate.toISOString().split('T')[0]
      ]);

      const caseId = caseResult.rows[0].id;

      // Add witnesses if provided
      if (data.witnesses && data.witnesses.length > 0) {
        for (const witness of data.witnesses) {
          await client.query(`
            INSERT INTO case_witnesses (case_id, name, contact, department, relationship, added_by)
            VALUES ($1, $2, $3, $4, $5, $6)
          `, [caseId, witness.name, witness.contact || null, witness.department || null, witness.relationship || null, data.userId]);
        }
      }

      // Add timeline event
      await client.query(`
        INSERT INTO case_timeline (case_id, event_type, event_title, event_description, actor_id, actor_type)
        VALUES ($1, 'complaint_filed', 'Complaint Filed', 'Your complaint was received and assigned case code ' || $2 || '.', $3, 'employee')
      `, [caseId, caseCode, data.userId]);

      // Add acknowledgment sent event
      await client.query(`
        INSERT INTO case_timeline (case_id, event_type, event_title, event_description, actor_type)
        VALUES ($1, 'acknowledgment_sent', 'Acknowledgment Sent', 'Acknowledgment email sent to your registered email.', 'system')
      `, [caseId]);

      // Record initial status
      await client.query(`
        INSERT INTO status_history (case_id, new_status, notes)
        VALUES ($1, 'new', 'Complaint filed by employee')
      `, [caseId]);

      // Delete any drafts
      await client.query(`
        UPDATE complaint_drafts SET status = 'submitted' WHERE user_id = $1 AND status = 'draft'
      `, [data.userId]);

      await client.query('COMMIT');

      return {
        caseId,
        caseCode,
        filedAt: caseResult.rows[0].created_at,
        deadlineDate: caseResult.rows[0].deadline_date,
        message: 'Complaint filed successfully'
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * Submit anonymous complaint
   */
  async submitAnonymousComplaint(data) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Generate anonymous code
      const anonymousCodeResult = await client.query(`SELECT generate_anonymous_code() as code`);
      const anonymousCode = anonymousCodeResult.rows[0].code;

      // Hash passphrase
      const salt = crypto.randomBytes(16).toString('hex');
      const hash = crypto.pbkdf2Sync(data.passphrase, salt, 10000, 64, 'sha512').toString('hex');

      // Generate case code
      const caseCode = await generateCaseCode(client);

      // Calculate deadline
      const deadlineDate = new Date();
      deadlineDate.setDate(deadlineDate.getDate() + 90);

      // Insert case
      const caseResult = await client.query(`
        INSERT INTO cases (
          case_code, organization_id, status, description,
          incident_date, incident_location,
          respondent_name, respondent_department,
          is_anonymous, anonymous_alias, deadline_date, created_at
        ) VALUES (
          $1, $2, 'new', $3, $4, $5, $6, $7, TRUE, $8, $9, NOW()
        ) RETURNING id, created_at
      `, [
        caseCode,
        data.organizationId || 1, // Default org if not specified
        data.description,
        data.incidentDate,
        data.incidentLocation || null,
        data.respondentName || null,
        data.respondentDepartment || null,
        anonymousCode,
        deadlineDate.toISOString().split('T')[0]
      ]);

      const caseId = caseResult.rows[0].id;

      // Create anonymous tracking record
      await client.query(`
        INSERT INTO anonymous_cases (case_id, anonymous_code, passphrase_hash, passphrase_salt)
        VALUES ($1, $2, $3, $4)
      `, [caseId, anonymousCode, hash, salt]);

      // Add timeline event
      await client.query(`
        INSERT INTO case_timeline (case_id, event_type, event_title, event_description, actor_type, visible_to_employee)
        VALUES ($1, 'complaint_filed', 'Anonymous Complaint Filed', 'An anonymous complaint was received and assigned code ' || $2 || '.', 'system', TRUE)
      `, [caseId, anonymousCode]);

      // Record initial status
      await client.query(`
        INSERT INTO status_history (case_id, new_status, notes)
        VALUES ($1, 'new', 'Anonymous complaint filed')
      `, [caseId]);

      await client.query('COMMIT');

      return {
        anonymousCode,
        caseCode,
        deadlineDate: deadlineDate.toISOString().split('T')[0],
        message: 'Anonymous complaint filed. Save your code and passphrase to check status.'
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * Lookup anonymous case
   */
  async lookupAnonymousCase(anonymousCode, passphrase) {
    // Get anonymous case record
    const anonResult = await pool.query(`
      SELECT ac.*, c.id as case_id, c.case_code, c.status, c.created_at, c.deadline_date, c.description
      FROM anonymous_cases ac
      JOIN cases c ON ac.case_id = c.id
      WHERE ac.anonymous_code = $1
    `, [anonymousCode]);

    if (anonResult.rows.length === 0) {
      throw new Error('Invalid anonymous code');
    }

    const anonRecord = anonResult.rows[0];

    // Verify passphrase
    const hash = crypto.pbkdf2Sync(
      passphrase,
      anonRecord.passphrase_salt,
      10000, 64, 'sha512'
    ).toString('hex');

    if (hash !== anonRecord.passphrase_hash) {
      throw new Error('Invalid passphrase');
    }

    // Update access tracking
    await pool.query(`
      UPDATE anonymous_cases SET
        last_accessed_at = NOW(),
        access_count = access_count + 1
      WHERE anonymous_code = $1
    `, [anonymousCode]);

    // Get timeline (employee-visible only)
    const timelineResult = await pool.query(`
      SELECT event_type, event_title, event_description, created_at
      FROM case_timeline
      WHERE case_id = $1 AND visible_to_employee = TRUE
      ORDER BY created_at DESC
    `, [anonRecord.case_id]);

    // Get unread message count
    const unreadResult = await pool.query(`
      SELECT COUNT(*) as count FROM case_messages
      WHERE case_id = $1 AND sender_type = 'ic_member' AND is_read = FALSE
    `, [anonRecord.case_id]);

    const deadline = new Date(anonRecord.deadline_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysRemaining = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));

    return {
      caseId: anonRecord.case_id,
      caseCode: anonRecord.case_code,
      status: anonRecord.status,
      description: anonRecord.description,
      filedAt: anonRecord.created_at,
      deadlineDate: anonRecord.deadline_date,
      daysRemaining,
      unreadMessages: parseInt(unreadResult.rows[0].count),
      timeline: timelineResult.rows
    };
  },

  // =============================================
  // DRAFTS
  // =============================================

  /**
   * Save or update complaint draft
   */
  async saveDraft(userId, draftData) {
    // Check for existing draft
    const existing = await pool.query(`
      SELECT id FROM complaint_drafts
      WHERE user_id = $1 AND status = 'draft'
    `, [userId]);

    if (existing.rows.length > 0) {
      // Update existing draft
      const result = await pool.query(`
        UPDATE complaint_drafts SET
          draft_data = $1,
          current_step = $2,
          completed_steps = $3,
          updated_at = NOW(),
          expires_at = NOW() + INTERVAL '30 days'
        WHERE id = $4
        RETURNING *
      `, [
        JSON.stringify(draftData),
        draftData.currentStep || 1,
        draftData.completedSteps || [],
        existing.rows[0].id
      ]);
      return result.rows[0];
    } else {
      // Create new draft
      const result = await pool.query(`
        INSERT INTO complaint_drafts (user_id, organization_id, draft_data, current_step, completed_steps)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [
        userId,
        draftData.organizationId || null,
        JSON.stringify(draftData),
        draftData.currentStep || 1,
        draftData.completedSteps || []
      ]);
      return result.rows[0];
    }
  },

  /**
   * Get user's drafts
   */
  async getDrafts(userId) {
    const result = await pool.query(`
      SELECT * FROM complaint_drafts
      WHERE user_id = $1 AND status = 'draft'
      ORDER BY updated_at DESC
    `, [userId]);
    return result.rows;
  },

  /**
   * Delete a draft
   */
  async deleteDraft(userId, draftId) {
    await pool.query(`
      DELETE FROM complaint_drafts
      WHERE id = $1 AND user_id = $2
    `, [draftId, userId]);
  },

  // =============================================
  // CASE MANAGEMENT
  // =============================================

  /**
   * Get all cases for an employee
   */
  async getMyCases(userId) {
    const result = await pool.query(`
      SELECT
        c.id,
        c.case_code,
        c.status,
        c.description,
        c.created_at as filed_at,
        c.deadline_date,
        (c.deadline_date - CURRENT_DATE) as days_remaining,
        (c.deadline_date < CURRENT_DATE) as is_overdue,
        (SELECT COUNT(*) FROM case_messages m
         WHERE m.case_id = c.id AND m.sender_type = 'ic_member' AND m.is_read = FALSE
        ) as unread_messages,
        (SELECT COUNT(*) FROM evidence e WHERE e.case_id = c.id AND e.status = 'active') as evidence_count
      FROM cases c
      WHERE c.complainant_id = $1
      ORDER BY c.created_at DESC
    `, [userId]);

    return result.rows;
  },

  /**
   * Get detailed case information
   */
  async getCaseDetail(userId, caseId) {
    // Verify user owns this case
    await this.verifyUserOwnsCase(userId, caseId);

    const caseResult = await pool.query(`
      SELECT
        c.*,
        (c.deadline_date - CURRENT_DATE) as days_remaining,
        (c.deadline_date < CURRENT_DATE) as is_overdue,
        (SELECT COUNT(*) FROM evidence e WHERE e.case_id = c.id AND e.status = 'active') as evidence_count,
        (SELECT COUNT(*) FROM case_messages m WHERE m.case_id = c.id AND m.sender_type = 'ic_member' AND m.is_read = FALSE) as unread_messages
      FROM cases c
      WHERE c.id = $1
    `, [caseId]);

    if (caseResult.rows.length === 0) {
      throw new Error('Case not found');
    }

    // Get witnesses
    const witnessResult = await pool.query(`
      SELECT id, name, contact, department, relationship, created_at
      FROM case_witnesses
      WHERE case_id = $1
      ORDER BY created_at
    `, [caseId]);

    return {
      ...caseResult.rows[0],
      witnesses: witnessResult.rows
    };
  },

  /**
   * Get case timeline
   */
  async getCaseTimeline(userId, caseId) {
    await this.verifyUserOwnsCase(userId, caseId);

    const result = await pool.query(`
      SELECT
        event_type,
        event_title,
        event_description,
        created_at,
        metadata
      FROM case_timeline
      WHERE case_id = $1 AND visible_to_employee = TRUE
      ORDER BY created_at DESC
    `, [caseId]);

    return result.rows;
  },

  // =============================================
  // EVIDENCE
  // =============================================

  /**
   * Upload evidence to a case
   */
  async uploadEvidence(userId, caseId, fileData, description) {
    await this.verifyUserOwnsCase(userId, caseId);

    // Get organization from case
    const caseResult = await pool.query(`
      SELECT organization_id FROM cases WHERE id = $1
    `, [caseId]);

    const orgId = caseResult.rows[0]?.organization_id;

    // Create evidence record
    const result = await pool.query(`
      INSERT INTO evidence (
        case_id, organization_id, file_name, original_name,
        mime_type, file_size, storage_path, checksum,
        evidence_type, description, uploaded_by, access_level
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'ic_only')
      RETURNING *
    `, [
      caseId,
      orgId,
      fileData.fileName,
      fileData.originalName,
      fileData.mimeType,
      fileData.fileSize,
      fileData.storagePath,
      fileData.checksum,
      this.categorizeFile(fileData.mimeType),
      description || null,
      userId
    ]);

    // Add timeline event
    await pool.query(`
      INSERT INTO case_timeline (case_id, event_type, event_title, event_description, actor_id, actor_type, metadata)
      VALUES ($1, 'evidence_added', 'Evidence Uploaded', 'New evidence file uploaded: ' || $2, $3, 'employee', $4)
    `, [caseId, fileData.originalName, userId, JSON.stringify({ fileName: fileData.originalName })]);

    // Log custody
    await pool.query(`
      INSERT INTO evidence_custody (evidence_id, action, performed_by, notes)
      VALUES ($1, 'uploaded', $2, 'Initial upload by complainant')
    `, [result.rows[0].id, userId]);

    return result.rows[0];
  },

  /**
   * Get evidence for a case
   */
  async getCaseEvidence(userId, caseId) {
    await this.verifyUserOwnsCase(userId, caseId);

    const result = await pool.query(`
      SELECT
        e.id,
        e.file_name,
        e.original_name,
        e.mime_type,
        e.file_size,
        e.evidence_type,
        e.description,
        e.created_at as uploaded_at,
        CASE WHEN e.uploaded_by = $1 THEN 'You' ELSE 'IC Committee' END as uploaded_by_name
      FROM evidence e
      WHERE e.case_id = $2 AND e.status = 'active'
      ORDER BY e.created_at DESC
    `, [userId, caseId]);

    return result.rows;
  },

  /**
   * Log evidence access
   */
  async logEvidenceAccess(evidenceId, userId, accessType, ipAddress) {
    await pool.query(`
      INSERT INTO evidence_custody (evidence_id, action, performed_by, ip_address)
      VALUES ($1, $2, $3, $4)
    `, [evidenceId, accessType, userId, ipAddress]);
  },

  // =============================================
  // MESSAGING
  // =============================================

  /**
   * Get messages for a case
   */
  async getCaseMessages(userId, caseId) {
    await this.verifyUserOwnsCase(userId, caseId);

    // Mark IC messages as read
    await pool.query(`
      UPDATE case_messages SET is_read = TRUE, read_at = NOW()
      WHERE case_id = $1 AND sender_type = 'ic_member' AND is_read = FALSE
    `, [caseId]);

    // Get messages
    const result = await pool.query(`
      SELECT
        m.id,
        m.content,
        m.content_type,
        m.sender_type,
        m.sender_display_name,
        m.attachments,
        m.created_at,
        m.is_read
      FROM case_messages m
      WHERE m.case_id = $1
      ORDER BY m.created_at ASC
    `, [caseId]);

    return result.rows;
  },

  /**
   * Send a message to the IC
   */
  async sendMessage(userId, caseId, content, attachments = []) {
    await this.verifyUserOwnsCase(userId, caseId);

    // Get user's name
    const userResult = await pool.query(`
      SELECT full_name FROM users WHERE id = $1
    `, [userId]);

    const userName = userResult.rows[0]?.full_name || 'Employee';

    // Insert message
    const result = await pool.query(`
      INSERT INTO case_messages (
        case_id, sender_id, sender_type, sender_display_name,
        content, attachments
      ) VALUES ($1, $2, 'employee', $3, $4, $5)
      RETURNING *
    `, [caseId, userId, userName, content, attachments]);

    // Add timeline event (visible only to IC)
    await pool.query(`
      INSERT INTO case_timeline (case_id, event_type, event_title, actor_id, actor_type, visible_to_employee, visible_to_ic)
      VALUES ($1, 'message_sent', 'New message from complainant', $2, 'employee', FALSE, TRUE)
    `, [caseId, userId]);

    return result.rows[0];
  },

  /**
   * Mark messages as read
   */
  async markMessagesRead(userId, caseId) {
    await this.verifyUserOwnsCase(userId, caseId);

    await pool.query(`
      UPDATE case_messages SET is_read = TRUE, read_at = NOW()
      WHERE case_id = $1 AND sender_type = 'ic_member' AND is_read = FALSE
    `, [caseId]);
  },

  // =============================================
  // RESOURCES
  // =============================================

  /**
   * Get FAQ and resources for employees
   */
  async getResources(organizationId = null) {
    // Get FAQs
    const faqResult = await pool.query(`
      SELECT id, title, content, sort_order
      FROM employee_resources
      WHERE resource_type = 'faq' AND is_active = TRUE
        AND (organization_id IS NULL OR organization_id = $1)
      ORDER BY sort_order, created_at
    `, [organizationId]);

    // Get helplines
    const helplineResult = await pool.query(`
      SELECT id, title, phone_number, available_hours
      FROM employee_resources
      WHERE resource_type = 'helpline' AND is_active = TRUE
        AND (organization_id IS NULL OR organization_id = $1)
      ORDER BY sort_order, created_at
    `, [organizationId]);

    // Get documents
    const documentResult = await pool.query(`
      SELECT id, title, url
      FROM employee_resources
      WHERE resource_type = 'document' AND is_active = TRUE
        AND (organization_id IS NULL OR organization_id = $1)
      ORDER BY sort_order, created_at
    `, [organizationId]);

    return {
      faq: faqResult.rows.map(row => ({
        question: row.title,
        answer: row.content
      })),
      helplines: helplineResult.rows.map(row => ({
        name: row.title,
        number: row.phone_number,
        available: row.available_hours
      })),
      documents: documentResult.rows.map(row => ({
        title: row.title,
        url: row.url
      }))
    };
  },

  // =============================================
  // IC MEMBER FUNCTIONS (for messaging from IC side)
  // =============================================

  /**
   * Send a message from IC to employee
   */
  async sendICMessage(caseId, icMemberId, content, attachments = []) {
    // Insert message
    const result = await pool.query(`
      INSERT INTO case_messages (
        case_id, sender_id, sender_type, sender_display_name,
        content, attachments
      ) VALUES ($1, $2, 'ic_member', 'IC Committee', $3, $4)
      RETURNING *
    `, [caseId, icMemberId, content, attachments]);

    // Add timeline event (visible only to employee)
    await pool.query(`
      INSERT INTO case_timeline (case_id, event_type, event_title, actor_id, actor_type, visible_to_employee, visible_to_ic)
      VALUES ($1, 'message_received', 'New message from IC Committee', $2, 'ic_member', TRUE, FALSE)
    `, [caseId, icMemberId]);

    return result.rows[0];
  },

  // =============================================
  // HELPERS
  // =============================================

  /**
   * Verify user owns a case
   */
  async verifyUserOwnsCase(userId, caseId) {
    const result = await pool.query(`
      SELECT id FROM cases WHERE id = $1 AND complainant_id = $2
    `, [caseId, userId]);

    if (result.rows.length === 0) {
      throw new Error('Case not found or access denied');
    }
  },

  /**
   * Categorize file by MIME type
   */
  categorizeFile(mimeType) {
    if (!mimeType) return 'other';
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType === 'application/pdf') return 'document';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'document';
    if (mimeType.includes('text/')) return 'document';
    return 'other';
  }
};

export default employeeService;
