/**
 * RabbitMQ Event Broker Configuration
 * Sets up exchanges, queues, and routing for ticket events
 * Per IRD-004-001: Event consumer for notification service
 */

const amqp = require('amqplib');
const config = require('./config');

let connection = null;
let channel = null;

/**
 * Initialize RabbitMQ connection and declare exchanges/queues
 */
async function initializeRabbitMQ() {
  try {
    // Connect to RabbitMQ
    connection = await amqp.connect(config.rabbitmq.url);
    channel = await connection.createChannel();

    console.log('✅ RabbitMQ connected');

    // Declare exchange
    await channel.assertExchange(config.rabbitmq.exchange, 'topic', {
      durable: true,
    });

    console.log(`✅ Exchange "${config.rabbitmq.exchange}" declared (durable, topic)`);

    // Declare queues and bind to exchange
    const queueBindings = [
      {
        queue: config.rabbitmq.queues.ticketCreated,
        routingKey: config.rabbitmq.routingKeys.ticketCreated,
      },
      {
        queue: config.rabbitmq.queues.ticketAssigned,
        routingKey: config.rabbitmq.routingKeys.ticketAssigned,
      },
      {
        queue: config.rabbitmq.queues.ticketStatusChanged,
        routingKey: config.rabbitmq.routingKeys.ticketStatusChanged,
      },
      {
        queue: config.rabbitmq.queues.ticketSLABreach,
        routingKey: config.rabbitmq.routingKeys.ticketSLABreach,
      },
    ];

    for (const { queue, routingKey } of queueBindings) {
      // Declare queue
      await channel.assertQueue(queue, {
        durable: true,
        arguments: {
          // Set TTL for messages (24 hours)
          'x-message-ttl': 24 * 60 * 60 * 1000,
        },
      });

      // Bind queue to exchange
      await channel.bindQueue(queue, config.rabbitmq.exchange, routingKey);

      console.log(`✅ Queue "${queue}" declared and bound to routing key "${routingKey}"`);
    }

    // Declare Dead Letter Queue
    await channel.assertQueue(config.rabbitmq.queues.dlq, {
      durable: true,
      arguments: {
        'x-message-ttl': 7 * 24 * 60 * 60 * 1000, // 7 days retention
      },
    });

    console.log(`✅ Dead Letter Queue "${config.rabbitmq.queues.dlq}" declared`);

    // Handle connection errors
    connection.on('error', (err) => {
      console.error('RabbitMQ connection error:', err);
    });

    connection.on('close', () => {
      console.warn('RabbitMQ connection closed');
    });

    return { connection, channel };
  } catch (err) {
    console.error('Failed to initialize RabbitMQ:', err.message);
    throw err;
  }
}

/**
 * Get the channel instance
 */
function getChannel() {
  if (!channel) {
    throw new Error('RabbitMQ channel not initialized');
  }
  return channel;
}

/**
 * Publish an event to the exchange
 */
async function publishEvent(routingKey, messageData) {
  try {
    const channel = getChannel();
    const payload = JSON.stringify(messageData);

    channel.publish(
      config.rabbitmq.exchange,
      routingKey,
      Buffer.from(payload),
      { persistent: true }
    );

    console.log(`📤 Event published - routing key: ${routingKey}`);
  } catch (err) {
    console.error('Failed to publish event:', err.message);
    throw err;
  }
}

/**
 * Move message to Dead Letter Queue
 */
async function sendToDLQ(queue, messageData, metadata) {
  try {
    const channel = getChannel();
    const dlqMessage = {
      originalQueue: queue,
      messageData,
      metadata,
      movedAt: new Date().toISOString(),
    };

    channel.sendToQueue(
      config.rabbitmq.queues.dlq,
      Buffer.from(JSON.stringify(dlqMessage)),
      { persistent: true }
    );

    console.log(`❌ Message moved to DLQ - original queue: ${queue}`);
  } catch (err) {
    console.error('Failed to send message to DLQ:', err.message);
  }
}

/**
 * Close RabbitMQ connection
 */
async function closeConnection() {
  try {
    if (channel) {
      await channel.close();
    }
    if (connection) {
      await connection.close();
    }
    console.log('✅ RabbitMQ connection closed');
  } catch (err) {
    console.error('Error closing RabbitMQ connection:', err.message);
  }
}

module.exports = {
  initializeRabbitMQ,
  getChannel,
  publishEvent,
  sendToDLQ,
  closeConnection,
};
