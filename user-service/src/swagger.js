/**
 * OpenAPI 3.0 specification for user-service
 * Served at GET /api-docs
 */

const swaggerJsdoc = require('swagger-jsdoc');

const definition = {
  openapi: '3.0.0',
  info: {
    title: 'User Service API',
    version: '1.0.0',
    description:
      'User authentication and management service — ProOps2026 Helpdesk',
  },
  servers: [
    {
      url: 'http://localhost:3001',
      description: 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Paste the JWT returned by POST /auth/login',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', example: 'a1b2c3d4-...' },
          email: {
            type: 'string',
            format: 'email',
            example: 'user@example.com',
          },
          name: { type: 'string', example: 'Alice Smith' },
          role: {
            type: 'string',
            enum: ['CUSTOMER', 'AGENT', 'ADMIN'],
            example: 'CUSTOMER',
          },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          error: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Human-readable message' },
          code: { type: 'string', example: 'ERROR_CODE' },
        },
      },
      ValidationErrorResponse: {
        allOf: [
          { $ref: '#/components/schemas/ErrorResponse' },
          {
            type: 'object',
            properties: {
              details: {
                type: 'array',
                items: { type: 'object' },
                description: 'Zod validation error details',
              },
            },
          },
        ],
      },
    },
  },
  paths: {
    '/health': {
      get: {
        summary: 'Health check',
        tags: ['System'],
        responses: {
          200: {
            description: 'Service is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { status: { type: 'string', example: 'ok' } },
                },
              },
            },
          },
        },
      },
    },
    '/users/register': {
      post: {
        summary: 'Register a new user',
        tags: ['Users'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'name'],
                properties: {
                  email: {
                    type: 'string',
                    format: 'email',
                    example: 'user@example.com',
                  },
                  password: {
                    type: 'string',
                    minLength: 8,
                    example: 'secret123',
                  },
                  name: { type: 'string', example: 'Alice Smith' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'User created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' },
              },
            },
          },
          400: {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ValidationErrorResponse',
                },
              },
            },
          },
          409: {
            description: 'Email already registered',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                example: {
                  error: true,
                  message: 'Email already registered',
                  code: 'DUPLICATE_EMAIL',
                },
              },
            },
          },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Login and receive a JWT',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: {
                    type: 'string',
                    format: 'email',
                    example: 'user@example.com',
                  },
                  password: { type: 'string', example: 'secret123' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Login successful — copy the accessToken for Bearer auth',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    accessToken: { type: 'string' },
                    user: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          400: {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ValidationErrorResponse',
                },
              },
            },
          },
          401: {
            description: 'Invalid credentials',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                example: {
                  error: true,
                  message: 'Invalid email or password',
                  code: 'INVALID_CREDENTIALS',
                },
              },
            },
          },
        },
      },
    },
    '/users': {
      get: {
        summary: 'List all users (ADMIN only)',
        tags: ['Users'],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: 'query',
            name: 'limit',
            schema: { type: 'integer', default: 20, minimum: 1, maximum: 100 },
          },
          {
            in: 'query',
            name: 'offset',
            schema: { type: 'integer', default: 0, minimum: 0 },
          },
        ],
        responses: {
          200: {
            description: 'Paginated list of users',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/User' },
                    },
                    pagination: {
                      type: 'object',
                      properties: {
                        limit: { type: 'integer' },
                        offset: { type: 'integer' },
                        total: { type: 'integer' },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden — ADMIN role required' },
          501: { description: 'Not yet implemented' },
        },
      },
    },
    '/users/{id}': {
      get: {
        summary: 'Get a user by ID (any auth)',
        tags: ['Users'],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: {
            description: 'User found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' },
              },
            },
          },
          401: { description: 'Unauthorized' },
          404: { description: 'User not found' },
          501: { description: 'Not yet implemented' },
        },
      },
      patch: {
        summary: 'Update a user (rules by role)',
        tags: ['Users'],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'New Name' },
                  role: {
                    type: 'string',
                    enum: ['CUSTOMER', 'AGENT', 'ADMIN'],
                    description: 'ADMIN only',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'User updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' },
              },
            },
          },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden' },
          404: { description: 'User not found' },
          501: { description: 'Not yet implemented' },
        },
      },
      delete: {
        summary: 'Deactivate a user (ADMIN only, soft delete)',
        tags: ['Users'],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          204: { description: 'User deactivated' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden — ADMIN role required' },
          404: { description: 'User not found' },
          501: { description: 'Not yet implemented' },
        },
      },
    },
  },
};

const swaggerSpec = swaggerJsdoc({ definition, apis: [] });

module.exports = swaggerSpec;
