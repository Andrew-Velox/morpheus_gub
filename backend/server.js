// backend/server.js
// Express entry point. Wires middleware, mounts routes, starts the sim engine.

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';

import apiRouter from './routes/api.js';
import openapiSpec from './config/swagger.js';
import { startSimulation } from './simulation/engine.js';
import { devices } from './data/deviceStore.js';
import { PORT, ROOMS } from './config/constants.js';

dotenv.config();

const app = express();

// Middleware: CORS + JSON body parsing (the frontend dashboard will connect).
app.use(cors());
app.use(express.json());

// Mount all /api/* routes.
app.use('/api', apiRouter);

// Interactive API docs (Swagger UI) + raw OpenAPI JSON.
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));
app.get('/openapi.json', (req, res) => res.json(openapiSpec));

// Health check.
app.get('/', (req, res) => {
  res.json({ ok: true, rooms: ROOMS, device_count: devices.length });
});

// Start the simulation loop (10s ticks).
startSimulation();

app.listen(PORT, () => {
  console.log(`⚡ office backend running at http://localhost:${PORT}`);
  console.log(`   rooms: ${ROOMS.join(', ')} | devices: ${devices.length}`);
});