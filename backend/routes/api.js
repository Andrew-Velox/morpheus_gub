// backend/routes/api.js
// Express router mounting every REST + SSE endpoint.
//
// Each route carries an `@openapi` JSDoc block that swagger-jsdoc reads to
// build the interactive docs UI served at /docs (see config/swagger.js).

import { Router } from 'express';
import {
  getStatusByRoom,
  getUsageReport,
  getRoomReport,
} from '../data/deviceStore.js';
import { alerts } from '../simulation/alerts.js';
import { buildSnapshot } from '../simulation/engine.js';
import { attachSSE, broadcast } from '../utils/sse.js';
import { ROOMS, SLUG_TO_ROOM } from '../config/constants.js';

const router = Router();

/**
 * @openapi
 * /api/status:
 *   get:
 *     summary: Get all devices organized by room
 *     description: Returns the current state of every device, grouped by room name.
 *     tags: [Devices]
 *     responses:
 *       200:
 *         description: Devices grouped by room.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties:
 *                 type: array
 *                 items: { $ref: '#/components/schemas/Device' }
 *             example:
 *               "Drawing Room":
 *                 - id: fan_1_draw
 *                   type: fan
 *                   room: "Drawing Room"
 *                   status: true
 *                   power_draw: 60
 *                   last_changed: "2026-07-03T19:57:56.784Z"
 */
router.get('/status', (req, res) => {
  res.json(getStatusByRoom());
});

/**
 * @openapi
 * /api/usage:
 *   get:
 *     summary: Get total + per-room power usage
 *     description: Returns the total power currently being drawn (Watts) across the whole office, plus a per-room breakdown.
 *     tags: [Usage]
 *     responses:
 *       200:
 *         description: Power usage report.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Usage' }
 */
router.get('/usage', (req, res) => {
  res.json(getUsageReport());
});

/**
 * @openapi
 * /api/room/{name}:
 *   get:
 *     summary: Get a specific room's status + power draw
 *     description: Accepts a full room name ("Work Room 1") or a short slug ("work1"). Returns the room's devices and total power.
 *     tags: [Rooms]
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema: { type: string }
 *         description: Room name or slug ("draw", "work1", "work2").
 *         example: work1
 *     responses:
 *       200:
 *         description: Room report.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/RoomReport' }
 *       404:
 *         description: Unknown room.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get('/room/:name', (req, res) => {
  const name = req.params.name;
  const roomName =
    SLUG_TO_ROOM[name] || ROOMS.find((r) => r.toLowerCase() === name.toLowerCase());

  if (!roomName) return res.status(404).json({ error: `Unknown room: ${name}` });

  res.json(getRoomReport(roomName));
});

/**
 * @openapi
 * /api/alerts:
 *   get:
 *     summary: Get currently active anomaly alerts
 *     description: Returns the live alerts array. Alerts are re-evaluated every 10s by the simulation engine.
 *     tags: [Alerts]
 *     responses:
 *       200:
 *         description: Active alerts.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Alert' }
 */
router.get('/alerts', (req, res) => {
  res.json(alerts);
});

/**
 * @openapi
 * /api/stream:
 *   get:
 *     summary: Server-Sent Events stream of full state snapshots
 *     description: Long-lived SSE connection. Pushes a snapshot immediately on connect, then on every simulation tick (~10s). Content-Type is text/event-stream.
 *     tags: [Realtime]
 *     responses:
 *       200:
 *         description: SSE stream. Each event is a full state snapshot in the `data` field.
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: object
 *               properties:
 *                 rooms: { type: object }
 *                 usage: { $ref: '#/components/schemas/Usage' }
 *                 alerts:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Alert' }
 *                 timestamp: { type: string, format: date-time }
 */
router.get('/stream', (req, res) => {
  attachSSE(req, res, buildSnapshot());
});

// Allow other modules (e.g. the engine) to push updates to SSE clients.
export function broadcastSnapshot() {
  broadcast(buildSnapshot());
}

export default router;