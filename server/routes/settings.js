import express from 'express';
import pool from '../db/pg-init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * ============================================================================
 * COMMON USER PREFERENCES ENDPOINTS
 * ============================================================================
 */

/**
 * GET /api/settings
 * Get all user settings/preferences
 */
router.get('/', async (req, res) => {
  try {
    // First ensure user preferences exist
    await pool.query(`
      INSERT INTO user_preferences (user_id)
      VALUES ($1)
      ON CONFLICT (user_id) DO NOTHING
    `, [req.user.id]);

    const result = await pool.query(`
      SELECT
        up.*,
        u.role,
        u.email_verified,
        u.mfa_enabled,
        u.auth_provider,
        u.google_id IS NOT NULL as google_connected,
        prm.email_enabled as reset_email_enabled,
        prm.security_questions_enabled as reset_security_questions_enabled,
        prm.trusted_device_enabled as reset_trusted_device_enabled,
        prm.backup_codes_count
      FROM user_preferences up
      JOIN users u ON up.user_id = u.id
      LEFT JOIN password_reset_methods prm ON u.id = prm.user_id
      WHERE up.user_id = $1
    `, [req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Settings not found' });
    }

    const settings = result.rows[0];

    // Structure the response based on user role
    const response = {
      profile: {
        theme: settings.theme,
        language: settings.language,
        timezone: settings.timezone,
        dateFormat: settings.date_format,
        timeFormat: settings.time_format,
        emailVerified: settings.email_verified,
        mfaEnabled: settings.mfa_enabled,
        authProvider: settings.auth_provider,
        googleConnected: settings.google_connected
      },
      notifications: {
        emailNotifications: settings.email_notifications,
        pushNotifications: settings.push_notifications,
        notificationDigest: settings.notification_digest,
        quietHoursEnabled: settings.quiet_hours_enabled,
        quietHoursStart: settings.quiet_hours_start,
        quietHoursEnd: settings.quiet_hours_end
      },
      privacy: {
        profileVisibility: settings.profile_visibility,
        showOnlineStatus: settings.show_online_status,
        showLastActive: settings.show_last_active
      },
      security: {
        sessionTimeoutMinutes: settings.session_timeout_minutes,
        requireReauthentication: settings.require_reauthentication_for_sensitive,
        passwordResetMethods: {
          email: settings.reset_email_enabled,
          securityQuestions: settings.reset_security_questions_enabled,
          trustedDevice: settings.reset_trusted_device_enabled,
          backupCodesCount: settings.backup_codes_count
        }
      },
      accessibility: {
        highContrastMode: settings.high_contrast_mode,
        reduceMotion: settings.reduce_motion,
        fontSize: settings.font_size
      }
    };

    // Add employee-specific settings
    if (settings.role === 'employee') {
      response.employee = {
        reporting: {
          defaultAnonymousReporting: settings.default_anonymous_reporting,
          preferredContactMethod: settings.preferred_contact_method,
          saveDraftReports: settings.save_draft_reports
        },
        communication: {
          receiveCaseUpdates: settings.receive_case_updates,
          receiveDeadlineReminders: settings.receive_deadline_reminders,
          reminderDaysBefore: settings.reminder_days_before
        },
        support: {
          showSupportResources: settings.show_support_resources,
          preferredSupportLanguage: settings.preferred_support_language
        }
      };
    }

    // Add IC member-specific settings
    if (settings.role === 'ic_member') {
      response.icMember = {
        caseManagement: {
          defaultCaseView: settings.default_case_view,
          casesPerPage: settings.cases_per_page,
          autoAssignCases: settings.auto_assign_cases,
          showCasePriorityIndicators: settings.show_case_priority_indicators,
          pinnedCases: settings.pinned_cases || []
        },
        dashboard: {
          layout: settings.dashboard_layout
        },
        workflow: {
          autoAdvanceWorkflow: settings.auto_advance_workflow,
          requireNotesOnStatusChange: settings.require_notes_on_status_change,
          defaultInvestigationChecklist: settings.default_investigation_checklist
        },
        reminders: {
          reviewReminderFrequency: settings.review_reminder_frequency,
          customReminderDays: settings.custom_reminder_days || [1, 3, 7]
        },
        reporting: {
          defaultReportFormat: settings.default_report_format,
          includeTimelineInReports: settings.include_timeline_in_reports,
          autoGenerateSummary: settings.auto_generate_summary
        },
        calendar: {
          integrationEnabled: settings.calendar_integration_enabled,
          provider: settings.calendar_provider,
          workingHoursStart: settings.working_hours_start,
          workingHoursEnd: settings.working_hours_end,
          workingDays: settings.working_days || [1, 2, 3, 4, 5]
        },
        collaboration: {
          showTeamAvailability: settings.show_team_availability,
          allowCaseReassignment: settings.allow_case_reassignment,
          notifyOnTeamMentions: settings.notify_on_team_mentions
        },
        quickActions: {
          actions: settings.quick_actions,
          keyboardShortcutsEnabled: settings.keyboard_shortcuts_enabled
        },
        dataManagement: {
          exportIncludeAttachments: settings.export_include_attachments,
          defaultExportDateRange: settings.default_export_date_range
        },
        advanced: {
          betaFeaturesEnabled: settings.beta_features_enabled,
          customSettings: settings.custom_settings || {}
        }
      };
    }

    // Add HR admin-specific settings (similar to IC member with additional admin options)
    if (settings.role === 'hr_admin') {
      response.icMember = {
        caseManagement: {
          defaultCaseView: settings.default_case_view,
          casesPerPage: settings.cases_per_page,
          autoAssignCases: settings.auto_assign_cases,
          showCasePriorityIndicators: settings.show_case_priority_indicators,
          pinnedCases: settings.pinned_cases || []
        },
        dashboard: {
          layout: settings.dashboard_layout
        },
        workflow: {
          autoAdvanceWorkflow: settings.auto_advance_workflow,
          requireNotesOnStatusChange: settings.require_notes_on_status_change,
          defaultInvestigationChecklist: settings.default_investigation_checklist
        },
        reminders: {
          reviewReminderFrequency: settings.review_reminder_frequency,
          customReminderDays: settings.custom_reminder_days || [1, 3, 7]
        },
        reporting: {
          defaultReportFormat: settings.default_report_format,
          includeTimelineInReports: settings.include_timeline_in_reports,
          autoGenerateSummary: settings.auto_generate_summary
        },
        calendar: {
          integrationEnabled: settings.calendar_integration_enabled,
          provider: settings.calendar_provider,
          workingHoursStart: settings.working_hours_start,
          workingHoursEnd: settings.working_hours_end,
          workingDays: settings.working_days || [1, 2, 3, 4, 5]
        },
        collaboration: {
          showTeamAvailability: settings.show_team_availability,
          allowCaseReassignment: settings.allow_case_reassignment,
          notifyOnTeamMentions: settings.notify_on_team_mentions
        },
        quickActions: {
          actions: settings.quick_actions,
          keyboardShortcutsEnabled: settings.keyboard_shortcuts_enabled
        },
        dataManagement: {
          exportIncludeAttachments: settings.export_include_attachments,
          defaultExportDateRange: settings.default_export_date_range
        },
        advanced: {
          betaFeaturesEnabled: settings.beta_features_enabled,
          customSettings: settings.custom_settings || {}
        }
      };
    }

    res.json(response);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

/**
 * PATCH /api/settings/profile
 * Update profile/display settings
 */
router.patch('/profile', async (req, res) => {
  try {
    const allowedFields = ['theme', 'language', 'timezone', 'date_format', 'time_format'];
    const updates = {};
    const values = [];
    let paramCount = 1;

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = `$${paramCount}`;
        values.push(req.body[field]);
        paramCount++;
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const setClause = Object.entries(updates)
      .map(([key, param]) => `${key} = ${param}`)
      .join(', ');

    values.push(req.user.id);

    await pool.query(`
      UPDATE user_preferences
      SET ${setClause}, updated_at = NOW()
      WHERE user_id = $${paramCount}
    `, values);

    res.json({ message: 'Profile settings updated successfully' });
  } catch (error) {
    console.error('Error updating profile settings:', error);
    res.status(500).json({ error: 'Failed to update profile settings' });
  }
});

/**
 * PATCH /api/settings/notifications
 * Update notification settings
 */
router.patch('/notifications', async (req, res) => {
  try {
    const {
      emailNotifications,
      pushNotifications,
      notificationDigest,
      quietHoursEnabled,
      quietHoursStart,
      quietHoursEnd
    } = req.body;

    await pool.query(`
      UPDATE user_preferences
      SET
        email_notifications = COALESCE($1, email_notifications),
        push_notifications = COALESCE($2, push_notifications),
        notification_digest = COALESCE($3, notification_digest),
        quiet_hours_enabled = COALESCE($4, quiet_hours_enabled),
        quiet_hours_start = COALESCE($5, quiet_hours_start),
        quiet_hours_end = COALESCE($6, quiet_hours_end),
        updated_at = NOW()
      WHERE user_id = $7
    `, [
      emailNotifications,
      pushNotifications,
      notificationDigest,
      quietHoursEnabled,
      quietHoursStart,
      quietHoursEnd,
      req.user.id
    ]);

    res.json({ message: 'Notification settings updated successfully' });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({ error: 'Failed to update notification settings' });
  }
});

/**
 * PATCH /api/settings/privacy
 * Update privacy settings
 */
router.patch('/privacy', async (req, res) => {
  try {
    const { profileVisibility, showOnlineStatus, showLastActive } = req.body;

    await pool.query(`
      UPDATE user_preferences
      SET
        profile_visibility = COALESCE($1, profile_visibility),
        show_online_status = COALESCE($2, show_online_status),
        show_last_active = COALESCE($3, show_last_active),
        updated_at = NOW()
      WHERE user_id = $4
    `, [profileVisibility, showOnlineStatus, showLastActive, req.user.id]);

    res.json({ message: 'Privacy settings updated successfully' });
  } catch (error) {
    console.error('Error updating privacy settings:', error);
    res.status(500).json({ error: 'Failed to update privacy settings' });
  }
});

/**
 * PATCH /api/settings/security
 * Update security settings
 */
router.patch('/security', async (req, res) => {
  try {
    const { sessionTimeoutMinutes, requireReauthentication } = req.body;

    // Validate session timeout
    if (sessionTimeoutMinutes !== undefined) {
      if (sessionTimeoutMinutes < 5 || sessionTimeoutMinutes > 1440) {
        return res.status(400).json({
          error: 'Session timeout must be between 5 and 1440 minutes'
        });
      }
    }

    await pool.query(`
      UPDATE user_preferences
      SET
        session_timeout_minutes = COALESCE($1, session_timeout_minutes),
        require_reauthentication_for_sensitive = COALESCE($2, require_reauthentication_for_sensitive),
        updated_at = NOW()
      WHERE user_id = $3
    `, [sessionTimeoutMinutes, requireReauthentication, req.user.id]);

    res.json({ message: 'Security settings updated successfully' });
  } catch (error) {
    console.error('Error updating security settings:', error);
    res.status(500).json({ error: 'Failed to update security settings' });
  }
});

/**
 * PATCH /api/settings/accessibility
 * Update accessibility settings
 */
router.patch('/accessibility', async (req, res) => {
  try {
    const { highContrastMode, reduceMotion, fontSize } = req.body;

    await pool.query(`
      UPDATE user_preferences
      SET
        high_contrast_mode = COALESCE($1, high_contrast_mode),
        reduce_motion = COALESCE($2, reduce_motion),
        font_size = COALESCE($3, font_size),
        updated_at = NOW()
      WHERE user_id = $4
    `, [highContrastMode, reduceMotion, fontSize, req.user.id]);

    res.json({ message: 'Accessibility settings updated successfully' });
  } catch (error) {
    console.error('Error updating accessibility settings:', error);
    res.status(500).json({ error: 'Failed to update accessibility settings' });
  }
});

/**
 * ============================================================================
 * EMPLOYEE-SPECIFIC SETTINGS ENDPOINTS
 * ============================================================================
 */

/**
 * PATCH /api/settings/employee/reporting
 * Update employee reporting preferences
 */
router.patch('/employee/reporting', async (req, res) => {
  try {
    // Verify user is an employee
    const userResult = await pool.query(
      'SELECT role FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows[0]?.role !== 'employee') {
      return res.status(403).json({ error: 'This setting is only available for employees' });
    }

    const { defaultAnonymousReporting, preferredContactMethod, saveDraftReports } = req.body;

    await pool.query(`
      UPDATE user_preferences
      SET
        default_anonymous_reporting = COALESCE($1, default_anonymous_reporting),
        preferred_contact_method = COALESCE($2, preferred_contact_method),
        save_draft_reports = COALESCE($3, save_draft_reports),
        updated_at = NOW()
      WHERE user_id = $4
    `, [defaultAnonymousReporting, preferredContactMethod, saveDraftReports, req.user.id]);

    res.json({ message: 'Reporting preferences updated successfully' });
  } catch (error) {
    console.error('Error updating reporting preferences:', error);
    res.status(500).json({ error: 'Failed to update reporting preferences' });
  }
});

/**
 * PATCH /api/settings/employee/communication
 * Update employee communication preferences
 */
router.patch('/employee/communication', async (req, res) => {
  try {
    const userResult = await pool.query(
      'SELECT role FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows[0]?.role !== 'employee') {
      return res.status(403).json({ error: 'This setting is only available for employees' });
    }

    const { receiveCaseUpdates, receiveDeadlineReminders, reminderDaysBefore } = req.body;

    await pool.query(`
      UPDATE user_preferences
      SET
        receive_case_updates = COALESCE($1, receive_case_updates),
        receive_deadline_reminders = COALESCE($2, receive_deadline_reminders),
        reminder_days_before = COALESCE($3, reminder_days_before),
        updated_at = NOW()
      WHERE user_id = $4
    `, [receiveCaseUpdates, receiveDeadlineReminders, reminderDaysBefore, req.user.id]);

    res.json({ message: 'Communication preferences updated successfully' });
  } catch (error) {
    console.error('Error updating communication preferences:', error);
    res.status(500).json({ error: 'Failed to update communication preferences' });
  }
});

/**
 * PATCH /api/settings/employee/support
 * Update employee support preferences
 */
router.patch('/employee/support', async (req, res) => {
  try {
    const userResult = await pool.query(
      'SELECT role FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows[0]?.role !== 'employee') {
      return res.status(403).json({ error: 'This setting is only available for employees' });
    }

    const { showSupportResources, preferredSupportLanguage } = req.body;

    await pool.query(`
      UPDATE user_preferences
      SET
        show_support_resources = COALESCE($1, show_support_resources),
        preferred_support_language = COALESCE($2, preferred_support_language),
        updated_at = NOW()
      WHERE user_id = $3
    `, [showSupportResources, preferredSupportLanguage, req.user.id]);

    res.json({ message: 'Support preferences updated successfully' });
  } catch (error) {
    console.error('Error updating support preferences:', error);
    res.status(500).json({ error: 'Failed to update support preferences' });
  }
});

/**
 * ============================================================================
 * IC MEMBER-SPECIFIC SETTINGS ENDPOINTS
 * ============================================================================
 */

// Helper to check IC/Admin role
async function requireICOrAdmin(req, res, next) {
  const userResult = await pool.query(
    'SELECT role FROM users WHERE id = $1',
    [req.user.id]
  );
  const role = userResult.rows[0]?.role;
  if (role !== 'ic_member' && role !== 'hr_admin') {
    return res.status(403).json({ error: 'This setting is only available for IC members and admins' });
  }
  req.userRole = role;
  next();
}

/**
 * PATCH /api/settings/ic/case-management
 * Update IC case management preferences
 */
router.patch('/ic/case-management', requireICOrAdmin, async (req, res) => {
  try {
    const {
      defaultCaseView,
      casesPerPage,
      autoAssignCases,
      showCasePriorityIndicators,
      pinnedCases
    } = req.body;

    await pool.query(`
      UPDATE user_preferences
      SET
        default_case_view = COALESCE($1, default_case_view),
        cases_per_page = COALESCE($2, cases_per_page),
        auto_assign_cases = COALESCE($3, auto_assign_cases),
        show_case_priority_indicators = COALESCE($4, show_case_priority_indicators),
        pinned_cases = COALESCE($5, pinned_cases),
        updated_at = NOW()
      WHERE user_id = $6
    `, [defaultCaseView, casesPerPage, autoAssignCases, showCasePriorityIndicators, pinnedCases, req.user.id]);

    res.json({ message: 'Case management preferences updated successfully' });
  } catch (error) {
    console.error('Error updating case management preferences:', error);
    res.status(500).json({ error: 'Failed to update case management preferences' });
  }
});

/**
 * PATCH /api/settings/ic/dashboard
 * Update IC dashboard preferences
 */
router.patch('/ic/dashboard', requireICOrAdmin, async (req, res) => {
  try {
    const { layout } = req.body;

    if (!layout || typeof layout !== 'object') {
      return res.status(400).json({ error: 'Dashboard layout must be an object' });
    }

    await pool.query(`
      UPDATE user_preferences
      SET
        dashboard_layout = $1,
        updated_at = NOW()
      WHERE user_id = $2
    `, [JSON.stringify(layout), req.user.id]);

    res.json({ message: 'Dashboard preferences updated successfully' });
  } catch (error) {
    console.error('Error updating dashboard preferences:', error);
    res.status(500).json({ error: 'Failed to update dashboard preferences' });
  }
});

/**
 * PATCH /api/settings/ic/workflow
 * Update IC workflow preferences
 */
router.patch('/ic/workflow', requireICOrAdmin, async (req, res) => {
  try {
    const {
      autoAdvanceWorkflow,
      requireNotesOnStatusChange,
      defaultInvestigationChecklist
    } = req.body;

    await pool.query(`
      UPDATE user_preferences
      SET
        auto_advance_workflow = COALESCE($1, auto_advance_workflow),
        require_notes_on_status_change = COALESCE($2, require_notes_on_status_change),
        default_investigation_checklist = COALESCE($3, default_investigation_checklist),
        updated_at = NOW()
      WHERE user_id = $4
    `, [autoAdvanceWorkflow, requireNotesOnStatusChange, defaultInvestigationChecklist, req.user.id]);

    res.json({ message: 'Workflow preferences updated successfully' });
  } catch (error) {
    console.error('Error updating workflow preferences:', error);
    res.status(500).json({ error: 'Failed to update workflow preferences' });
  }
});

/**
 * PATCH /api/settings/ic/reminders
 * Update IC reminder preferences
 */
router.patch('/ic/reminders', requireICOrAdmin, async (req, res) => {
  try {
    const { reviewReminderFrequency, customReminderDays } = req.body;

    await pool.query(`
      UPDATE user_preferences
      SET
        review_reminder_frequency = COALESCE($1, review_reminder_frequency),
        custom_reminder_days = COALESCE($2, custom_reminder_days),
        updated_at = NOW()
      WHERE user_id = $3
    `, [reviewReminderFrequency, customReminderDays, req.user.id]);

    res.json({ message: 'Reminder preferences updated successfully' });
  } catch (error) {
    console.error('Error updating reminder preferences:', error);
    res.status(500).json({ error: 'Failed to update reminder preferences' });
  }
});

/**
 * PATCH /api/settings/ic/reporting
 * Update IC reporting preferences
 */
router.patch('/ic/reporting', requireICOrAdmin, async (req, res) => {
  try {
    const {
      defaultReportFormat,
      includeTimelineInReports,
      autoGenerateSummary
    } = req.body;

    await pool.query(`
      UPDATE user_preferences
      SET
        default_report_format = COALESCE($1, default_report_format),
        include_timeline_in_reports = COALESCE($2, include_timeline_in_reports),
        auto_generate_summary = COALESCE($3, auto_generate_summary),
        updated_at = NOW()
      WHERE user_id = $4
    `, [defaultReportFormat, includeTimelineInReports, autoGenerateSummary, req.user.id]);

    res.json({ message: 'Reporting preferences updated successfully' });
  } catch (error) {
    console.error('Error updating reporting preferences:', error);
    res.status(500).json({ error: 'Failed to update reporting preferences' });
  }
});

/**
 * PATCH /api/settings/ic/calendar
 * Update IC calendar preferences
 */
router.patch('/ic/calendar', requireICOrAdmin, async (req, res) => {
  try {
    const {
      integrationEnabled,
      provider,
      workingHoursStart,
      workingHoursEnd,
      workingDays
    } = req.body;

    await pool.query(`
      UPDATE user_preferences
      SET
        calendar_integration_enabled = COALESCE($1, calendar_integration_enabled),
        calendar_provider = COALESCE($2, calendar_provider),
        working_hours_start = COALESCE($3, working_hours_start),
        working_hours_end = COALESCE($4, working_hours_end),
        working_days = COALESCE($5, working_days),
        updated_at = NOW()
      WHERE user_id = $6
    `, [integrationEnabled, provider, workingHoursStart, workingHoursEnd, workingDays, req.user.id]);

    res.json({ message: 'Calendar preferences updated successfully' });
  } catch (error) {
    console.error('Error updating calendar preferences:', error);
    res.status(500).json({ error: 'Failed to update calendar preferences' });
  }
});

/**
 * PATCH /api/settings/ic/collaboration
 * Update IC collaboration preferences
 */
router.patch('/ic/collaboration', requireICOrAdmin, async (req, res) => {
  try {
    const {
      showTeamAvailability,
      allowCaseReassignment,
      notifyOnTeamMentions
    } = req.body;

    await pool.query(`
      UPDATE user_preferences
      SET
        show_team_availability = COALESCE($1, show_team_availability),
        allow_case_reassignment = COALESCE($2, allow_case_reassignment),
        notify_on_team_mentions = COALESCE($3, notify_on_team_mentions),
        updated_at = NOW()
      WHERE user_id = $4
    `, [showTeamAvailability, allowCaseReassignment, notifyOnTeamMentions, req.user.id]);

    res.json({ message: 'Collaboration preferences updated successfully' });
  } catch (error) {
    console.error('Error updating collaboration preferences:', error);
    res.status(500).json({ error: 'Failed to update collaboration preferences' });
  }
});

/**
 * PATCH /api/settings/ic/quick-actions
 * Update IC quick actions preferences
 */
router.patch('/ic/quick-actions', requireICOrAdmin, async (req, res) => {
  try {
    const { actions, keyboardShortcutsEnabled } = req.body;

    await pool.query(`
      UPDATE user_preferences
      SET
        quick_actions = COALESCE($1, quick_actions),
        keyboard_shortcuts_enabled = COALESCE($2, keyboard_shortcuts_enabled),
        updated_at = NOW()
      WHERE user_id = $3
    `, [actions ? JSON.stringify(actions) : null, keyboardShortcutsEnabled, req.user.id]);

    res.json({ message: 'Quick actions preferences updated successfully' });
  } catch (error) {
    console.error('Error updating quick actions preferences:', error);
    res.status(500).json({ error: 'Failed to update quick actions preferences' });
  }
});

/**
 * PATCH /api/settings/ic/data-management
 * Update IC data management preferences
 */
router.patch('/ic/data-management', requireICOrAdmin, async (req, res) => {
  try {
    const { exportIncludeAttachments, defaultExportDateRange } = req.body;

    await pool.query(`
      UPDATE user_preferences
      SET
        export_include_attachments = COALESCE($1, export_include_attachments),
        default_export_date_range = COALESCE($2, default_export_date_range),
        updated_at = NOW()
      WHERE user_id = $3
    `, [exportIncludeAttachments, defaultExportDateRange, req.user.id]);

    res.json({ message: 'Data management preferences updated successfully' });
  } catch (error) {
    console.error('Error updating data management preferences:', error);
    res.status(500).json({ error: 'Failed to update data management preferences' });
  }
});

/**
 * PATCH /api/settings/ic/advanced
 * Update IC advanced preferences
 */
router.patch('/ic/advanced', requireICOrAdmin, async (req, res) => {
  try {
    const { betaFeaturesEnabled, customSettings } = req.body;

    await pool.query(`
      UPDATE user_preferences
      SET
        beta_features_enabled = COALESCE($1, beta_features_enabled),
        custom_settings = COALESCE($2, custom_settings),
        updated_at = NOW()
      WHERE user_id = $3
    `, [betaFeaturesEnabled, customSettings ? JSON.stringify(customSettings) : null, req.user.id]);

    res.json({ message: 'Advanced preferences updated successfully' });
  } catch (error) {
    console.error('Error updating advanced preferences:', error);
    res.status(500).json({ error: 'Failed to update advanced preferences' });
  }
});

/**
 * ============================================================================
 * BULK UPDATE ENDPOINT
 * ============================================================================
 */

/**
 * PUT /api/settings
 * Bulk update all settings at once
 */
router.put('/', async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { profile, notifications, privacy, security, accessibility, employee, icMember } = req.body;

    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    // Profile settings
    if (profile) {
      if (profile.theme !== undefined) { updates.push(`theme = $${paramCount++}`); values.push(profile.theme); }
      if (profile.language !== undefined) { updates.push(`language = $${paramCount++}`); values.push(profile.language); }
      if (profile.timezone !== undefined) { updates.push(`timezone = $${paramCount++}`); values.push(profile.timezone); }
      if (profile.dateFormat !== undefined) { updates.push(`date_format = $${paramCount++}`); values.push(profile.dateFormat); }
      if (profile.timeFormat !== undefined) { updates.push(`time_format = $${paramCount++}`); values.push(profile.timeFormat); }
    }

    // Notification settings
    if (notifications) {
      if (notifications.emailNotifications !== undefined) { updates.push(`email_notifications = $${paramCount++}`); values.push(notifications.emailNotifications); }
      if (notifications.pushNotifications !== undefined) { updates.push(`push_notifications = $${paramCount++}`); values.push(notifications.pushNotifications); }
      if (notifications.notificationDigest !== undefined) { updates.push(`notification_digest = $${paramCount++}`); values.push(notifications.notificationDigest); }
      if (notifications.quietHoursEnabled !== undefined) { updates.push(`quiet_hours_enabled = $${paramCount++}`); values.push(notifications.quietHoursEnabled); }
      if (notifications.quietHoursStart !== undefined) { updates.push(`quiet_hours_start = $${paramCount++}`); values.push(notifications.quietHoursStart); }
      if (notifications.quietHoursEnd !== undefined) { updates.push(`quiet_hours_end = $${paramCount++}`); values.push(notifications.quietHoursEnd); }
    }

    // Privacy settings
    if (privacy) {
      if (privacy.profileVisibility !== undefined) { updates.push(`profile_visibility = $${paramCount++}`); values.push(privacy.profileVisibility); }
      if (privacy.showOnlineStatus !== undefined) { updates.push(`show_online_status = $${paramCount++}`); values.push(privacy.showOnlineStatus); }
      if (privacy.showLastActive !== undefined) { updates.push(`show_last_active = $${paramCount++}`); values.push(privacy.showLastActive); }
    }

    // Security settings
    if (security) {
      if (security.sessionTimeoutMinutes !== undefined) { updates.push(`session_timeout_minutes = $${paramCount++}`); values.push(security.sessionTimeoutMinutes); }
      if (security.requireReauthentication !== undefined) { updates.push(`require_reauthentication_for_sensitive = $${paramCount++}`); values.push(security.requireReauthentication); }
    }

    // Accessibility settings
    if (accessibility) {
      if (accessibility.highContrastMode !== undefined) { updates.push(`high_contrast_mode = $${paramCount++}`); values.push(accessibility.highContrastMode); }
      if (accessibility.reduceMotion !== undefined) { updates.push(`reduce_motion = $${paramCount++}`); values.push(accessibility.reduceMotion); }
      if (accessibility.fontSize !== undefined) { updates.push(`font_size = $${paramCount++}`); values.push(accessibility.fontSize); }
    }

    // Employee-specific settings
    if (employee) {
      if (employee.reporting) {
        if (employee.reporting.defaultAnonymousReporting !== undefined) { updates.push(`default_anonymous_reporting = $${paramCount++}`); values.push(employee.reporting.defaultAnonymousReporting); }
        if (employee.reporting.preferredContactMethod !== undefined) { updates.push(`preferred_contact_method = $${paramCount++}`); values.push(employee.reporting.preferredContactMethod); }
        if (employee.reporting.saveDraftReports !== undefined) { updates.push(`save_draft_reports = $${paramCount++}`); values.push(employee.reporting.saveDraftReports); }
      }
      if (employee.communication) {
        if (employee.communication.receiveCaseUpdates !== undefined) { updates.push(`receive_case_updates = $${paramCount++}`); values.push(employee.communication.receiveCaseUpdates); }
        if (employee.communication.receiveDeadlineReminders !== undefined) { updates.push(`receive_deadline_reminders = $${paramCount++}`); values.push(employee.communication.receiveDeadlineReminders); }
        if (employee.communication.reminderDaysBefore !== undefined) { updates.push(`reminder_days_before = $${paramCount++}`); values.push(employee.communication.reminderDaysBefore); }
      }
      if (employee.support) {
        if (employee.support.showSupportResources !== undefined) { updates.push(`show_support_resources = $${paramCount++}`); values.push(employee.support.showSupportResources); }
        if (employee.support.preferredSupportLanguage !== undefined) { updates.push(`preferred_support_language = $${paramCount++}`); values.push(employee.support.preferredSupportLanguage); }
      }
    }

    // IC member-specific settings
    if (icMember) {
      if (icMember.caseManagement) {
        if (icMember.caseManagement.defaultCaseView !== undefined) { updates.push(`default_case_view = $${paramCount++}`); values.push(icMember.caseManagement.defaultCaseView); }
        if (icMember.caseManagement.casesPerPage !== undefined) { updates.push(`cases_per_page = $${paramCount++}`); values.push(icMember.caseManagement.casesPerPage); }
        if (icMember.caseManagement.autoAssignCases !== undefined) { updates.push(`auto_assign_cases = $${paramCount++}`); values.push(icMember.caseManagement.autoAssignCases); }
        if (icMember.caseManagement.showCasePriorityIndicators !== undefined) { updates.push(`show_case_priority_indicators = $${paramCount++}`); values.push(icMember.caseManagement.showCasePriorityIndicators); }
        if (icMember.caseManagement.pinnedCases !== undefined) { updates.push(`pinned_cases = $${paramCount++}`); values.push(icMember.caseManagement.pinnedCases); }
      }
      if (icMember.dashboard) {
        if (icMember.dashboard.layout !== undefined) { updates.push(`dashboard_layout = $${paramCount++}`); values.push(JSON.stringify(icMember.dashboard.layout)); }
      }
      if (icMember.workflow) {
        if (icMember.workflow.autoAdvanceWorkflow !== undefined) { updates.push(`auto_advance_workflow = $${paramCount++}`); values.push(icMember.workflow.autoAdvanceWorkflow); }
        if (icMember.workflow.requireNotesOnStatusChange !== undefined) { updates.push(`require_notes_on_status_change = $${paramCount++}`); values.push(icMember.workflow.requireNotesOnStatusChange); }
        if (icMember.workflow.defaultInvestigationChecklist !== undefined) { updates.push(`default_investigation_checklist = $${paramCount++}`); values.push(icMember.workflow.defaultInvestigationChecklist); }
      }
      if (icMember.reminders) {
        if (icMember.reminders.reviewReminderFrequency !== undefined) { updates.push(`review_reminder_frequency = $${paramCount++}`); values.push(icMember.reminders.reviewReminderFrequency); }
        if (icMember.reminders.customReminderDays !== undefined) { updates.push(`custom_reminder_days = $${paramCount++}`); values.push(icMember.reminders.customReminderDays); }
      }
      if (icMember.reporting) {
        if (icMember.reporting.defaultReportFormat !== undefined) { updates.push(`default_report_format = $${paramCount++}`); values.push(icMember.reporting.defaultReportFormat); }
        if (icMember.reporting.includeTimelineInReports !== undefined) { updates.push(`include_timeline_in_reports = $${paramCount++}`); values.push(icMember.reporting.includeTimelineInReports); }
        if (icMember.reporting.autoGenerateSummary !== undefined) { updates.push(`auto_generate_summary = $${paramCount++}`); values.push(icMember.reporting.autoGenerateSummary); }
      }
      if (icMember.calendar) {
        if (icMember.calendar.integrationEnabled !== undefined) { updates.push(`calendar_integration_enabled = $${paramCount++}`); values.push(icMember.calendar.integrationEnabled); }
        if (icMember.calendar.provider !== undefined) { updates.push(`calendar_provider = $${paramCount++}`); values.push(icMember.calendar.provider); }
        if (icMember.calendar.workingHoursStart !== undefined) { updates.push(`working_hours_start = $${paramCount++}`); values.push(icMember.calendar.workingHoursStart); }
        if (icMember.calendar.workingHoursEnd !== undefined) { updates.push(`working_hours_end = $${paramCount++}`); values.push(icMember.calendar.workingHoursEnd); }
        if (icMember.calendar.workingDays !== undefined) { updates.push(`working_days = $${paramCount++}`); values.push(icMember.calendar.workingDays); }
      }
      if (icMember.collaboration) {
        if (icMember.collaboration.showTeamAvailability !== undefined) { updates.push(`show_team_availability = $${paramCount++}`); values.push(icMember.collaboration.showTeamAvailability); }
        if (icMember.collaboration.allowCaseReassignment !== undefined) { updates.push(`allow_case_reassignment = $${paramCount++}`); values.push(icMember.collaboration.allowCaseReassignment); }
        if (icMember.collaboration.notifyOnTeamMentions !== undefined) { updates.push(`notify_on_team_mentions = $${paramCount++}`); values.push(icMember.collaboration.notifyOnTeamMentions); }
      }
      if (icMember.quickActions) {
        if (icMember.quickActions.actions !== undefined) { updates.push(`quick_actions = $${paramCount++}`); values.push(JSON.stringify(icMember.quickActions.actions)); }
        if (icMember.quickActions.keyboardShortcutsEnabled !== undefined) { updates.push(`keyboard_shortcuts_enabled = $${paramCount++}`); values.push(icMember.quickActions.keyboardShortcutsEnabled); }
      }
      if (icMember.dataManagement) {
        if (icMember.dataManagement.exportIncludeAttachments !== undefined) { updates.push(`export_include_attachments = $${paramCount++}`); values.push(icMember.dataManagement.exportIncludeAttachments); }
        if (icMember.dataManagement.defaultExportDateRange !== undefined) { updates.push(`default_export_date_range = $${paramCount++}`); values.push(icMember.dataManagement.defaultExportDateRange); }
      }
      if (icMember.advanced) {
        if (icMember.advanced.betaFeaturesEnabled !== undefined) { updates.push(`beta_features_enabled = $${paramCount++}`); values.push(icMember.advanced.betaFeaturesEnabled); }
        if (icMember.advanced.customSettings !== undefined) { updates.push(`custom_settings = $${paramCount++}`); values.push(JSON.stringify(icMember.advanced.customSettings)); }
      }
    }

    if (updates.length > 0) {
      updates.push('updated_at = NOW()');
      values.push(req.user.id);

      await client.query(`
        UPDATE user_preferences
        SET ${updates.join(', ')}
        WHERE user_id = $${paramCount}
      `, values);
    }

    await client.query('COMMIT');
    res.json({ message: 'All settings updated successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  } finally {
    client.release();
  }
});

/**
 * POST /api/settings/reset
 * Reset all settings to defaults
 */
router.post('/reset', async (req, res) => {
  try {
    await pool.query('DELETE FROM user_preferences WHERE user_id = $1', [req.user.id]);
    await pool.query('INSERT INTO user_preferences (user_id) VALUES ($1)', [req.user.id]);

    res.json({ message: 'Settings reset to defaults successfully' });
  } catch (error) {
    console.error('Error resetting settings:', error);
    res.status(500).json({ error: 'Failed to reset settings' });
  }
});

export default router;
