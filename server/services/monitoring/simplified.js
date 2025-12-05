import db from '../../db/pg-init.js';

export async function getDashboardMetrics() {
  try {
    // API Health - get data from last 24 hours
    const apiHealthResult = await db.query(`
      SELECT
        COUNT(*) AS total_requests,
        COUNT(*) FILTER (WHERE status_code >= 500) AS errors,
        AVG(duration_ms) AS avg_response_time,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms) AS p95,
        PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY duration_ms) AS p99
      FROM api_request_logs
      WHERE timestamp > NOW() - INTERVAL '24 hours'
    `);
    const apiHealth = apiHealthResult.rows[0] || {};

    // AI Usage - sum input and output tokens
    const aiUsageResult = await db.query(`
      SELECT
        COUNT(*) AS total_calls,
        SUM(input_tokens) AS total_input_tokens,
        SUM(output_tokens) AS total_output_tokens,
        SUM(estimated_cost_usd) AS total_cost
      FROM ai_usage_logs
      WHERE created_at > NOW() - INTERVAL '24 hours'
    `);
    const aiUsage = aiUsageResult.rows[0] || {};

    // Get recent requests for the table
    const recentRequestsResult = await db.query(`
      SELECT method, endpoint, status_code, duration_ms, timestamp
      FROM api_request_logs
      ORDER BY timestamp DESC
      LIMIT 20
    `);

    // Get active alerts
    const activeAlertsResult = await db.query(
      `SELECT * FROM monitoring_alerts WHERE status='active' ORDER BY severity DESC, created_at DESC LIMIT 10`
    );

    return {
      apiHealth: {
        totalRequests: Number(apiHealth.total_requests || 0),
        errorRate:
          Number(apiHealth.total_requests || 0) === 0
            ? 0
            : ((Number(apiHealth.errors || 0) / Number(apiHealth.total_requests)) * 100),
        avgResponseTime: Number(apiHealth.avg_response_time || 0),
        p95Latency: Number(apiHealth.p95 || 0),
        p99Latency: Number(apiHealth.p99 || 0)
      },
      aiUsage: {
        totalCalls: Number(aiUsage.total_calls || 0),
        totalInputTokens: Number(aiUsage.total_input_tokens || 0),
        totalOutputTokens: Number(aiUsage.total_output_tokens || 0),
        estimatedCost: Number(aiUsage.total_cost || 0)
      },
      recentRequests: recentRequestsResult.rows,
      alerts: activeAlertsResult.rows
    };
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    throw error;
  }
}
