import { Resend } from 'resend';
import { config } from '../config.js';

// Initialize Resend client
// For MVP, we'll use console.log if RESEND_API_KEY is not set
const resend = config.RESEND_API_KEY ? new Resend(config.RESEND_API_KEY) : null;

const FROM_EMAIL = config.FROM_EMAIL || 'noreply@conductos.app';
const APP_NAME = 'KelpHR ConductOS';
const APP_URL = config.CLIENT_URL || 'http://localhost:5174';

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
  sendDeadlineReminderEmail
};
