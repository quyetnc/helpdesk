/**
 * SendGrid Email Integration
 * Sends HTML email notifications for ticket events
 */

const axios = require('axios');
const config = require('./config');

/**
 * Send email via SendGrid
 */
async function sendEmail(to, subject, htmlContent) {
  if (!config.sendgrid.apiKey) {
    console.warn('⚠️ SENDGRID_API_KEY not set, skipping email');
    return { success: false, reason: 'API key not configured' };
  }

  try {
    const response = await axios.post(
      'https://api.sendgrid.com/v3/mail/send',
      {
        personalizations: [
          {
            to: [{ email: to }],
            subject: subject,
          },
        ],
        from: {
          email: config.sendgrid.fromEmail,
        },
        content: [
          {
            type: 'text/html',
            value: htmlContent,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${config.sendgrid.apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log(`✉️ Email sent to ${to}`);
    return { success: true };
  } catch (err) {
    console.error(`❌ Failed to send email to ${to}:`, err.message);
    throw err;
  }
}

/**
 * Email template: Ticket Created
 */
function createTicketCreatedEmail(ticket, requesterEmail) {
  return {
    to: requesterEmail,
    subject: `Ticket Created: ${ticket.title}`,
    html: `
      <h2>Your Support Ticket Has Been Created</h2>
      <p>Thank you for contacting us.</p>

      <h3>Ticket Details</h3>
      <ul>
        <li><strong>Ticket ID:</strong> ${ticket.id}</li>
        <li><strong>Title:</strong> ${ticket.title}</li>
        <li><strong>Priority:</strong> <span style="color: ${getPriorityColor(ticket.priority)}">${ticket.priority}</span></li>
        <li><strong>Status:</strong> ${ticket.status}</li>
        <li><strong>Created:</strong> ${new Date(ticket.created_at).toLocaleString()}</li>
      </ul>

      <h3>Description</h3>
      <p>${escapeHtml(ticket.description)}</p>

      <hr>
      <p>Track your ticket at: <a href="http://localhost:5173">Customer Portal</a></p>
    `,
  };
}

/**
 * Email template: Ticket Assigned
 */
function createTicketAssignedEmail(ticket, requesterEmail, assigneeName) {
  return {
    to: requesterEmail,
    subject: `Your Ticket Has Been Assigned: ${ticket.title}`,
    html: `
      <h2>Ticket Assignment Update</h2>
      <p>Your support ticket has been assigned to a team member.</p>

      <h3>Ticket Details</h3>
      <ul>
        <li><strong>Ticket ID:</strong> ${ticket.id}</li>
        <li><strong>Title:</strong> ${ticket.title}</li>
        <li><strong>Assigned To:</strong> ${assigneeName}</li>
        <li><strong>Status:</strong> ${ticket.status}</li>
      </ul>

      <p>Your ticket is now being handled by our support team.</p>

      <hr>
      <p>View your ticket at: <a href="http://localhost:5173">Customer Portal</a></p>
    `,
  };
}

/**
 * Email template: Ticket Resolved
 */
function createTicketResolvedEmail(ticket, requesterEmail) {
  return {
    to: requesterEmail,
    subject: `Ticket Resolved: ${ticket.title}`,
    html: `
      <h2>Your Support Ticket Has Been Resolved</h2>
      <p>We've successfully resolved your support request.</p>

      <h3>Ticket Details</h3>
      <ul>
        <li><strong>Ticket ID:</strong> ${ticket.id}</li>
        <li><strong>Title:</strong> ${ticket.title}</li>
        <li><strong>Status:</strong> ${ticket.status}</li>
        <li><strong>Resolved:</strong> ${new Date(ticket.resolved_at).toLocaleString()}</li>
      </ul>

      <p>If you have any follow-up questions, feel free to comment on your ticket or create a new one.</p>

      <hr>
      <p>Thank you for using our support system!</p>
      <p>View your ticket at: <a href="http://localhost:5173">Customer Portal</a></p>
    `,
  };
}

/**
 * Helper: Get color for priority badge
 */
function getPriorityColor(priority) {
  const colors = {
    URGENT: '#dc2626',
    HIGH: '#ea580c',
    MEDIUM: '#eab308',
    LOW: '#16a34a',
  };
  return colors[priority] || '#666';
}

/**
 * Helper: Escape HTML to prevent injection
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

module.exports = {
  sendEmail,
  createTicketCreatedEmail,
  createTicketAssignedEmail,
  createTicketResolvedEmail,
};
