// backend/config/swagger.js
// OpenAPI 3.0 definition + swagger-jsdoc options.
// The interactive docs UI (Swagger UI) is served at /docs in server.js.

import swaggerJsdoc from 'swagger-jsdoc';
import { PORT } from './constants.js';

const openapiSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'IoT Office Monitor API',
      version: '1.0.0',
      description:
        'Single source of truth for the Discord bot and the real-time web dashboard. ' +
        'Tracks 15 simulated devices across 3 rooms, with live status, power usage, ' +
        'anomaly alerts, and Server-Sent Events for live dashboard updates.',
    },
    servers: [
      { url: `http://localhost:${PORT}`, description: 'Local dev server' },
    ],
    components: {
      schemas: {
        Device: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'fan_1_draw' },
            type: { type: 'string', enum: ['fan', 'light'], example: 'fan' },
            room: { type: 'string', example: 'Drawing Room' },
            status: { type: 'boolean', example: false, description: 'true = ON, false = OFF' },
            power_draw: { type: 'number', example: 0, description: 'Watts (0 if OFF)' },
            last_changed: { type: 'string', format: 'date-time' },
          },
        },
        Usage: {
          type: 'object',
          properties: {
            total_power_watts: { type: 'number', example: 740 },
            per_room: {
              type: 'object',
              properties: {
                'Drawing Room': { type: 'number', example: 210 },
                'Work Room 1': { type: 'number', example: 0 },
                'Work Room 2': { type: 'number', example: 530 },
              },
            },
          },
        },
        RoomReport: {
          type: 'object',
          properties: {
            room: { type: 'string', example: 'Work Room 1' },
            devices: { type: 'array', items: { $ref: '#/components/schemas/Device' } },
            power_draw_watts: { type: 'number', example: 0 },
          },
        },
        Alert: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['after_hours', 'over_usage'], example: 'after_hours' },
            severity: { type: 'string', enum: ['warning', 'critical'], example: 'warning' },
            device_id: { type: 'string', example: 'fan_1_draw' },
            room: { type: 'string', example: 'Drawing Room' },
            message: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Unknown room: foo' },
          },
        },
      },
    },
  },
  // Paths are gathered from JSDoc @openapi blocks on the routes.
  apis: ['./routes/*.js'],
});

export default openapiSpec;