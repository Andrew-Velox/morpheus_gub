// backend/server.js
// Express entry point. Wires middleware, routes, realtime, and simulation.

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';

import apiRouter from './routes/api.js';
import openapiSpec from './config/swagger.js';
import { buildSnapshot, startSimulation } from './simulation/engine.js';
import { getStoreMetadata } from './data/deviceStore.js';
import { CORS_ORIGIN, PORT, ROOMS, SIMULATION_ENABLED } from './config/constants.js';
import { attachWebSocket } from './utils/websocket.js';

dotenv.config();

const app = express();

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json({ limit: '1mb' }));

app.use('/api', apiRouter);

app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));
app.get('/openapi.json', (req, res) => res.json(openapiSpec));

app.get('/', (req, res) => {
  res.json({ ok: true, rooms: ROOMS, ...getStoreMetadata() });
});

app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 ? 'Internal server error' : err.message;
  if (statusCode === 500) console.error(err);
  res.status(statusCode).json({ error: message });
});

if (SIMULATION_ENABLED) {
  startSimulation();
}

const server = app.listen(PORT, () => {
  console.log(`office backend running at http://localhost:${PORT}`);
  console.log(`rooms: ${ROOMS.join(', ')} | devices: ${getStoreMetadata().device_count}`);
  console.log(`simulation: ${SIMULATION_ENABLED ? 'enabled' : 'disabled'}`);
  console.log('realtime: SSE /api/stream + WebSocket /ws');
});

attachWebSocket(server, {
  path: '/ws',
  getInitialPayload: buildSnapshot,
});
