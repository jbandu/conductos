import db from '../../db/pg-init.js';

/**
 * Lightweight External Member service. Provides read-only dashboards and case views
 * so external IC members can work across multiple organizations without juggling logins.
 */
export class ExternalMemberService {
  async getProfile(userId) {
    return db.query(
      'SELECT * FROM external_member_profiles WHERE user_id = $1 LIMIT 1',
      [userId]
    ).then((res) => res.rows[0] || null);
  }

  async getDashboard(userId) {
    const profile = await this.getProfile(userId);
    if (!profile) {
      throw new Error('External member profile not found');
    }

    const appointments = await db.query(
      `SELECT ema.*, o.name AS organization_name, o.logo_url,
              (SELECT COUNT(*) FROM cases c WHERE c.organization_id = ema.organization_id AND c.status <> 'closed') AS active_cases,
              (SELECT COUNT(*) FROM cases c WHERE c.organization_id = ema.organization_id AND c.status <> 'closed' AND c.deadline_date < CURRENT_DATE) AS overdue_cases
       FROM external_member_appointments ema
       JOIN organizations o ON ema.organization_id = o.id
       WHERE ema.external_member_id = $1 AND ema.status = 'active'
       ORDER BY o.name`,
      [profile.id]
    );

    const pendingCases = await db.query(
      `SELECT c.*, o.name AS organization_name, (c.deadline_date - CURRENT_DATE) AS days_remaining
       FROM cases c
       JOIN organizations o ON c.organization_id = o.id
       JOIN external_member_appointments ema ON ema.organization_id = c.organization_id
       WHERE ema.external_member_id = $1 AND ema.status = 'active' AND c.status <> 'closed'
       ORDER BY c.deadline_date ASC
       LIMIT 20`,
      [profile.id]
    );

    const upcomingSessions = await db.query(
      `SELECT s.*, c.case_code, o.name AS organization_name
       FROM interview_sessions s
       JOIN cases c ON s.case_id = c.id
       JOIN organizations o ON c.organization_id = o.id
       JOIN external_member_appointments ema ON ema.organization_id = c.organization_id
       WHERE ema.external_member_id = $1 AND ema.status = 'active'
         AND s.scheduled_date >= CURRENT_DATE
         AND s.status IN ('scheduled', 'confirmed')
       ORDER BY s.scheduled_date, s.scheduled_time
       LIMIT 10`,
      [profile.id]
    );

    const recentActivity = await db.query(
      `SELECT ema.*, o.name AS organization_name
       FROM external_member_activity ema
       JOIN organizations o ON ema.organization_id = o.id
       WHERE ema.external_member_id = $1
       ORDER BY ema.created_at DESC
       LIMIT 10`,
      [profile.id]
    );

    return {
      profile,
      appointments: appointments.rows,
      pendingCases: pendingCases.rows,
      upcomingSessions: upcomingSessions.rows,
      recentActivity: recentActivity.rows,
      stats: {
        totalOrganizations: appointments.rows.length,
        totalActiveCases: appointments.rows.reduce((sum, row) => sum + Number(row.active_cases || 0), 0),
        totalOverdueCases: appointments.rows.reduce((sum, row) => sum + Number(row.overdue_cases || 0), 0),
        upcomingSessionsCount: upcomingSessions.rows.length,
      },
    };
  }

  async verifyAccess(userId, organizationId) {
    const profile = await this.getProfile(userId);
    if (!profile) return null;
    const appointment = await db.query(
      `SELECT * FROM external_member_appointments
       WHERE external_member_id = $1 AND organization_id = $2 AND status = 'active'
       LIMIT 1`,
      [profile.id, organizationId]
    );
    if (appointment.rows.length === 0) return null;
    return { profile, appointment: appointment.rows[0] };
  }

  async getOrganizationCases(userId, organizationId, filters = {}) {
    const access = await this.verifyAccess(userId, organizationId);
    if (!access) throw new Error('Access denied');

    const params = [organizationId];
    let filterClause = '';
    if (filters.status) {
      params.push(filters.status);
      filterClause += ` AND c.status = $${params.length}`;
    }
    if (filters.overdue) {
      filterClause += " AND c.deadline_date < CURRENT_DATE AND c.status <> 'closed'";
    }

    const cases = await db.query(
      `SELECT c.id, c.case_code, c.status, c.incident_date, c.created_at, c.deadline_date,
              (c.deadline_date - CURRENT_DATE) AS days_remaining,
              c.conciliation_requested, c.is_anonymous, c.anonymous_alias,
              cc.complexity_score, cc.escalation_risk
       FROM cases c
       LEFT JOIN case_characteristics cc ON c.id = cc.case_id
       WHERE c.organization_id = $1 ${filterClause}
       ORDER BY c.deadline_date ASC`,
      params
    );

    const organization = await db.query(
      'SELECT id, name, logo_url FROM organizations WHERE id = $1',
      [organizationId]
    );

    await this.logActivity(access.appointment.external_member_id, organizationId, null, 'viewed_case_list');

    return {
      organization: organization.rows[0],
      cases: cases.rows,
      canViewIdentities: Boolean(access.appointment.can_view_identities),
    };
  }

