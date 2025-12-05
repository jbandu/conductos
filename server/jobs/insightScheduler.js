import cron from 'node-cron';
import pool from '../db/pg-init.js';
import { ProactiveInsightsEngine } from '../services/proactiveInsights/index.js';
import { notificationService } from '../services/notificationService.js';

const insightsEngine = new ProactiveInsightsEngine();

async function notifyForCriticalInsights(orgId, criticalInsights) {
  const recipients = await pool.query(
    `SELECT u.id, u.email, u.full_name
     FROM users u
     WHERE u.organization_id = $1
       AND u.role IN ('presiding_officer', 'hr_admin')
       AND u.is_active = TRUE`,
    [orgId]
  );

  for (const recipient of recipients.rows) {
    await notificationService.queue('critical_insights', recipient.email, {
      recipient_name: recipient.full_name,
      insights: criticalInsights,
      dashboard_url: `${process.env.BASE_URL || ''}/dashboard`
    });
  }
}

async function sendDailyDigest(orgId, digest) {
  const recipients = await pool.query(
    `SELECT u.id, u.email, u.full_name
     FROM users u
     WHERE u.organization_id = $1
       AND u.role IN ('presiding_officer', 'ic_member', 'hr_admin')
       AND u.is_active = TRUE`,
    [orgId]
  );

  for (const recipient of recipients.rows) {
    await notificationService.queue('daily_digest', recipient.email, {
      recipient_name: recipient.full_name,
      date: digest.date,
      ...digest.summary,
      critical_insights: digest.insights.critical,
      warnings: digest.insights.warnings,
      recommendations: digest.recommendations,
      dashboard_url: `${process.env.BASE_URL || ''}/dashboard`
    });
  }
}

cron.schedule('0 */4 * * *', async () => {
  const organizations = await pool.query('SELECT id FROM organizations WHERE is_active = TRUE');

  for (const org of organizations.rows) {
    try {
      const summary = await insightsEngine.runInsightChecks(org.id);
      if (summary.critical > 0) {
        await notifyForCriticalInsights(org.id, summary.insights.filter((i) => i.severity === 'critical'));
      }
    } catch (error) {
      console.error(`Error running insight checks for org ${org.id}:`, error);
    }
  }
});

cron.schedule('0 8 * * *', async () => {
  const organizations = await pool.query('SELECT id FROM organizations WHERE is_active = TRUE');

  for (const org of organizations.rows) {
    try {
      const digest = await insightsEngine.generateDailyDigest(org.id);
      await sendDailyDigest(org.id, digest);
    } catch (error) {
      console.error(`Error generating digest for org ${org.id}:`, error);
    }
  }
});
