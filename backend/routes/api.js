// backend/routes/api.js
// Express router mounting every REST + SSE endpoint.

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

// GET /api/status -- all devices organized by room
router.get('/status', (req, res) => {
  res.json(getStatusByRoom());
});

// GET /api/usage -- total + per-room power usage
router.get('/usage', (req, res) => {
  res.json(getUsageReport());
});

// GET /api/room/:name -- a specific room (accepts full name or slug like "work1")
router.get('/room/:name', (req, res) => {
  const name = req.params.name;
  const roomName =
    SLUG_TO_ROOM[name] || ROOMS.find((r) => r.toLowerCase() === name.toLowerCase());

  if (!roomName) return res.status(404).json({ error: `Unknown room: ${name}` });

  res.json(getRoomReport(roomName));
});

// GET /api/alerts -- current active alerts
router.get('/alerts', (req, res) => {
  res.json(alerts);
});

// GET /api/stream -- SSE stream of full state snapshots
router.get('/stream', (req, res) => {
  attachSSE(req, res, buildSnapshot());
});

// Allow other modules (e.g. the engine) to push updates to SSE clients.
export function broadcastSnapshot() {
  broadcast(buildSnapshot());
}

export default router;