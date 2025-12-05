import express from 'express';
import pool from '../../db/pg-init.js';
import { authenticateToken, requireRole } from '../../middleware/auth.js';

const router = express.Router();

// All routes require admin authentication
router.use(authenticateToken);
router.use(requireRole(['hr_admin']));

/**
 * GET /api/admin/audit-log
 * Get audit log entries with filtering and pagination
 *
 * Query parameters:
 * - admin_id: Filter by admin who performed the action
 * - action: Filter by action type (create_user, update_user, etc.)
 * - target_type: Filter by target type (user, ic_member, etc.)
 * - start_date: Filter entries after this date (ISO format)
 * - end_date: Filter entries before this date (ISO format)
 * - limit: Number of entries to return (default: 100, max: 1000)
 * - offset: Pagination offset (default: 0)
 */
router.get('/', async (req, res) => {
  try {
    const {
      admin_id,
      action,
      target_type,
      start_date,
      end_date,
      limit = 100,
      offset = 0
    } = req.query;

    // Build query with filters
    let query = `
      SELECT
        aal.id,
        aal.admin_id,
        admin_user.full_name as admin_name,
        admin_user.email as admin_email,
        aal.action,
        aal.target_type,
        aal.target_id,
        aal.old_value,
        aal.new_value,
        aal.ip_address,
        aal.user_agent,
        aal.created_at,
        target_user.full_name as target_user_name,
        target_user.email as target_user_email
      FROM admin_audit_log aal
      LEFT JOIN users admin_user ON aal.admin_id = admin_user.id
      LEFT JOIN users target_user ON aal.target_id = target_user.id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    // Add filters
    if (admin_id) {
      query += ` AND aal.admin_id = $${paramCount}`;
      params.push(admin_id);
      paramCount++;
    }

    if (action) {
      query += ` AND aal.action = $${paramCount}`;
      params.push(action);
      paramCount++;
    }

    if (target_type) {
      query += ` AND aal.target_type = $${paramCount}`;
      params.push(target_type);
      paramCount++;
    }

    if (start_date) {
      query += ` AND aal.created_at >= $${paramCount}`;
      params.push(start_date);
      paramCount++;
    }

    if (end_date) {
      query += ` AND aal.created_at <= $${paramCount}`;
      params.push(end_date);
      paramCount++;
    }

    // Order by most recent first
    query += ` ORDER BY aal.created_at DESC`;

    // Add pagination
    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(Math.min(parseInt(limit), 1000), parseInt(offset));

    const result = await pool.query(query, params);

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM admin_audit_log aal
      WHERE 1=1
    `;
    const countParams = [];
    let countParamCount = 1;

    if (admin_id) {
      countQuery += ` AND aal.admin_id = $${countParamCount}`;
      countParams.push(admin_id);
      countParamCount++;
    }

    if (action) {
      countQuery += ` AND aal.action = $${countParamCount}`;
      countParams.push(action);
      countParamCount++;
    }

    if (target_type) {
      countQuery += ` AND aal.target_type = $${countParamCount}`;
      countParams.push(target_type);
      countParamCount++;
    }

    if (start_date) {
      countQuery += ` AND aal.created_at >= $${countParamCount}`;
      countParams.push(start_date);
      countParamCount++;
    }

    if (end_date) {
      countQuery += ` AND aal.created_at <= $${countParamCount}`;
      countParams.push(end_date);
      countParamCount++;
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    res.json({
      entries: result.rows,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        has_more: total > parseInt(offset) + parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching audit log:', error);
    res.status(500).json({ error: 'Failed to fetch audit log' });
  }
});

/**
 * GET /api/admin/audit-log/actions
 * Get list of distinct actions for filtering
 */
router.get('/actions', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT action
      FROM admin_audit_log
      ORDER BY action
    `);

    res.json({
      actions: result.rows.map(row => row.action)
    });
  } catch (error) {
    console.error('Error fetching actions:', error);
    res.status(500).json({ error: 'Failed to fetch actions' });
  }
});

/**
 * GET /api/admin/audit-log/stats
 * Get audit log statistics
 */
router.get('/stats', async (req, res) => {
  try {
    // Get activity over the last 30 days
    const result = await pool.query(`
      SELECT
        COUNT(*) as total_actions,
        COUNT(DISTINCT admin_id) as active_admins,
        COUNT(DISTINCT action) as action_types,
        MIN(created_at) as earliest_entry,
        MAX(created_at) as latest_entry
      FROM admin_audit_log
      WHERE created_at >= NOW() - INTERVAL '30 days'
    `);

    // Get action breakdown
    const actionBreakdown = await pool.query(`
      SELECT
        action,
        COUNT(*) as count
      FROM admin_audit_log
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY action
      ORDER BY count DESC
    `);

    // Get most active admins
    const topAdmins = await pool.query(`
      SELECT
        admin_id,
        u.full_name,
        u.email,
        COUNT(*) as action_count
      FROM admin_audit_log aal
      LEFT JOIN users u ON aal.admin_id = u.id
      WHERE aal.created_at >= NOW() - INTERVAL '30 days'
      GROUP BY admin_id, u.full_name, u.email
      ORDER BY action_count DESC
      LIMIT 5
    `);

    res.json({
      summary: result.rows[0],
      action_breakdown: actionBreakdown.rows,
      top_admins: topAdmins.rows
    });
  } catch (error) {
    console.error('Error fetching audit log stats:', error);
    res.status(500).json({ error: 'Failed to fetch audit log stats' });
  }
});

/**
 * GET /api/admin/audit-log/:id
 * Get a specific audit log entry by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT
        aal.id,
        aal.admin_id,
        admin_user.full_name as admin_name,
        admin_user.email as admin_email,
        aal.action,
        aal.target_type,
        aal.target_id,
        aal.old_value,
        aal.new_value,
        aal.ip_address,
        aal.user_agent,
        aal.created_at,
        target_user.full_name as target_user_name,
        target_user.email as target_user_email
      FROM admin_audit_log aal
      LEFT JOIN users admin_user ON aal.admin_id = admin_user.id
      LEFT JOIN users target_user ON aal.target_id = target_user.id
      WHERE aal.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Audit log entry not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching audit log entry:', error);
    res.status(500).json({ error: 'Failed to fetch audit log entry' });
  }
});

export default router;
