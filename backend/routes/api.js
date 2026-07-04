// backend/routes/api.js
// Express router mounting every REST + realtime endpoint.

import { Router } from 'express';
import {
  applyRoomSnapshot,
  findDeviceById,
  getAllDevices,
  getOfficeSummary,
  getRoomReport,
  getStatusByRoom,
  getStoreMetadata,
  getUsageReport,
  resetDevices,
  resolveRoomName,
  setRoomDevices,
  toggleDevice,
} from '../data/deviceStore.js';
import { alerts, evaluateAlerts } from '../simulation/alerts.js';
import { buildSnapshot, publishSnapshot } from '../simulation/engine.js';
import { clearDemoTime, getClockState, setDemoTime } from '../simulation/clock.js';
import { attachSSE } from '../utils/sse.js';
import { getWebSocketClientCount } from '../utils/websocket.js';

const router = Router();

function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

function notFound(res, message) {
  return res.status(404).json({ error: message });
}

function parseStatusValue(value, fallback = true) {
  if (value === undefined || value === null) return fallback;
  if (typeof value === 'boolean') return value;

  const normalized = String(value).trim().toLowerCase();
  if (['on', 'true', '1', 'yes'].includes(normalized)) return true;
  if (['off', 'false', '0', 'no'].includes(normalized)) return false;

  const error = new Error('status must be ON/OFF or true/false.');
  error.statusCode = 400;
  throw error;
}

function parseHoursAgo(value) {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    const error = new Error('onSinceHoursAgo must be a non-negative number.');
    error.statusCode = 400;
    throw error;
  }
  return parsed;
}

function broadcastFreshSnapshot(event) {
  evaluateAlerts();
  return publishSnapshot(event);
}

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    realtime: {
      sse: true,
      websocket: true,
      websocketClients: getWebSocketClientCount(),
    },
    ...getStoreMetadata(),
  });
});

router.get('/devices', (req, res) => {
  res.json({
    devices: getAllDevices(),
    count: getAllDevices().length,
    generatedAt: new Date().toISOString(),
  });
});

router.get('/status/by-room', (req, res) => {
  res.json(getStatusByRoom());
});

router.get('/status', (req, res) => {
  res.json({
    summary: getOfficeSummary(),
    rooms: getStatusByRoom(),
    usage: getUsageReport(),
    alerts,
    generatedAt: new Date().toISOString(),
  });
});

router.get('/usage', (req, res) => {
  res.json(getUsageReport());
});

function sendRoomReport(req, res) {
  const roomName = resolveRoomName(req.params.roomId || req.params.name);
  if (!roomName) {
    return notFound(res, `Unknown room: ${req.params.roomId || req.params.name}`);
  }

  return res.json(getRoomReport(roomName));
}

router.get('/rooms/:roomId', sendRoomReport);
router.get('/room/:name', sendRoomReport);

router.get('/alerts', (req, res) => {
  evaluateAlerts();
  res.json({
    activeAlerts: alerts,
    alerts,
    count: alerts.length,
    generatedAt: new Date().toISOString(),
  });
});

router.get('/snapshot', (req, res) => {
  evaluateAlerts();
  res.json(buildSnapshot());
});

router.get('/stream', (req, res) => {
  evaluateAlerts();
  attachSSE(req, res, buildSnapshot());
});

router.post('/simulator/toggle/:deviceId', (req, res) => {
  const device = findDeviceById(req.params.deviceId);
  if (!device) return notFound(res, `Unknown device: ${req.params.deviceId}`);

  toggleDevice(device);
  const snapshot = broadcastFreshSnapshot('device:update');

  return res.json({
    deviceId: device.id,
    newStatus: device.status_label,
    device,
    snapshot,
  });
});

router.post('/simulator/room/:roomId', (req, res) => {
  const roomName = resolveRoomName(req.params.roomId);
  if (!roomName) return notFound(res, `Unknown room: ${req.params.roomId}`);

  const status = parseStatusValue(req.body?.status ?? req.body?.on, true);
  const onSinceHoursAgo = parseHoursAgo(req.body?.onSinceHoursAgo);
  const onSince = status && onSinceHoursAgo !== null
    ? new Date(Date.now() - onSinceHoursAgo * 60 * 60 * 1000).toISOString()
    : undefined;

  setRoomDevices(roomName, status, { onSince, forceTimestamp: true });
  const snapshot = broadcastFreshSnapshot('room:update');

  return res.json({
    room: getRoomReport(roomName),
    snapshot,
  });
});

router.post('/simulator/ingest', (req, res) => {
  const result = applyRoomSnapshot(req.body);
  const snapshot = broadcastFreshSnapshot('snapshot:ingest');

  return res.json({
    result,
    snapshot,
  });
});

router.post('/ingest/arduino', (req, res) => {
  const result = applyRoomSnapshot(req.body);
  const snapshot = broadcastFreshSnapshot('snapshot:ingest');

  return res.json({
    result,
    snapshot,
  });
});

router.post(
  '/simulator/time',
  asyncRoute(async (req, res) => {
    const wantsReset = req.body?.reset === true || req.body?.clear === true;
    const currentTime = req.body?.currentTime || req.body?.now;
    const clock = wantsReset ? clearDemoTime() : setDemoTime(currentTime);
    const snapshot = broadcastFreshSnapshot('clock:update');

    res.json({
      clock,
      alerts,
      snapshot,
    });
  })
);

router.post('/simulator/reset', (req, res) => {
  resetDevices();
  if (req.body?.keepClock !== true) clearDemoTime();
  const snapshot = broadcastFreshSnapshot('simulation:reset');

  res.json({
    ok: true,
    clock: getClockState(),
    snapshot,
  });
});

export function broadcastSnapshot() {
  return publishSnapshot('snapshot');
}

export default router;
