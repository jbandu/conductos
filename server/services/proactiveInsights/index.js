import pool from '../../db/pg-init.js';
import { notificationService } from '../notificationService.js';

function firstRow(result) {
  return result?.rows?.[0] || null;
}

export class ProactiveInsightsEngine {
  async runInsightChecks(organizationId) {
    const insights = [];

    insights.push(...(await this.checkDeadlines(organizationId)));
    insights.push(...(await this.checkStalledCases(organizationId)));
    insights.push(...(await this.checkRiskEscalations(organizationId)));
    insights.push(...(await this.checkComplianceGaps(organizationId)));
    insights.push(...(await this.checkPendingActions(organizationId)));

    for (const insight of insights) {
      await this.storeInsight(insight);
    }

    return {
      total: insights.length,
      critical: insights.filter((i) => i.severity === 'critical').length,
      warnings: insights.filter((i) => i.severity === 'warning').length,
      info: insights.filter((i) => i.severity === 'info').length,
      insights
    };
  }

  async checkDeadlines(organizationId) {
    const insights = [];

    const upcoming = await pool.query(
      `SELECT c.*, (c.deadline_date - CURRENT_DATE) AS days_remaining
       FROM cases c
       WHERE c.organization_id = $1
         AND c.status NOT IN ('closed')
         AND c.deadline_date > CURRENT_DATE
         AND c.deadline_date <= CURRENT_DATE + INTERVAL '30 days'
       ORDER BY c.deadline_date ASC`,
      [organizationId]
    );

    for (const row of upcoming.rows) {
      let severity = 'info';
      let title = `Case ${row.case_code}: ${row.days_remaining} days to deadline`;

      if (row.days_remaining <= 7) {
        severity = 'critical';
        title = `URGENT: Case ${row.case_code} has only ${row.days_remaining} days remaining`;
      } else if (row.days_remaining <= 15) {
        severity = 'warning';
        title = `Case ${row.case_code} deadline approaching: ${row.days_remaining} days`;
      }

      const existing = await pool.query(
        `SELECT id FROM insights
         WHERE case_id = $1 AND insight_type = 'deadline_warning' AND status = 'active' AND severity = $2`,
        [row.id, severity]
      );

      if (!existing.rows.length) {
        insights.push({
          organization_id: organizationId,
          case_id: row.id,
          insight_type: 'deadline_warning',
          severity,
          title,
          description: `Case ${row.case_code} must be resolved by ${row.deadline_date}. Current status: ${row.status}.`,
          recommended_action: this.getDeadlineRecommendation(row.days_remaining, row.status),
          target_roles: ['presiding_officer', 'ic_member'],
          data: {
            case_code: row.case_code,
            days_remaining: row.days_remaining,
            deadline_date: row.deadline_date,
            current_status: row.status
          },
          expires_at: row.deadline_date
        });
      }
    }

    const overdue = await pool.query(
      `SELECT c.*, (CURRENT_DATE - c.deadline_date) AS days_overdue
       FROM cases c
       WHERE c.organization_id = $1
         AND c.status NOT IN ('closed')
         AND c.deadline_date < CURRENT_DATE`,
      [organizationId]
    );

    for (const row of overdue.rows) {
      insights.push({
        organization_id: organizationId,
        case_id: row.id,
        insight_type: 'deadline_warning',
        severity: 'critical',
        title: `OVERDUE: Case ${row.case_code} is ${row.days_overdue} days past deadline`,
        description: 'This case has exceeded the statutory deadline. Immediate action required.',
        recommended_action: 'Prioritize case closure and document reasons for delay.',
        target_roles: ['presiding_officer', 'hr_admin'],
        data: { case_code: row.case_code, days_overdue: row.days_overdue, deadline_date: row.deadline_date }
      });
    }

    return insights;
  }

  async checkStalledCases(organizationId) {
    const insights = [];

    const stalled = await pool.query(
      `SELECT c.*, (CURRENT_DATE - c.updated_at::date) AS days_since_update
       FROM cases c
       WHERE c.organization_id = $1
         AND c.status NOT IN ('closed', 'new')
         AND c.updated_at < CURRENT_DATE - INTERVAL '14 days'`,
      [organizationId]
    );

    for (const row of stalled.rows) {
      const severity = row.days_since_update > 21 ? 'warning' : 'info';
      insights.push({
        organization_id: organizationId,
        case_id: row.id,
        insight_type: 'stalled_case',
        severity,
        title: `Case ${row.case_code} has no activity for ${row.days_since_update} days`,
        description: `Status: ${row.status}. Consider checking progress.`,
        recommended_action: this.getStalledCaseRecommendation(row.status, row.days_since_update),
        target_roles: ['presiding_officer', 'ic_member'],
        data: { case_code: row.case_code, days_stalled: row.days_since_update }
      });
    }

    return insights;
  }

