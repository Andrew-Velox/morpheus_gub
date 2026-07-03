// backend/simulation/engine.js
// The 10-second loop that simulates live office activity.
// Toggles 1-2 random devices, re-evaluates alerts, then broadcasts via SSE.

import { devices, toggleDevice, getStatusByRoom, getUsageReport } from '../data/deviceStore.js';
import { evaluateAlerts, alerts } from './alerts.js';
import { broadcast } from '../utils/sse.js';
import { SIM_INTERVAL_MS } from '../config/constants.js';

// Build the payload shape that dashboards + SSE clients receive.
export function buildSnapshot() {
  return {
    rooms: getStatusByRoom(),
    usage: getUsageReport(),
    alerts,
    timestamp: new Date().toISOString(),
  };
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
  broadcast(buildSnapshot());
  console.log(`[sim] toggled ${toggleCount} device(s) | alerts: ${alerts.length}`);
}

// Start the loop. Also evaluate alerts once immediately so /api/alerts
// is meaningful before the first tick fires.
export function startSimulation() {
  evaluateAlerts();
  setInterval(runTick, SIM_INTERVAL_MS);
}