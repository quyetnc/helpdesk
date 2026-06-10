/**
 * Slack Webhook Integration
 * Sends structured JSON messages for ticket events
 */

const axios = require('axios');
const config = require('./config');

/**
 * Send message to Slack via webhook
 */
async function sendSlackMessage(payload) {
  if (!config.slack.webhookUrl) {
    console.warn('⚠️ SLACK_WEBHOOK_URL not set, skipping Slack notification');
    return { success: false, reason: 'Webhook URL not configured' };
  }

  try {
    const response = await axios.post(config.slack.webhookUrl, payload);

    console.log(`💬 Slack message sent`);
    return { success: true };
  } catch (err) {
    console.error(`❌ Failed to send Slack message:`, err.message);
    throw err;
  }
}

/**
 * Slack message: Ticket Created
 */
function createTicketCreatedSlack(ticket) {
  const color = getPriorityColor(ticket.priority);

  return {
    channel: '#support',
    attachments: [
      {
        color: color,
        title: `🎫 New Ticket: ${ticket.title}`,
        title_link: `http://localhost:5173/tickets/${ticket.id}`,
        fields: [
          {
            title: 'Ticket ID',
            value: ticket.id,
            short: true,
          },
          {
            title: 'Priority',
            value: ticket.priority,
            short: true,
          },
          {
            title: 'Status',
            value: ticket.status,
            short: true,
          },
          {
            title: 'Requester',
            value: ticket.requester_id,
            short: true,
          },
          {
            title: 'Description',
            value: ticket.description,
            short: false,
          },
        ],
        footer: 'Support Ticket System',
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  };
}

/**
 * Slack message: Ticket Assigned
 */
function createTicketAssignedSlack(ticket, assigneeName) {
  return {
    channel: '#support',
    attachments: [
      {
        color: '#2E7D32',
        title: `✅ Ticket Assigned: ${ticket.title}`,
        title_link: `http://localhost:5173/tickets/${ticket.id}`,
        fields: [
          {
            title: 'Ticket ID',
            value: ticket.id,
            short: true,
          },
          {
            title: 'Assigned To',
            value: assigneeName,
            short: true,
          },
          {
            title: 'Priority',
            value: ticket.priority,
            short: true,
          },
          {
            title: 'Status',
            value: ticket.status,
            short: true,
          },
        ],
        footer: 'Support Ticket System',
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  };
}

/**
 * Slack message: Ticket Resolved
 */
function createTicketResolvedSlack(ticket) {
  return {
    channel: '#support',
    attachments: [
      {
        color: '#1976D2',
        title: `🎉 Ticket Resolved: ${ticket.title}`,
        title_link: `http://localhost:5173/tickets/${ticket.id}`,
        fields: [
          {
            title: 'Ticket ID',
            value: ticket.id,
            short: true,
          },
          {
            title: 'Requester',
            value: ticket.requester_id,
            short: true,
          },
          {
            title: 'Resolution Time',
            value: calculateResolutionTime(ticket.created_at, ticket.resolved_at),
            short: true,
          },
          {
            title: 'Resolved At',
            value: new Date(ticket.resolved_at).toLocaleString(),
            short: true,
          },
        ],
        footer: 'Support Ticket System',
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  };
}

/**
 * Slack message: SLA Breach Alert
 */
function createTicketSLABreachSlack(ticket) {
  return {
    channel: '#support-alerts',
    attachments: [
      {
        color: '#DC2626',
        title: `🚨 SLA BREACH ALERT: ${ticket.title}`,
        title_link: `http://localhost:5173/tickets/${ticket.id}`,
        text: '<!here> This ticket has breached its SLA deadline!',
        fields: [
          {
            title: 'Ticket ID',
            value: ticket.id,
            short: true,
          },
          {
            title: 'Priority',
            value: ticket.priority,
            short: true,
          },
          {
            title: 'SLA Deadline',
            value: new Date(ticket.sla_deadline).toLocaleString(),
            short: true,
          },
          {
            title: 'Current Status',
            value: ticket.status,
            short: true,
          },
          {
            title: 'Time Overdue',
            value: calculateTimeSinceSLABreach(ticket.sla_deadline),
            short: false,
          },
        ],
        footer: 'Support Ticket System',
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  };
}

/**
 * Helper: Get color for priority badge
 */
function getPriorityColor(priority) {
  const colors = {
    URGENT: '#DC2626',
    HIGH: '#EA580C',
    MEDIUM: '#EAB308',
    LOW: '#16A34A',
  };
  return colors[priority] || '#999';
}

/**
 * Helper: Calculate resolution time
 */
function calculateResolutionTime(createdAt, resolvedAt) {
  const startTime = new Date(createdAt).getTime();
  const endTime = new Date(resolvedAt).getTime();
  const durationMs = endTime - startTime;

  const hours = Math.floor(durationMs / (1000 * 60 * 60));
  const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

  return `${hours}h ${minutes}m`;
}

/**
 * Helper: Calculate time since SLA breach
 */
function calculateTimeSinceSLABreach(slaDeadline) {
  const deadlineTime = new Date(slaDeadline).getTime();
  const nowTime = Date.now();
  const overdueMs = nowTime - deadlineTime;

  const hours = Math.floor(overdueMs / (1000 * 60 * 60));
  const minutes = Math.floor((overdueMs % (1000 * 60 * 60)) / (1000 * 60));

  return `${hours}h ${minutes}m overdue`;
}

module.exports = {
  sendSlackMessage,
  createTicketCreatedSlack,
  createTicketAssignedSlack,
  createTicketResolvedSlack,
  createTicketSLABreachSlack,
};
