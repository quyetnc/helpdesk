/**
 * Discord Webhook Integration
 * Sends structured embeds for ticket events
 */

const axios = require('axios');
const config = require('./config');

/**
 * Send message to Discord via webhook
 */
async function sendDiscordMessage(payload) {
  if (!config.discord.webhookUrl) {
    console.warn('⚠️ DISCORD_WEBHOOK_URL not set, skipping Discord notification');
    return { success: false, reason: 'Webhook URL not configured' };
  }

  try {
    await axios.post(config.discord.webhookUrl, payload, {
      headers: { 'Content-Type': 'application/json' },
    });

    console.log(`💬 Discord message sent`);
    return { success: true };
  } catch (err) {
    console.error(`❌ Failed to send Discord message:`, err.message);
    throw err;
  }
}

/**
 * Discord message: Ticket Created
 */
function createTicketCreatedDiscord(ticket) {
  const color = getPriorityColor(ticket.priority);

  return {
    content: `🎫 **New Ticket Created**`,
    embeds: [
      {
        color: color,
        title: ticket.title,
        url: `http://localhost:3100/tickets/${ticket.id}`,
        fields: [
          {
            name: 'Ticket ID',
            value: `\`${ticket.id}\``,
            inline: true,
          },
          {
            name: 'Priority',
            value: `**${ticket.priority}**`,
            inline: true,
          },
          {
            name: 'Status',
            value: `${ticket.status}`,
            inline: true,
          },
          {
            name: 'Description',
            value: ticket.description.substring(0, 200),
            inline: false,
          },
        ],
        footer: {
          text: 'Support Ticket System',
        },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

/**
 * Discord message: Ticket Assigned
 */
function createTicketAssignedDiscord(ticket, assigneeName) {
  return {
    content: `✅ **Ticket Assigned**`,
    embeds: [
      {
        color: 3066993,
        title: ticket.title,
        url: `http://localhost:3100/tickets/${ticket.id}`,
        fields: [
          {
            name: 'Ticket ID',
            value: `\`${ticket.id}\``,
            inline: true,
          },
          {
            name: 'Assigned To',
            value: assigneeName || 'Unknown',
            inline: true,
          },
          {
            name: 'Priority',
            value: ticket.priority,
            inline: true,
          },
          {
            name: 'Status',
            value: ticket.status,
            inline: true,
          },
        ],
        footer: {
          text: 'Support Ticket System',
        },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

/**
 * Discord message: Ticket Resolved
 */
function createTicketResolvedDiscord(ticket) {
  return {
    content: `🎉 **Ticket Resolved**`,
    embeds: [
      {
        color: 3447003,
        title: ticket.title,
        url: `http://localhost:3100/tickets/${ticket.id}`,
        fields: [
          {
            name: 'Ticket ID',
            value: `\`${ticket.id}\``,
            inline: true,
          },
          {
            name: 'Resolution Time',
            value: calculateResolutionTime(ticket.created_at, ticket.resolved_at),
            inline: true,
          },
          {
            name: 'Resolved At',
            value: new Date(ticket.resolved_at).toLocaleString(),
            inline: false,
          },
        ],
        footer: {
          text: 'Support Ticket System',
        },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

/**
 * Discord message: SLA Breach Alert
 */
function createTicketSLABreachDiscord(ticket) {
  return {
    content: `🚨 **SLA BREACH ALERT** 🚨`,
    embeds: [
      {
        color: 15158332,
        title: ticket.title,
        url: `http://localhost:3100/tickets/${ticket.id}`,
        description: '⚠️ This ticket has breached its SLA deadline!',
        fields: [
          {
            name: 'Ticket ID',
            value: `\`${ticket.id}\``,
            inline: true,
          },
          {
            name: 'Priority',
            value: `**${ticket.priority}**`,
            inline: true,
          },
          {
            name: 'SLA Deadline',
            value: new Date(ticket.sla_deadline).toLocaleString(),
            inline: false,
          },
          {
            name: 'Time Overdue',
            value: calculateTimeSinceSLABreach(ticket.sla_deadline),
            inline: true,
          },
          {
            name: 'Status',
            value: ticket.status,
            inline: true,
          },
        ],
        footer: {
          text: 'Support Ticket System',
        },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

/**
 * Helper: Get color for priority badge (Discord decimal colors)
 */
function getPriorityColor(priority) {
  const colors = {
    URGENT: 15158332, // Red
    HIGH: 15505792, // Orange
    MEDIUM: 16776960, // Yellow
    LOW: 3066993, // Green
  };
  return colors[priority] || 9807270; // Gray default
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
  sendDiscordMessage,
  createTicketCreatedDiscord,
  createTicketAssignedDiscord,
  createTicketResolvedDiscord,
  createTicketSLABreachDiscord,
};