  async checkRiskEscalations(organizationId) {
    const insights = [];

    const riskCases = await pool.query(
      `SELECT c.*, cc.*
       FROM cases c
       JOIN case_characteristics cc ON c.id = cc.case_id
       WHERE c.organization_id = $1 AND c.status NOT IN ('closed')
         AND (cc.escalation_risk > 70 OR cc.retaliation_risk > 70 OR cc.complexity_score > 80)`,
      [organizationId]
    );

    for (const row of riskCases.rows) {
      const riskFactors = [];
      if (row.escalation_risk > 70) riskFactors.push(`High escalation risk (${row.escalation_risk}%)`);
      if (row.retaliation_risk > 70) riskFactors.push(`High retaliation risk (${row.retaliation_risk}%)`);
      if (row.complexity_score > 80) riskFactors.push(`High complexity (${row.complexity_score}%)`);

      insights.push({
        organization_id: organizationId,
        case_id: row.case_id,
        insight_type: 'risk_escalation',
        severity: 'warning',
        title: `Case ${row.case_code} has elevated risk factors`,
        description: `Risk factors detected: ${riskFactors.join(', ')}`,
        recommended_action: 'Review risk assessment and consider interim measures.',
        target_roles: ['presiding_officer'],
        data: {
          case_code: row.case_code,
          risk_scores: {
            escalation: row.escalation_risk,
            retaliation: row.retaliation_risk,
            complexity: row.complexity_score
          },
          risk_factors: riskFactors
        }
      });
    }

    return insights;
  }

  async checkComplianceGaps(organizationId) {
    const insights = [];

    const icCounts = firstRow(
      await pool.query(
        `SELECT 
          COUNT(*) FILTER (WHERE role = 'presiding_officer') AS po_count,
          COUNT(*) FILTER (WHERE role = 'internal_member') AS internal_count,
          COUNT(*) FILTER (WHERE role = 'external_member') AS external_count
        FROM ic_members
        WHERE organization_id = $1 AND is_active = TRUE`,
        [organizationId]
      )
    );

    if (icCounts?.po_count === 0) {
      insights.push({
        organization_id: organizationId,
        insight_type: 'compliance_gap',
        severity: 'critical',
        title: 'No Presiding Officer designated',
        description: 'IC must have a Presiding Officer as per Section 4 of PoSH Act.',
        recommended_action: 'Designate a senior woman employee as Presiding Officer immediately.',
        target_roles: ['hr_admin']
      });
    }

    if ((icCounts?.internal_count || 0) < 2) {
      insights.push({
        organization_id: organizationId,
        insight_type: 'compliance_gap',
        severity: 'warning',
        title: 'Insufficient internal IC members',
        description: `IC has ${icCounts?.internal_count || 0} internal member(s). Minimum 2 required.`,
        recommended_action: 'Appoint additional internal members committed to women\'s issues.',
        target_roles: ['hr_admin']
      });
    }

    if (icCounts?.external_count === 0) {
      insights.push({
        organization_id: organizationId,
        insight_type: 'compliance_gap',
        severity: 'critical',
        title: 'No External Member on IC',
        description: 'IC must include an external member from NGO or legal background.',
        recommended_action: 'Engage an external member familiar with sexual harassment issues.',
        target_roles: ['hr_admin']
      });
    }

    const reportCheck = firstRow(
      await pool.query(
        `SELECT MAX(report_year) AS last_report_year FROM annual_reports WHERE organization_id = $1`,
        [organizationId]
      )
    );
    const currentYear = new Date().getFullYear();
    if (!reportCheck?.last_report_year || reportCheck.last_report_year < currentYear - 1) {
      insights.push({
        organization_id: organizationId,
        insight_type: 'compliance_gap',
        severity: 'warning',
        title: 'Annual Report may be overdue',
        description: `Last annual report filed: ${reportCheck?.last_report_year || 'Never'}. Section 21 requires annual submission.`,
        recommended_action: 'Prepare and file annual report to District Officer.',
        target_roles: ['hr_admin', 'presiding_officer']
      });
    }

    return insights;
  }

  async checkPendingActions(organizationId) {
    const insights = [];

    const newCases = await pool.query(
      `SELECT c.* FROM cases c
       WHERE c.organization_id = $1 AND c.status = 'new' AND c.created_at < CURRENT_TIMESTAMP - INTERVAL '3 days'`,
      [organizationId]
    );

    for (const row of newCases.rows) {
      insights.push({
        organization_id: organizationId,
        case_id: row.id,
        insight_type: 'action_required',
        severity: 'warning',
        title: `Case ${row.case_code} awaiting initial review`,
        description: 'New complaint filed 3+ days ago. Acknowledgment should be sent within 7 days.',
        recommended_action: 'Review complaint and send acknowledgment. Update status to under_review.',
        target_roles: ['presiding_officer'],
        data: { case_code: row.case_code, filed_date: row.created_at }
      });
    }

    const conciliationPending = await pool.query(
      `SELECT c.* FROM cases c
       WHERE c.organization_id = $1 AND c.conciliation_requested = TRUE
         AND c.status = 'under_review' AND c.created_at < CURRENT_TIMESTAMP - INTERVAL '7 days'`,
      [organizationId]
    );

    for (const row of conciliationPending.rows) {
      insights.push({
        organization_id: organizationId,
        case_id: row.id,
        insight_type: 'action_required',
        severity: 'info',
        title: `Case ${row.case_code}: Conciliation requested`,
        description: 'Complainant requested conciliation. Decide whether to proceed per Section 10.',
        recommended_action: 'Initiate conciliation or proceed to inquiry.',
        target_roles: ['presiding_officer', 'ic_member'],
        data: { case_code: row.case_code }
      });
    }

    return insights;
  }