  async getCaseDetail(userId, caseId) {
    const caseRow = await db.query(
      `SELECT c.*, o.id AS org_id FROM cases c
       JOIN organizations o ON c.organization_id = o.id
       WHERE c.id = $1`,
      [caseId]
    ).then((res) => res.rows[0]);

    if (!caseRow) throw new Error('Case not found');
    const access = await this.verifyAccess(userId, caseRow.org_id);
    if (!access) throw new Error('Access denied');

    const detail = {
      case_code: caseRow.case_code,
      status: caseRow.status,
      incident_date: caseRow.incident_date,
      description: caseRow.description,
      deadline_date: caseRow.deadline_date,
      days_remaining: caseRow.deadline_date ? Number((caseRow.deadline_date - new Date()) / 86400000) : null,
      conciliation_requested: caseRow.conciliation_requested,
      created_at: caseRow.created_at,
    };

    if (caseRow.is_anonymous) {
      detail.complainant = caseRow.anonymous_alias;
      detail.is_anonymous = true;
    } else if (access.appointment.can_view_identities) {
      detail.complainant = caseRow.complainant_name;
      detail.complainant_email = caseRow.complainant_email;
    } else {
      detail.complainant = '[Identity Protected]';
    }

    const history = await db.query(
      'SELECT * FROM status_history WHERE case_id = $1 ORDER BY changed_at DESC',
      [caseId]
    );
    const witnesses = await db.query(
      'SELECT witness_code, witness_type, status, examined_on FROM witnesses WHERE case_id = $1',
      [caseId]
    );
    const evidence = await db.query(
      `SELECT id, evidence_type, description, created_at, ai_summary
       FROM evidence WHERE case_id = $1 AND access_level <> 'po_only'`,
      [caseId]
    );

    await this.logActivity(access.appointment.external_member_id, caseRow.org_id, caseId, 'viewed_case');

    return {
      case: { ...detail, history: history.rows, witnesses: witnesses.rows, evidence: evidence.rows },
      canViewIdentities: Boolean(access.appointment.can_view_identities),
      canDownloadEvidence: false,
    };
  }

  async getPendingFees(userId) {
    const profile = await this.getProfile(userId);
    if (!profile) throw new Error('External member profile not found');

    const fees = await db.query(
      `SELECT emf.*, o.name AS organization_name, c.case_code
       FROM external_member_fees emf
       JOIN external_member_appointments ema ON emf.appointment_id = ema.id
       JOIN organizations o ON ema.organization_id = o.id
       LEFT JOIN cases c ON emf.case_id = c.id
       WHERE ema.external_member_id = $1
       ORDER BY emf.created_at DESC`,
      [profile.id]
    );

    const pending = fees.rows.filter((f) => ['pending', 'approved'].includes(f.status));
    const paid = fees.rows.filter((f) => f.status === 'paid');

    return {
      pending,
      paid,
      totalPending: pending.reduce((sum, f) => sum + Number(f.fee_amount || 0), 0),
      totalPaid: paid.reduce((sum, f) => sum + Number(f.fee_amount || 0), 0),
    };
  }

  async updateProfile(userId, updates) {
    const profile = await this.getProfile(userId);
    if (!profile) throw new Error('External member profile not found');

    const result = await db.query(
      `UPDATE external_member_profiles
       SET phone = COALESCE($2, phone),
           designation = COALESCE($3, designation),
           organization_affiliation = COALESCE($4, organization_affiliation),
           expertise_areas = COALESCE($5, expertise_areas),
           bio = COALESCE($6, bio),
           linkedin_url = COALESCE($7, linkedin_url),
           updated_at = NOW()
       WHERE user_id = $1
       RETURNING *`,
      [
        userId,
        updates?.phone,
        updates?.designation,
        updates?.organizationAffiliation,
        updates?.expertiseAreas,
        updates?.bio,
        updates?.linkedinUrl,
      ]
    );

    return result.rows[0];
  }

  async logActivity(externalMemberId, organizationId, caseId, activityType, details = {}) {
    await db.query(
      `INSERT INTO external_member_activity (external_member_id, organization_id, case_id, activity_type, activity_details)
       VALUES ($1, $2, $3, $4, $5)`,
      [externalMemberId, organizationId, caseId, activityType, details]
    );
  }
}

export default new ExternalMemberService();
