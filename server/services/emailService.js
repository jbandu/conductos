import { Resend } from 'resend';
import { config } from '../config.js';

// Initialize Resend client
// For MVP, we'll use console.log if RESEND_API_KEY is not set
const resend = config.RESEND_API_KEY ? new Resend(config.RESEND_API_KEY) : null;

const FROM_EMAIL = config.FROM_EMAIL || 'noreply@conductos.app';
const APP_NAME = 'KelpHR ConductOS';
const APP_URL = config.CLIENT_URL || 'http://localhost:5174';

/**
 * Common email base template
 */
function getEmailTemplate(title, content, footerText = '') {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 12px 12px 0 0; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
          .content { background-color: #ffffff; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); }
          .button { display: inline-block; background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); color: white !important; padding: 14px 32px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; font-size: 16px; }
          .button:hover { opacity: 0.9; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; padding: 20px; }
          .warning { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0; }
          .success { background-color: #d1fae5; border-left: 4px solid #10b981; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0; }
          .info { background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0; }
          .danger { background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0; }
          .code { font-family: 'SF Mono', Monaco, Consolas, 'Liberation Mono', monospace; background-color: #f3f4f6; padding: 4px 8px; border-radius: 4px; font-size: 14px; }
          .divider { height: 1px; background-color: #e5e7eb; margin: 30px 0; }
          h2 { color: #1f2937; margin-top: 0; }
          p { margin: 0 0 16px 0; }
          ul { padding-left: 20px; }
          li { margin-bottom: 8px; }
          a { color: #4F46E5; }
          .security-info { background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 20px 0; }
          .security-info-row { display: flex; margin-bottom: 8px; }
          .security-info-label { color: #6b7280; width: 120px; flex-shrink: 0; }
          .security-info-value { color: #1f2937; font-weight: 500; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${APP_NAME}</h1>
          </div>
          <div class="content">
            <h2>${title}</h2>
            ${content}
          </div>
          <div class="footer">
            <p>This is an automated email from ${APP_NAME}</p>
            ${footerText ? `<p>${footerText}</p>` : ''}
            <p style="margin-top: 16px; color: #9ca3af;">
              Secure. Confidential. Compliant with PoSH Act, 2013.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Send email verification email
 */
export async function sendVerificationEmail(email, verificationToken, userName) {
  const verificationLink = `${APP_URL}/verify-email?token=${verificationToken}`;

  const content = `
    <p>Hello ${userName},</p>
    <p>Thank you for registering with ${APP_NAME}. To complete your registration and secure your account, please verify your email address.</p>

    <div style="text-align: center;">
      <a href="${verificationLink}" class="button">Verify Email Address</a>
    </div>

    <p>Or copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #4F46E5; font-size: 14px;">${verificationLink}</p>

    <div class="info">
      <strong>Why verify your email?</strong>
      <ul style="margin: 10px 0 0 0;">
        <li>Secure your account with a verified contact method</li>
        <li>Receive important case updates and notifications</li>
        <li>Enable password recovery options</li>
        <li>This link expires in 24 hours</li>
      </ul>
    </div>
  `;

  const html = getEmailTemplate('Verify Your Email Address', content, 'If you did not create an account, please ignore this email.');

  try {
    if (resend) {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: `${APP_NAME} - Please Verify Your Email`,
        html
      });
      console.log(`✅ Verification email sent to ${email}`);
    } else {
      console.log('\n📧 [EMAIL SERVICE - DEV MODE]');
      console.log('Email Verification');
      console.log('To:', email);
      console.log('Verification Link:', verificationLink);
      console.log('Token expires in 24 hours\n');
    }
    return { success: true };
  } catch (error) {
    console.error('Error sending verification email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send welcome email after successful registration/verification
 */
export async function sendWelcomeEmail(email, userName, role) {
  const loginLink = role === 'employee' ? `${APP_URL}/login/employee` : `${APP_URL}/login/ic`;
  const roleLabel = role === 'employee' ? 'Employee' : role === 'ic_member' ? 'IC Committee Member' : 'Administrator';

  const employeeContent = `
    <p>Hello ${userName},</p>
    <p>Welcome to ${APP_NAME}! Your account has been successfully set up.</p>

    <div class="success">
      <strong>Your account is ready!</strong>
      <p style="margin: 10px 0 0 0;">You can now access the confidential reporting platform.</p>
    </div>

    <h3 style="margin-top: 30px;">What you can do:</h3>
    <ul>
      <li><strong>Report incidents confidentially</strong> - Submit reports securely with optional anonymity</li>
      <li><strong>Track your cases</strong> - Monitor the progress of any reports you've submitted</li>
      <li><strong>Communicate securely</strong> - Message the Internal Committee through encrypted channels</li>
      <li><strong>Access resources</strong> - Learn about your rights under the PoSH Act</li>
    </ul>

    <div style="text-align: center; margin-top: 30px;">
      <a href="${loginLink}" class="button">Go to Dashboard</a>
    </div>

    <div class="info" style="margin-top: 30px;">
      <strong>Your Privacy Matters</strong>
      <p style="margin: 10px 0 0 0;">All communications and reports are encrypted and confidential. Your identity is protected at every step.</p>
    </div>
  `;

  const icMemberContent = `
    <p>Hello ${userName},</p>
    <p>Welcome to ${APP_NAME}! Your IC Committee Member account has been successfully activated.</p>

    <div class="success">
      <strong>Your account is ready!</strong>
      <p style="margin: 10px 0 0 0;">You now have access to the case management dashboard.</p>
    </div>

    <h3 style="margin-top: 30px;">Your Responsibilities:</h3>
    <ul>
      <li><strong>Review cases</strong> - Access and investigate assigned cases</li>
      <li><strong>Manage workflows</strong> - Update case statuses and track deadlines</li>
      <li><strong>Document findings</strong> - Record evidence and investigation notes</li>
      <li><strong>Ensure compliance</strong> - Follow PoSH Act guidelines for case resolution</li>
    </ul>

    <h3 style="margin-top: 30px;">Customize Your Experience:</h3>
    <p>Visit your <a href="${APP_URL}/profile/settings">Profile Settings</a> to:</p>
    <ul>
      <li>Configure your dashboard layout</li>
      <li>Set up case reminders and notifications</li>
      <li>Customize workflow preferences</li>
      <li>Enable keyboard shortcuts for productivity</li>
    </ul>

    <div style="text-align: center; margin-top: 30px;">
      <a href="${loginLink}" class="button">Access Dashboard</a>
    </div>
  `;

  const content = role === 'employee' ? employeeContent : icMemberContent;
  const html = getEmailTemplate(`Welcome to ${APP_NAME}!`, content, `You're registered as: ${roleLabel}`);

  try {
    if (resend) {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: `Welcome to ${APP_NAME}!`,
        html
      });
      console.log(`✅ Welcome email sent to ${email}`);
    } else {
      console.log('\n📧 [EMAIL SERVICE - DEV MODE]');
      console.log('Welcome Email');
      console.log('To:', email);
      console.log('Role:', roleLabel);
      console.log('Dashboard:', loginLink, '\n');
    }
    return { success: true };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send security alert email (login from new device, password changed, etc.)
 */
export async function sendSecurityAlertEmail(email, userName, alertType, metadata = {}) {
  const alertConfigs = {
    new_login: {
      title: 'New Login Detected',
      icon: '🔐',
      message: 'A new login to your account was detected.',
      color: 'info'
    },
    password_changed: {
      title: 'Password Changed',
      icon: '🔑',
      message: 'Your password was successfully changed.',
      color: 'success'
    },
    email_changed: {
      title: 'Email Address Changed',
      icon: '📧',
      message: 'Your email address has been updated.',
      color: 'warning'
    },
    mfa_enabled: {
      title: 'Two-Factor Authentication Enabled',
      icon: '🛡️',
      message: 'Two-factor authentication has been enabled on your account.',
      color: 'success'
    },
    mfa_disabled: {
      title: 'Two-Factor Authentication Disabled',
      icon: '⚠️',
      message: 'Two-factor authentication has been disabled on your account.',
      color: 'warning'
    },
    failed_login_attempts: {
      title: 'Multiple Failed Login Attempts',
      icon: '🚨',
      message: 'Multiple failed login attempts were detected on your account.',
      color: 'danger'
    },
    account_locked: {
      title: 'Account Temporarily Locked',
      icon: '🔒',
      message: 'Your account has been temporarily locked due to security concerns.',
      color: 'danger'
    },
    google_connected: {
      title: 'Google Account Connected',
      icon: '🔗',
      message: 'Your Google account has been connected for easier sign-in.',
      color: 'success'
    },
    google_disconnected: {
      title: 'Google Account Disconnected',
      icon: '🔓',
      message: 'Your Google account has been disconnected.',
      color: 'info'
    }
  };

  const alertConfig = alertConfigs[alertType] || {
    title: 'Security Alert',
    icon: '🔔',
    message: 'A security-related action was performed on your account.',
    color: 'info'
  };

  const securityInfo = metadata.ip || metadata.device || metadata.location ? `
    <div class="security-info">
      <strong>Activity Details:</strong>
      <div style="margin-top: 12px;">
        ${metadata.time ? `<div class="security-info-row"><span class="security-info-label">Time:</span><span class="security-info-value">${metadata.time}</span></div>` : ''}
        ${metadata.ip ? `<div class="security-info-row"><span class="security-info-label">IP Address:</span><span class="security-info-value">${metadata.ip}</span></div>` : ''}
        ${metadata.device ? `<div class="security-info-row"><span class="security-info-label">Device:</span><span class="security-info-value">${metadata.device}</span></div>` : ''}
        ${metadata.browser ? `<div class="security-info-row"><span class="security-info-label">Browser:</span><span class="security-info-value">${metadata.browser}</span></div>` : ''}
        ${metadata.location ? `<div class="security-info-row"><span class="security-info-label">Location:</span><span class="security-info-value">${metadata.location}</span></div>` : ''}
      </div>
    </div>
  ` : '';

  const content = `
    <p>Hello ${userName},</p>

    <div class="${alertConfig.color}">
      <strong>${alertConfig.icon} ${alertConfig.title}</strong>
      <p style="margin: 10px 0 0 0;">${alertConfig.message}</p>
    </div>

    ${securityInfo}

    <div class="warning" style="margin-top: 30px;">
      <strong>Wasn't you?</strong>
      <p style="margin: 10px 0 0 0;">If you didn't perform this action, please:</p>
      <ul style="margin: 10px 0 0 0;">
        <li>Change your password immediately</li>
        <li>Enable two-factor authentication</li>
        <li>Contact your HR administrator</li>
      </ul>
    </div>

    <div style="text-align: center; margin-top: 30px;">
      <a href="${APP_URL}/profile/security" class="button">Review Security Settings</a>
    </div>
  `;

  const html = getEmailTemplate(alertConfig.title, content, 'This is an automated security notification.');

  try {
    if (resend) {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: `${APP_NAME} - ${alertConfig.icon} ${alertConfig.title}`,
        html
      });
      console.log(`✅ Security alert email sent to ${email} (${alertType})`);
    } else {
      console.log('\n📧 [EMAIL SERVICE - DEV MODE]');
      console.log('Security Alert Email');
      console.log('To:', email);
      console.log('Alert Type:', alertType);
      console.log('Metadata:', JSON.stringify(metadata), '\n');
    }
    return { success: true };
  } catch (error) {
    console.error('Error sending security alert email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send magic link for passwordless login
 */
export async function sendMagicLinkEmail(email, magicLinkToken, userName) {
  const magicLink = `${APP_URL}/auth/magic-link?token=${magicLinkToken}`;

  const content = `
    <p>Hello ${userName || 'there'},</p>
    <p>Click the button below to sign in to your ${APP_NAME} account. No password needed!</p>

    <div style="text-align: center;">
      <a href="${magicLink}" class="button">Sign In to ${APP_NAME}</a>
    </div>

    <p>Or copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #4F46E5; font-size: 14px;">${magicLink}</p>

    <div class="warning">
      <strong>Security Notice:</strong>
      <ul style="margin: 10px 0 0 0;">
        <li>This link expires in 15 minutes</li>
        <li>This link can only be used once</li>
        <li>If you didn't request this, please ignore this email</li>
      </ul>
    </div>
  `;

  const html = getEmailTemplate('Your Magic Sign-In Link', content);

  try {
    if (resend) {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: `${APP_NAME} - Your Sign-In Link`,
        html
      });
      console.log(`✅ Magic link email sent to ${email}`);
    } else {
      console.log('\n📧 [EMAIL SERVICE - DEV MODE]');
      console.log('Magic Link Email');
      console.log('To:', email);
      console.log('Magic Link:', magicLink);
      console.log('Expires in 15 minutes\n');
    }
    return { success: true };
  } catch (error) {
    console.error('Error sending magic link email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send password reset confirmation email
 */
export async function sendPasswordResetConfirmationEmail(email, userName) {
  const content = `
    <p>Hello ${userName},</p>

    <div class="success">
      <strong>Password Successfully Reset</strong>
      <p style="margin: 10px 0 0 0;">Your password has been changed successfully.</p>
    </div>

    <p>You can now log in to your account with your new password.</p>

    <div style="text-align: center;">
      <a href="${APP_URL}/login" class="button">Sign In Now</a>
    </div>

    <div class="warning" style="margin-top: 30px;">
      <strong>Didn't reset your password?</strong>
      <p style="margin: 10px 0 0 0;">If you didn't request this password change, your account may be compromised. Please contact your HR administrator immediately.</p>
    </div>
  `;

  const html = getEmailTemplate('Password Reset Successful', content);

  try {
    if (resend) {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: `${APP_NAME} - Password Reset Successful`,
        html
      });
      console.log(`✅ Password reset confirmation email sent to ${email}`);
    } else {
      console.log('\n📧 [EMAIL SERVICE - DEV MODE]');
      console.log('Password Reset Confirmation Email');
      console.log('To:', email, '\n');
    }
    return { success: true };
  } catch (error) {
    console.error('Error sending password reset confirmation email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email, resetToken, userName) {
  const resetLink = `${APP_URL}/reset-password?token=${resetToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9fafb; padding: 30px; border-radius: 8px; margin-top: 20px; }
          .button { display: inline-block; background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
          .warning { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${APP_NAME}</h1>
          </div>

          <div class="content">
            <h2>Password Reset Request</h2>
            <p>Hello ${userName},</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>

            <div style="text-align: center;">
              <a href="${resetLink}" class="button">Reset Password</a>
            </div>

            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #4F46E5;">${resetLink}</p>

            <div class="warning">
              <strong>⚠️ Security Notice:</strong>
              <ul style="margin: 10px 0;">
                <li>This link will expire in 1 hour</li>
                <li>If you didn't request this reset, please ignore this email</li>
                <li>Never share this link with anyone</li>
              </ul>
            </div>
          </div>

          <div class="footer">
            <p>This is an automated email from ${APP_NAME}</p>
            <p>If you're having trouble, please contact your HR administrator</p>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    if (resend) {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: `${APP_NAME} - Password Reset Request`,
        html
      });
      console.log(`✅ Password reset email sent to ${email}`);
    } else {
      // Development mode - log to console
      console.log('\n📧 [EMAIL SERVICE - DEV MODE]');
      console.log('Password Reset Email');
      console.log('To:', email);
      console.log('Reset Link:', resetLink);
      console.log('Token expires in 1 hour\n');
    }
    return { success: true };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send case status update notification
 */
export async function sendCaseStatusUpdateEmail(email, userName, caseId, oldStatus, newStatus) {
  const caseLink = `${APP_URL}/chat`;

  const statusLabels = {
    new: 'New',
    investigating: 'Under Investigation',
    resolved: 'Resolved',
    closed: 'Closed'
  };

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9fafb; padding: 30px; border-radius: 8px; margin-top: 20px; }
          .status-badge { display: inline-block; padding: 6px 12px; border-radius: 4px; font-weight: bold; margin: 0 5px; }
          .status-new { background-color: #dbeafe; color: #1e40af; }
          .status-investigating { background-color: #fef3c7; color: #92400e; }
          .status-resolved { background-color: #d1fae5; color: #065f46; }
          .status-closed { background-color: #e5e7eb; color: #374151; }
          .button { display: inline-block; background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${APP_NAME}</h1>
          </div>

          <div class="content">
            <h2>Case Status Updated</h2>
            <p>Hello ${userName},</p>
            <p>The status of your case (ID: #${caseId}) has been updated:</p>

            <div style="text-align: center; margin: 20px 0;">
              <span class="status-badge status-${oldStatus}">${statusLabels[oldStatus]}</span>
              <span style="font-size: 20px;">→</span>
              <span class="status-badge status-${newStatus}">${statusLabels[newStatus]}</span>
            </div>

            <p>You can view the details of your case by clicking the button below:</p>

            <div style="text-align: center;">
              <a href="${caseLink}" class="button">View Case Details</a>
            </div>
          </div>

          <div class="footer">
            <p>This is an automated notification from ${APP_NAME}</p>
            <p>Your privacy and safety are our priority</p>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    if (resend) {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: `${APP_NAME} - Case Status Updated`,
        html
      });
      console.log(`✅ Case status update email sent to ${email}`);
    } else {
      // Development mode - log to console
      console.log('\n📧 [EMAIL SERVICE - DEV MODE]');
      console.log('Case Status Update Email');
      console.log('To:', email);
      console.log('Case ID:', caseId);
      console.log('Status:', `${oldStatus} → ${newStatus}\n`);
    }
    return { success: true };
  } catch (error) {
    console.error('Error sending case status email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send deadline reminder email
 */
export async function sendDeadlineReminderEmail(email, userName, caseId, daysRemaining) {
  const caseLink = `${APP_URL}/chat`;

  const urgencyLevel = daysRemaining <= 7 ? 'urgent' : daysRemaining <= 30 ? 'warning' : 'info';
  const urgencyColors = {
    urgent: { bg: '#fef2f2', border: '#dc2626', text: '#991b1b' },
    warning: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
    info: { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' }
  };

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9fafb; padding: 30px; border-radius: 8px; margin-top: 20px; }
          .alert { background-color: ${urgencyColors[urgencyLevel].bg}; border-left: 4px solid ${urgencyColors[urgencyLevel].border}; color: ${urgencyColors[urgencyLevel].text}; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .days-count { font-size: 48px; font-weight: bold; text-align: center; color: ${urgencyColors[urgencyLevel].border}; margin: 20px 0; }
          .button { display: inline-block; background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${APP_NAME}</h1>
          </div>

          <div class="content">
            <h2>⏰ Case Deadline Reminder</h2>
            <p>Hello ${userName},</p>
            <p>This is a reminder about the upcoming deadline for your case (ID: #${caseId}).</p>

            <div class="days-count">
              ${daysRemaining} ${daysRemaining === 1 ? 'Day' : 'Days'} Remaining
            </div>

            <div class="alert">
              <strong>${urgencyLevel === 'urgent' ? '🚨 URGENT:' : urgencyLevel === 'warning' ? '⚠️ ATTENTION:' : 'ℹ️ REMINDER:'}</strong>
              <p style="margin: 10px 0 0 0;">
                As per the PoSH Act guidelines, this case must be resolved within 90 days of filing.
                ${daysRemaining <= 7 ? 'Immediate action is required.' : 'Please ensure timely resolution.'}
              </p>
            </div>

            <div style="text-align: center;">
              <a href="${caseLink}" class="button">View Case Details</a>
            </div>
          </div>

          <div class="footer">
            <p>This is an automated reminder from ${APP_NAME}</p>
            <p>Ensuring compliance with PoSH Act requirements</p>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    if (resend) {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: `${APP_NAME} - Case Deadline Reminder: ${daysRemaining} Days Remaining`,
        html
      });
      console.log(`✅ Deadline reminder email sent to ${email}`);
    } else {
      // Development mode - log to console
      console.log('\n📧 [EMAIL SERVICE - DEV MODE]');
      console.log('Deadline Reminder Email');
      console.log('To:', email);
      console.log('Case ID:', caseId);
      console.log('Days Remaining:', daysRemaining);
      console.log('Urgency:', urgencyLevel, '\n');
    }
    return { success: true };
  } catch (error) {
    console.error('Error sending deadline reminder email:', error);
    return { success: false, error: error.message };
  }
}

export default {
  sendPasswordResetEmail,
  sendCaseStatusUpdateEmail,
  sendDeadlineReminderEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
  sendSecurityAlertEmail,
  sendMagicLinkEmail,
  sendPasswordResetConfirmationEmail
};
