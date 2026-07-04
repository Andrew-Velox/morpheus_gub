// backend/simulation/alerts.js
// Active alert evaluation with stable keys to avoid duplicate alert spam.

import { devices, getRoomReport, onSince } from '../data/deviceStore.js';
import {
  OFFICE_CLOSE,
  ROOMS,
  OFFICE_OPEN,
  OVER_USAGE_MS,
  ROOM_IDS,
} from '../config/constants.js';
import { getEffectiveNow, getOfficeHour } from './clock.js';

let activeAlertMap = new Map();

// Current active alerts. Replaced on each evaluation, but alert IDs stay stable.
export let alerts = [];

function upsertAlert(nextMap, key, payload, now) {
  const existing = activeAlertMap.get(key);
  nextMap.set(key, {
    id: key,
    key,
    active: true,
    createdAt: existing?.createdAt || now.toISOString(),
    created_at: existing?.created_at || now.toISOString(),
    lastSeenAt: now.toISOString(),
    last_seen_at: now.toISOString(),
    ...payload,
  });
}

// Re-evaluate both anomaly conditions and replace the alerts array.
export function evaluateAlerts() {
  const next = new Map();
  const now = getEffectiveNow();
  const hour = getOfficeHour(now);
  const afterHours = hour < OFFICE_OPEN || hour >= OFFICE_CLOSE;

  // 1) After-hours: any device ON outside 9 AM - 5 PM.
  if (afterHours) {
    ROOMS.forEach((room) => {
      const roomDevicesOn = devices.filter((device) => device.room === room && device.status);
      if (roomDevicesOn.length === 0) return;

      const report = getRoomReport(room);
      upsertAlert(
        next,
        `after_hours:${ROOM_IDS[room]}`,
        {
          type: 'after_hours',
          code: 'AFTER_HOURS',
          severity: 'warning',
          room,
          roomId: ROOM_IDS[room],
          deviceIds: roomDevicesOn.map((device) => device.id),
          device_ids: roomDevicesOn.map((device) => device.id),
          currentWatts: report.currentWatts,
          message:
            `${room} has ${roomDevicesOn.length} device(s) ON after office hours ` +
            `(${OFFICE_OPEN}:00-${OFFICE_CLOSE}:00). Current draw: ${report.currentWatts}W.`,
          timestamp: now.toISOString(),
        },
        now
      );
    });
  }

  // 2) Over-usage: ALL devices in a room ON continuously for > 2 hours.
  ROOMS.forEach((room) => {
    const roomDevices = devices.filter((d) => d.room === room);
    if (!roomDevices.every((d) => d.status)) return;

    const onTimes = roomDevices
      .map((d) => onSince[d.id] ? new Date(onSince[d.id]).getTime() : null)
      .filter(Boolean);
    if (onTimes.length === 0) return;

    // The room became "all ON" when the LAST device switched on.
    const allOnSince = Math.max(...onTimes);
    const continuousMs = now.getTime() - allOnSince;

    if (continuousMs > OVER_USAGE_MS) {
      const report = getRoomReport(room);
      upsertAlert(
        next,
        `over_usage:${ROOM_IDS[room]}`,
        {
          type: 'over_usage',
          code: 'CONTINUOUS_ROOM_USAGE',
          severity: 'critical',
          room,
          roomId: ROOM_IDS[room],
          deviceIds: roomDevices.map((device) => device.id),
          device_ids: roomDevices.map((device) => device.id),
          currentWatts: report.currentWatts,
          continuous_hours: +(continuousMs / (60 * 60 * 1000)).toFixed(2),
          message:
            `All monitored devices in ${room} have been ON for over 2 hours continuously. ` +
            `Current draw: ${report.currentWatts}W.`,
          timestamp: now.toISOString(),
        },
        now
      );
    }
  });

  activeAlertMap = next;
  alerts = [...next.values()];
  return alerts;
}
