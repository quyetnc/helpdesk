/**
 * Event Consumer — listens to RabbitMQ queues
 * Processes ticket events and handles retries with exponential backoff
 */

const config = require('./config');
const { getChannel, sendToDLQ } = require('./rabbitmq');

/**
 * Start consuming events from all queues
 */
async function startConsumer() {
  const channel = getChannel();

  const queueConfigs = [
    {
      queue: config.rabbitmq.queues.ticketCreated,
      handler: handleTicketCreated,
    },
    {
      queue: config.rabbitmq.queues.ticketAssigned,
      handler: handleTicketAssigned,
    },
    {
      queue: config.rabbitmq.queues.ticketStatusChanged,
      handler: handleTicketStatusChanged,
    },
    {
      queue: config.rabbitmq.queues.ticketSLABreach,
      handler: handleTicketSLABreach,
    },
  ];

  // Set prefetch to 1 (process one message at a time)
  await channel.prefetch(1);

  for (const { queue, handler } of queueConfigs) {
    channel.consume(queue, async (msg) => {
      if (!msg) return;

      const messageData = JSON.parse(msg.content.toString());
      const attempts = msg.properties?.headers?.['x-attempts'] || 1;

      try {
        console.log(
          `📨 Processing event from ${queue} (attempt ${attempts}/${config.rabbitmq.retryConfig.maxAttempts})`
        );

        // Call the handler
        await handler(messageData);

        // Acknowledge message
        channel.ack(msg);
        console.log(`✅ Event processed successfully from ${queue}`);
      } catch (err) {
        console.error(`❌ Event processing failed: ${err.message}`);

        if (attempts < config.rabbitmq.retryConfig.maxAttempts) {
          // Retry with exponential backoff
          const delay = config.rabbitmq.retryConfig.delays[attempts - 1];
          const newAttempts = attempts + 1;

          console.log(`🔄 Retrying in ${delay}ms (attempt ${newAttempts})`);

          // Re-queue message with retry delay
          setTimeout(() => {
            channel.sendToQueue(queue, msg.content, {
              persistent: true,
              headers: {
                'x-attempts': newAttempts,
                'x-failure-reason': err.message,
              },
            });
          }, delay);

          channel.ack(msg);
        } else {
          // Move to DLQ after max attempts
          console.log(`💀 Max retries exceeded. Moving to DLQ.`);
          await sendToDLQ(queue, messageData, {
            error: err.message,
            attempts,
          });

          channel.ack(msg);
        }
      }
    });

    console.log(`🎧 Consumer listening on queue: ${queue}`);
  }
}

const {
  sendDiscordMessage,
  createTicketCreatedDiscord,
  createTicketAssignedDiscord,
  createTicketResolvedDiscord,
  createTicketSLABreachDiscord,
} = require('./discord');

/**
 * Event Handlers
 * Each handler processes a specific event type
 */

async function handleTicketCreated(eventData) {
  const { id: ticketId, title, requester_id, requester_email, priority } = eventData;

  console.log(`  → Ticket created: ${ticketId} (${title})`);

  try {
    // Send Discord notification only
    const discordPayload = createTicketCreatedDiscord(eventData);
    await sendDiscordMessage(discordPayload);
  } catch (err) {
    console.error(`  ❌ Error sending notifications: ${err.message}`);
    throw err;
  }

  return true;
}

async function handleTicketAssigned(eventData) {
  const { id: ticketId, title, assignee_id, requester_email, assignee_name } = eventData;

  console.log(`  → Ticket assigned: ${ticketId} to ${assignee_id}`);

  try {
    // Send Discord notification only
    const discordPayload = createTicketAssignedDiscord(eventData, assignee_name);
    await sendDiscordMessage(discordPayload);
  } catch (err) {
    console.error(`  ❌ Error sending notifications: ${err.message}`);
    throw err;
  }

  return true;
}

async function handleTicketStatusChanged(eventData) {
  const { id: ticketId, status, requester_email, resolved_at } = eventData;

  console.log(`  → Ticket status changed: ${ticketId} → ${status}`);

  try {
    // Send Discord notification only if RESOLVED
    if (status === 'RESOLVED') {
      const discordPayload = createTicketResolvedDiscord(eventData);
      await sendDiscordMessage(discordPayload);
    }
  } catch (err) {
    console.error(`  ❌ Error sending notifications: ${err.message}`);
    throw err;
  }

  return true;
}

async function handleTicketSLABreach(eventData) {
  const { id: ticketId, priority, sla_deadline } = eventData;

  console.log(`  → SLA breach: ${ticketId} (Priority: ${priority})`);

  try {
    // Send Discord alert only
    const discordPayload = createTicketSLABreachDiscord(eventData);
    await sendDiscordMessage(discordPayload);
  } catch (err) {
    console.error(`  ❌ Error sending notifications: ${err.message}`);
    throw err;
  }

  return true;
}

module.exports = {
  startConsumer,
};
