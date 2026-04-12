export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Scalable Real-Time Chat System API',
    version: '1.0.0',
    description:
      'REST API for authentication, conversation management, message history, presence-aware profiles, and health checks.',
  },
  servers: [{ url: 'http://localhost:4000', description: 'Local development server' }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      AuthRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
        },
      },
      RegisterRequest: {
        allOf: [
          { $ref: '#/components/schemas/AuthRequest' },
          {
            type: 'object',
            required: ['username'],
            properties: {
              username: { type: 'string', minLength: 3, maxLength: 32 },
            },
          },
        ],
      },
      CreateDirectConversationRequest: {
        type: 'object',
        required: ['participantId'],
        properties: {
          participantId: { type: 'string', format: 'uuid' },
        },
      },
      CreateGroupConversationRequest: {
        type: 'object',
        required: ['name', 'participantIds'],
        properties: {
          name: { type: 'string' },
          participantIds: {
            type: 'array',
            items: { type: 'string', format: 'uuid' },
          },
        },
      },
      CreateMessageRequest: {
        type: 'object',
        required: ['conversationId', 'content', 'clientId'],
        properties: {
          conversationId: { type: 'string', format: 'uuid' },
          content: { type: 'string', maxLength: 2000 },
          clientId: { type: 'string' },
        },
      },
    },
  },
  paths: {
    '/api/v1/health': {
      get: {
        summary: 'Health check',
        responses: {
          '200': {
            description: 'API, database, and Redis health summary.',
          },
        },
      },
    },
    '/api/v1/auth/register': {
      post: {
        summary: 'Register a new user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterRequest' },
            },
          },
        },
        responses: {
          '201': { description: 'User registered successfully.' },
        },
      },
    },
    '/api/v1/auth/login': {
      post: {
        summary: 'Login an existing user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AuthRequest' },
            },
          },
        },
        responses: {
          '200': { description: 'User authenticated successfully.' },
        },
      },
    },
    '/api/v1/auth/refresh': {
      post: {
        summary: 'Rotate refresh token and issue a new access token',
        responses: {
          '200': { description: 'Access token rotated successfully.' },
        },
      },
    },
    '/api/v1/users/me': {
      get: {
        summary: 'Get authenticated user profile',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Current user payload.' },
        },
      },
    },
    '/api/v1/conversations': {
      get: {
        summary: 'List conversations for the current user',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Conversation list.' },
        },
      },
    },
  },
} as const;