  async storeInsight(insight) {
    const result = await pool.query(
      `INSERT INTO insights (
        organization_id, case_id, insight_type, severity, title, description,
        recommended_action, target_roles, data, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id`,
      [
        insight.organization_id,
        insight.case_id || null,
        insight.insight_type,
        insight.severity,
        insight.title,
        insight.description,
        insight.recommended_action,
        insight.target_roles,
        insight.data ? JSON.stringify(insight.data) : {},
        insight.expires_at || null
      ]
    );

    return result.rows[0].id;
  }

  async getInsightsForUser(userId, organizationId) {
    const user = firstRow(await pool.query('SELECT role FROM users WHERE id = $1', [userId]));

    const insights = await pool.query(
      `SELECT * FROM insights
       WHERE organization_id = $1 AND status = 'active'
         AND $2 = ANY(target_roles)
         AND (expires_at IS NULL OR expires_at > NOW())
       ORDER BY CASE severity WHEN 'critical' THEN 1 WHEN 'warning' THEN 2 ELSE 3 END, created_at DESC`,
      [organizationId, user?.role]
    );

    return insights.rows;
  }

  async acknowledgeInsight(insightId, userId) {
    await pool.query(
      `UPDATE insights
       SET status = 'acknowledged', acknowledged_by = $2, acknowledged_at = NOW()
       WHERE id = $1`,
      [insightId, userId]
    );
  }

  async generateDailyDigest(organizationId) {
    await this.runInsightChecks(organizationId);

    const insights = await pool.query(
      `SELECT * FROM insights
       WHERE organization_id = $1 AND status = 'active'
         AND created_at > CURRENT_DATE - INTERVAL '1 day'
       ORDER BY severity, created_at DESC`,
      [organizationId]
    );

    const stats = firstRow(
      await pool.query(
        `SELECT 
          COUNT(*) FILTER (WHERE status NOT IN ('closed')) AS active_cases,
          COUNT(*) FILTER (WHERE status = 'new') AS new_cases,
          COUNT(*) FILTER (WHERE deadline_date < CURRENT_DATE AND status NOT IN ('closed')) AS overdue_cases,
          COUNT(*) FILTER (WHERE deadline_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 7 AND status NOT IN ('closed')) AS due_this_week
        FROM cases
        WHERE organization_id = $1`,
        [organizationId]
      )
    );

    return {
      date: new Date(),
      organization_id: organizationId,
      summary: {
        active_cases: stats?.active_cases || 0,
        new_cases: stats?.new_cases || 0,
        overdue_cases: stats?.overdue_cases || 0,
        due_this_week: stats?.due_this_week || 0
      },
      insights: {
        critical: insights.rows.filter((i) => i.severity === 'critical'),
        warnings: insights.rows.filter((i) => i.severity === 'warning'),
        info: insights.rows.filter((i) => i.severity === 'info')
      },
      recommendations: this.generateDailyRecommendations(stats || {}, insights.rows)
    };
  }

  getDeadlineRecommendation(daysRemaining, status) {
    if (daysRemaining <= 7) {
      return 'Schedule final inquiry sessions immediately and prepare draft report.';
    }
    if (daysRemaining <= 15) {
      return 'Ensure witness examinations are scheduled and draft findings.';
    }
    return 'Review case progress and address blockers.';
  }

  getStalledCaseRecommendation(status, daysSinceUpdate) {
    switch (status) {
      case 'under_review':
        return 'Complete initial review and decide on conciliation vs inquiry path.';
      case 'investigating':
        return 'Check if pending witness sessions need scheduling. Review evidence status.';
      case 'decision_pending':
        return 'Finalize inquiry report and submit recommendations.';
      default:
        return `Review case and update status. Stalled for ${daysSinceUpdate} days.`;
    }
  }

  generateDailyRecommendations(stats, insights) {
    const recs = [];

    if ((stats.overdue_cases || 0) > 0) {
      recs.push(`Prioritize ${stats.overdue_cases} overdue case(s) - compliance risk.`);
    }
    if ((stats.due_this_week || 0) > 0) {
      recs.push(`${stats.due_this_week} case(s) due this week - schedule closing activities.`);
    }
    const criticalCount = insights.filter((i) => i.severity === 'critical').length;
    if (criticalCount > 0) {
      recs.push(`Address ${criticalCount} critical item(s) requiring immediate attention.`);
    }

    return recs;
  }
}

export const proactiveInsightsEngine = new ProactiveInsightsEngine();
