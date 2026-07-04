// backend/simulation/engine.js
// Schedule-driven Markov-chain simulator.
// Re-evaluates P(flip) for every device based on time-of-day bucket.
// Devices have realistic dwell times rather than random flicker.

import {
  devices,
  getOfficeSummary,
  getStatusByRoom,
  getStoreMetadata,
  getUsageReport,
  setDeviceStatus,
} from '../data/deviceStore.js';
import { evaluateAlerts, alerts } from './alerts.js';
import { broadcast } from '../utils/sse.js';
import { broadcastWebSocket } from '../utils/websocket.js';
import { SIM_INTERVAL_MS } from '../config/constants.js';
import { getClockState, getOfficeHour } from './clock.js';

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

// Time-of-day buckets
function _timeBucket(hour) {
  if (9 <= hour && hour < 13) return 'morning';
  if (13 <= hour && hour < 14) return 'lunch';
  if (14 <= hour && hour < 17) return 'afternoon';
  if (17 <= hour && hour < 22) return 'evening';
  return 'night';
}

// P(turn ON | currently OFF), P(turn OFF | currently ON) per room per bucket
const TRANSITION = {
  'Work Room 1': {
    morning:   [0.30, 0.03],
    lunch:     [0.05, 0.20],
    afternoon: [0.25, 0.04],
    evening:   [0.02, 0.25],
    night:     [0.00, 0.40],
  },
  'Work Room 2': {
    morning:   [0.30, 0.03],
    lunch:     [0.05, 0.20],
    afternoon: [0.25, 0.04],
    evening:   [0.02, 0.25],
    night:     [0.00, 0.40],
  },
  'Drawing Room': {
    morning:   [0.08, 0.10],
    lunch:     [0.05, 0.15],
    afternoon: [0.08, 0.10],
    evening:   [0.02, 0.30],
    night:     [0.00, 0.50],
  },
};

// One simulation step: re-evaluate state flips based on Markov chain.
function runTick() {
  const hour = getOfficeHour();
  const bucket = _timeBucket(hour);
  let changed = false;

  devices.forEach((device) => {
    const roomTransitions = TRANSITION[device.room] || TRANSITION['Work Room 1'];
    const [pOn, pOff] = roomTransitions[bucket];
    const roll = Math.random();

    if (!device.status && roll < pOn) {
      setDeviceStatus(device, true);
      changed = true;
    } else if (device.status && roll < pOff) {
      setDeviceStatus(device, false);
      changed = true;
    }
  });

  evaluateAlerts();
  publishSnapshot('simulation:tick');

  if (changed) {
    console.log(`[sim] state changed | hour: ${hour} | bucket: ${bucket} | alerts: ${alerts.length}`);
  }
}

// Start the loop. Also evaluate alerts once immediately so /api/alerts
// is meaningful before the first tick fires.
export function startSimulation() {
  evaluateAlerts();
  setInterval(runTick, SIM_INTERVAL_MS);
}

