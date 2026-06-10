/**
 * RabbitMQ Publisher Client
 * Publishes ticket events to RabbitMQ for notification-service to consume
 */

const amqp = require('amqplib');
const logger = require('./logger');
const config = require('./config');

let connection = null;
let channel = null;
let isConnecting = false;

/**
 * Initialize RabbitMQ connection and declare exchange
 * Non-blocking: if RabbitMQ is down, logs warning and continues
 */
async function initializeRabbitMQ() {
  if (isConnecting) return;
  if (connection && channel) return;

  isConnecting = true;

  try {
    const url = config.rabbitmq.url;
    if (!url) {
      logger.warn('rabbitmq_url_not_configured');
      isConnecting = false;
      return;
    }

    connection = await amqp.connect(url);
    channel = await connection.createChannel();

    logger.info('rabbitmq_connected');

    // Declare exchange (idempotent)
    await channel.assertExchange(config.rabbitmq.exchange, 'topic', {
      durable: true,
    });

    logger.info('rabbitmq_exchange_declared', {
      exchange: config.rabbitmq.exchange,
    });

    // Handle connection errors
    connection.on('error', (err) => {
      logger.error('rabbitmq_connection_error', {
        error: err.message,
      });
      connection = null;
      channel = null;
      // Attempt reconnection in 5 seconds
      setTimeout(() => {
        isConnecting = false;
        initializeRabbitMQ().catch((err) =>
          logger.warn('rabbitmq_reconnection_failed', { error: err.message })
        );
      }, 5000);
    });

    connection.on('close', () => {
      logger.warn('rabbitmq_connection_closed');
      connection = null;
      channel = null;
    });

    isConnecting = false;
  } catch (err) {
    logger.warn('rabbitmq_initialization_failed', {
      error: err.message,
    });
    isConnecting = false;
    // Retry in 5 seconds
    setTimeout(() => {
      initializeRabbitMQ().catch((err) =>
        logger.warn('rabbitmq_initialization_retry_failed', {
          error: err.message,
        })
      );
    }, 5000);
  }
}

/**
 * Check if RabbitMQ is connected
 */
function isConnected() {
  return connection && channel && !connection.closed;
}

/**
 * Publish an event to the RabbitMQ exchange
 * Fails gracefully if not connected (logs and returns false)
 */
async function publishEvent(routingKey, messageData) {
  if (!isConnected()) {
    logger.warn('rabbitmq_not_connected', {
      routingKey,
      reason: 'event_publish_skipped',
    });
    return false;
  }

  try {
    const payload = JSON.stringify(messageData);
    channel.publish(
      config.rabbitmq.exchange,
      routingKey,
      Buffer.from(payload),
      { persistent: true }
    );

    logger.info('event_published', {
      routingKey,
      exchange: config.rabbitmq.exchange,
    });

    return true;
  } catch (err) {
    logger.error('event_publish_failed', {
      routingKey,
      error: err.message,
    });
    return false;
  }
}

/**
 * Close RabbitMQ connection (graceful shutdown)
 */
async function closeConnection() {
  try {
    if (channel) {
      await channel.close();
    }
    if (connection) {
      await connection.close();
    }
    logger.info('rabbitmq_connection_closed');
  } catch (err) {
    logger.error('rabbitmq_close_failed', {
      error: err.message,
    });
  }
}

module.exports = {
  initializeRabbitMQ,
  publishEvent,
  isConnected,
  closeConnection,
};
