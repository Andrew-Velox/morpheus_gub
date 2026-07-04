// backend/simulation/engine.js
// The 10-second loop that simulates live office activity.
// Toggles 1-2 random devices, re-evaluates alerts, then broadcasts realtime snapshots.

import {
  devices,
  getOfficeSummary,
  getStatusByRoom,
  getStoreMetadata,
  getUsageReport,
  toggleDevice,
} from '../data/deviceStore.js';
import { evaluateAlerts, alerts } from './alerts.js';
import { broadcast } from '../utils/sse.js';
import { broadcastWebSocket } from '../utils/websocket.js';
import { SIM_INTERVAL_MS } from '../config/constants.js';
import { getClockState } from './clock.js';

// Build the payload shape that dashboards + SSE clients receive.
export function buildSnapshot() {
  return {
    metadata: getStoreMetadata(),
    rooms: getStatusByRoom(),
    summary: getOfficeSummary(),
    usage: getUsageReport(),
    alerts,
    clock: getClockState(),
    timestamp: new Date().toISOString(),
  };
}

export function publishSnapshot(event = 'snapshot') {
  const snapshot = buildSnapshot();
  broadcast(snapshot);
  broadcastWebSocket(event, snapshot);
  return snapshot;
}

// One simulation step: toggle 1-2 distinct random devices.
function runTick() {
  const toggleCount = Math.floor(Math.random() * 2) + 1; // 1 or 2
  const indices = new Set();

  while (indices.size < toggleCount && indices.size < devices.length) {
    indices.add(Math.floor(Math.random() * devices.length));
  }

  indices.forEach((idx) => toggleDevice(devices[idx]));

  evaluateAlerts();
  publishSnapshot('simulation:tick');
  console.log(`[sim] toggled ${toggleCount} device(s) | alerts: ${alerts.length}`);
}

// Start the loop. Also evaluate alerts once immediately so /api/alerts
// is meaningful before the first tick fires.
export function startSimulation() {
  evaluateAlerts();
  setInterval(runTick, SIM_INTERVAL_MS);
}
