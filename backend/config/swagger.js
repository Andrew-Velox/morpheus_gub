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
        'anomaly alerts, SSE, native WebSocket updates, and demo simulator controls.',
    },
    servers: [
      { url: `http://localhost:${PORT}`, description: 'Local dev server' },
    ],
    paths: {
      '/api/health': {
        get: {
          summary: 'Backend health and feature metadata',
          tags: ['System'],
          responses: {
            200: {
              description: 'Backend health payload.',
              content: { 'application/json': { schema: { type: 'object' } } },
            },
          },
        },
      },
      '/api/devices': {
        get: {
          summary: 'Get all simulated devices',
          tags: ['Devices'],
          responses: {
            200: {
              description: 'Flat device list.',
              content: { 'application/json': { schema: { type: 'object' } } },
            },
          },
        },
      },
      '/api/status': {
        get: {
          summary: 'Get office status summary',
          tags: ['Devices'],
          responses: {
            200: {
              description: 'Room summaries, grouped devices, usage, and alerts.',
              content: { 'application/json': { schema: { type: 'object' } } },
            },
          },
        },
      },
      '/api/rooms/{roomId}': {
        get: {
          summary: 'Get one room status',
          tags: ['Rooms'],
          parameters: [
            {
              in: 'path',
              name: 'roomId',
              required: true,
              schema: { type: 'string' },
              example: 'work_room_1',
            },
          ],
          responses: {
            200: {
              description: 'Room report.',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/RoomReport' } } },
            },
            404: { description: 'Unknown room.' },
          },
        },
      },
      '/api/usage': {
        get: {
          summary: 'Get watts, kWh, and estimated cost',
          tags: ['Usage'],
          responses: {
            200: {
              description: 'Power usage report.',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Usage' } } },
            },
          },
        },
      },
      '/api/alerts': {
        get: {
          summary: 'Get active alerts',
          tags: ['Alerts'],
          responses: {
            200: {
              description: 'Active after-hours and continuous-usage alerts.',
              content: { 'application/json': { schema: { type: 'object' } } },
            },
          },
        },
      },
      '/api/stream': {
        get: {
          summary: 'SSE realtime snapshot stream',
          tags: ['Realtime'],
          responses: {
            200: {
              description: 'text/event-stream snapshots.',
              content: { 'text/event-stream': { schema: { type: 'object' } } },
            },
          },
        },
      },
      '/api/simulator/toggle/{deviceId}': {
        post: {
          summary: 'Demo toggle one device',
          tags: ['Simulator'],
          parameters: [
            {
              in: 'path',
              name: 'deviceId',
              required: true,
              schema: { type: 'string' },
              example: 'work1_fan_1',
            },
          ],
          responses: {
            200: { description: 'Device toggled and snapshot broadcast.' },
            404: { description: 'Unknown device.' },
          },
        },
      },
      '/api/simulator/time': {
        post: {
          summary: 'Set or clear demo clock for alert demos',
          tags: ['Simulator'],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    currentTime: { type: 'string', format: 'date-time' },
                    reset: { type: 'boolean' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Clock updated and snapshot broadcast.' },
            400: { description: 'Invalid time.' },
          },
        },
      },
      '/api/simulator/ingest': {
        post: {
          summary: 'Ingest an Arduino-style room snapshot',
          tags: ['Simulator'],
          requestBody: {
            content: {
              'application/json': {
                schema: { type: 'object' },
              },
            },
          },
          responses: {
            200: { description: 'Snapshot imported and broadcast.' },
            400: { description: 'Invalid snapshot payload.' },
            404: { description: 'Unknown room/device mapping.' },
          },
        },
      },
    },
    components: {
      schemas: {
        Device: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'fan_1_draw' },
            name: { type: 'string', example: 'Fan 1' },
            type: { type: 'string', enum: ['fan', 'light'], example: 'fan' },
            room: { type: 'string', example: 'Drawing Room' },
            roomId: { type: 'string', example: 'drawing_room' },
            status: { type: 'boolean', example: false, description: 'true = ON, false = OFF' },
            status_label: { type: 'string', enum: ['ON', 'OFF'], example: 'OFF' },
            ratedWattage: { type: 'number', example: 60 },
            currentWattage: { type: 'number', example: 0 },
            power_draw: { type: 'number', example: 0, description: 'Watts (0 if OFF)' },
            last_changed: { type: 'string', format: 'date-time' },
          },
        },
        Usage: {
          type: 'object',
          properties: {
            total_power_watts: { type: 'number', example: 740 },
            total_usage_kwh: { type: 'number', example: 1.42 },
            estimated_cost_bdt: { type: 'number', example: 17.04 },
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
            roomId: { type: 'string', example: 'work_room_1' },
            devices: { type: 'array', items: { $ref: '#/components/schemas/Device' } },
            power_draw_watts: { type: 'number', example: 0 },
            onCount: { type: 'number', example: 0 },
            offCount: { type: 'number', example: 6 },
          },
        },
        Alert: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['after_hours', 'over_usage'], example: 'after_hours' },
            code: { type: 'string', example: 'AFTER_HOURS' },
            severity: { type: 'string', enum: ['warning', 'critical'], example: 'warning' },
            room: { type: 'string', example: 'Drawing Room' },
            roomId: { type: 'string', example: 'drawing_room' },
            deviceIds: { type: 'array', items: { type: 'string' } },
            message: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            lastSeenAt: { type: 'string', format: 'date-time' },
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
  // Paths are defined above; keep route scanning enabled for future JSDoc additions.
  apis: ['./routes/*.js'],
});

export default openapiSpec;
