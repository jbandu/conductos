import { db } from '../../db/client.js';
import { notificationService } from '../notificationService.js';

const TOKEN_PRICING = {
  'claude-sonnet-4-20250514': { input: 0.003, output: 0.015 },
  'claude-haiku-3-5-20241022': { input: 0.00025, output: 0.00125 }
};

export class MonitoringService {
  async logRequest(entry) {
    await db.query(
      `INSERT INTO api_request_logs (
        method, path, status_code, response_time_ms,
        user_id, organization_id, ip_address, user_agent,
        error_message, request_size, response_size
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [
        entry.method,
        entry.path,
        entry.statusCode,
        entry.responseTimeMs,
        entry.userId || null,
        entry.organizationId || null,
        entry.ipAddress || null,
        entry.userAgent || null,
        entry.errorMessage || null,
        entry.requestSize || null,
        entry.responseSize || null
      ]
    );
  }

  async logAiUsage(usage) {
    const pricing = TOKEN_PRICING[usage.model] || TOKEN_PRICING['claude-sonnet-4-20250514'];
    const estimatedCost =
      (usage.inputTokens / 1000) * pricing.input + (usage.outputTokens / 1000) * pricing.output;

    await db.query(
      `INSERT INTO ai_usage_logs (
        organization_id, user_id, case_id, model, agent_type,
        input_tokens, output_tokens, estimated_cost_usd,
        response_time_ms, tool_calls, request_type
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [
        usage.organizationId,
        usage.userId,
        usage.caseId || null,
        usage.model,
        usage.agentType || null,
        usage.inputTokens,
        usage.outputTokens,
        estimatedCost,
        usage.responseTimeMs,
        usage.toolCalls || 0,
        usage.requestType || 'chat'
      ]
    );
  }

  async getDashboardMetrics() {
    const apiHealth = await db.queryOne(`
      SELECT 
        COUNT(*) AS total_requests,
        COUNT(*) FILTER (WHERE status_code >= 500) AS errors,
        AVG(response_time_ms) AS avg_response_time,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time_ms) AS p95,
        PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY response_time_ms) AS p99
      FROM api_request_logs
      WHERE created_at > NOW() - INTERVAL '5 minutes'
    `);

    const aiUsage = await db.queryOne(`
      SELECT COUNT(*) AS total_requests, SUM(total_tokens) AS total_tokens,
             SUM(estimated_cost_usd) AS total_cost, AVG(response_time_ms) AS avg_response_time
      FROM ai_usage_logs
      WHERE created_at > NOW() - INTERVAL '1 hour'
    `);

    const activeUsers = await db.queryOne(`
      SELECT COUNT(DISTINCT user_id) AS count
      FROM api_request_logs
      WHERE created_at > NOW() - INTERVAL '15 minutes' AND user_id IS NOT NULL
    `);

    const activeAlerts = await db.query(
      `SELECT * FROM monitoring_alerts WHERE status='active' ORDER BY severity DESC, created_at DESC LIMIT 10`
    );

    const requestRate = await db.query(`
      SELECT date_trunc('minute', created_at) AS minute,
             COUNT(*) AS requests,
             COUNT(*) FILTER (WHERE status_code >= 400) AS errors
      FROM api_request_logs
      WHERE created_at > NOW() - INTERVAL '1 hour'
      GROUP BY 1
      ORDER BY 1
    `);

    return {
      apiHealth: {
        totalRequests: Number(apiHealth.total_requests || 0),
        errorRate:
          Number(apiHealth.total_requests || 0) === 0
            ? '0.00'
            : ((Number(apiHealth.errors || 0) / Number(apiHealth.total_requests)) * 100).toFixed(2),
        avgResponseTime: Math.round(apiHealth.avg_response_time || 0),
        p95ResponseTime: Math.round(apiHealth.p95 || 0),
        p99ResponseTime: Math.round(apiHealth.p99 || 0)
      },
      aiUsage: {
        totalRequests: Number(aiUsage.total_requests || 0),
        totalTokens: Number(aiUsage.total_tokens || 0),
        totalCost: Number(aiUsage.total_cost || 0).toFixed(4),
        avgResponseTime: Math.round(aiUsage.avg_response_time || 0)
      },
      activeUsers: Number(activeUsers.count || 0),
      activeAlerts: activeAlerts.rows,
      requestRate: requestRate.rows
    };
  }

  async getBusinessAnalytics(organizationId, days = 30) {
    const caseFunnel = await db.query(
      `SELECT status, COUNT(*) AS count FROM cases WHERE organization_id=$1 GROUP BY status`,
      [organizationId]
    );

    const resolutionTrend = await db.query(
      `SELECT date_trunc('week', created_at) AS week,
              AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 86400) AS avg_days,
              COUNT(*) AS cases_closed
       FROM cases
       WHERE organization_id=$1 AND status='closed' AND created_at > NOW() - INTERVAL '${days} days'
       GROUP BY 1 ORDER BY 1`,
      [organizationId]
    );

    const compliance = await db.queryOne(
      `SELECT COUNT(*) AS total_cases,
              COUNT(*) FILTER (WHERE deadline_date >= updated_at OR status != 'closed') AS on_time,
              COUNT(*) FILTER (WHERE deadline_date < CURRENT_DATE AND status != 'closed') AS overdue
       FROM cases
       WHERE organization_id=$1 AND created_at > NOW() - INTERVAL '${days} days'`,
      [organizationId]
    );

    const aiByType = await db.query(
      `SELECT agent_type, COUNT(*) AS interactions, SUM(total_tokens) AS tokens, SUM(estimated_cost_usd) AS cost
       FROM ai_usage_logs WHERE organization_id=$1 AND created_at > NOW() - INTERVAL '${days} days'
       GROUP BY agent_type`,
      [organizationId]
    );

    return {
      caseFunnel: caseFunnel.rows,
      resolutionTrend: resolutionTrend.rows,
      compliance: {
        total: Number(compliance.total_cases || 0),
        onTime: Number(compliance.on_time || 0),
        overdue: Number(compliance.overdue || 0),
        complianceRate:
          Number(compliance.total_cases || 0) === 0
            ? '100.0'
            : ((Number(compliance.on_time || 0) / Number(compliance.total_cases)) * 100).toFixed(1)
      },
      aiUsageByType: aiByType.rows
    };
  }

  async getAiCostBreakdown(organizationId, days = 30) {
    const byDay = await db.query(
      `SELECT DATE(created_at) AS date, SUM(total_tokens) AS tokens, SUM(estimated_cost_usd) AS cost
       FROM ai_usage_logs WHERE organization_id=$1 AND created_at > NOW() - INTERVAL '${days} days'
       GROUP BY 1 ORDER BY 1`,
      [organizationId]
    );

    const totals = await db.queryOne(
      `SELECT COUNT(*) AS total_requests, SUM(total_tokens) AS total_tokens, SUM(estimated_cost_usd) AS total_cost,
              AVG(total_tokens) AS avg_tokens_per_request
       FROM ai_usage_logs WHERE organization_id=$1 AND created_at > NOW() - INTERVAL '${days} days'`,
      [organizationId]
    );

    return {
      byDay: byDay.rows,
      totals: {
        requests: Number(totals.total_requests || 0),
        tokens: Number(totals.total_tokens || 0),
        cost: Number(totals.total_cost || 0),
        avgTokensPerRequest: Math.round(totals.avg_tokens_per_request || 0)
      }
    };
  }

  async createAlert(alert) {
    const created = await db.queryOne(
      `INSERT INTO monitoring_alerts (
        alert_type, severity, triggered_value, threshold_value,
        organization_id, affected_resource, message, details
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [
        alert.alertType,
        alert.severity,
        alert.triggeredValue || null,
        alert.thresholdValue || null,
        alert.organizationId || null,
        alert.affectedResource || null,
        alert.message,
        JSON.stringify(alert.details || {})
      ]
    );

    await notificationService.queue?.('monitoring_alert', 'admin@conductos.in', {
      severity: created.severity,
      message: created.message
    });

    return created;
  }

  async acknowledgeAlert(alertId, userId) {
    return db.queryOne(
      `UPDATE monitoring_alerts SET status='acknowledged', acknowledged_by=$2, acknowledged_at=NOW()
       WHERE id=$1 RETURNING *`,
      [alertId, userId]
    );
  }

  async resolveAlert(alertId) {
    return db.queryOne(
      `UPDATE monitoring_alerts SET status='resolved', resolved_at=NOW() WHERE id=$1 RETURNING *`,
      [alertId]
    );
  }

  async aggregateDailyMetrics() {
    const orgs = await db.query('SELECT id FROM organizations WHERE is_active = TRUE');
    for (const org of orgs.rows) {
      const metrics = await db.queryOne(
        `SELECT 
          COUNT(*) AS total_cases,
          COUNT(*) FILTER (WHERE DATE(created_at)=CURRENT_DATE) AS new_cases,
          COUNT(*) FILTER (WHERE status='closed' AND DATE(updated_at)=CURRENT_DATE) AS closed_cases,
          COUNT(*) FILTER (WHERE deadline_date < CURRENT_DATE AND status NOT IN ('closed')) AS overdue_cases
        FROM cases WHERE organization_id=$1`,
        [org.id]
      );

      await db.query(
        `INSERT INTO business_metrics_daily (
          organization_id, metric_date, total_cases, new_cases, closed_cases, overdue_cases, compliance_score
        ) VALUES ($1, CURRENT_DATE, $2, $3, $4, $5, $6)
        ON CONFLICT (organization_id, metric_date) DO UPDATE SET
          total_cases=EXCLUDED.total_cases,
          new_cases=EXCLUDED.new_cases,
          closed_cases=EXCLUDED.closed_cases,
          overdue_cases=EXCLUDED.overdue_cases,
          compliance_score=EXCLUDED.compliance_score`,
        [
          org.id,
          metrics.total_cases,
          metrics.new_cases,
          metrics.closed_cases,
          metrics.overdue_cases,
          metrics.total_cases > 0
            ? ((Number(metrics.total_cases) - Number(metrics.overdue_cases)) / Number(metrics.total_cases)) * 100
            : 100
        ]
      );
    }
  }
}
