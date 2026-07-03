// backend/simulation/alerts.js
// Active alert evaluation. Rebuilds the alerts array on every simulation tick.

import { devices, onSince } from '../data/deviceStore.js';
import {
  ROOMS,
  OFFICE_OPEN,
  OFFICE_CLOSE,
  OVER_USAGE_MS,
} from '../config/constants.js';

// Current active alerts. Always overwritten wholesale by evaluateAlerts().
export let alerts = [];

// Re-evaluate both anomaly conditions and replace the alerts array.
export function evaluateAlerts() {
  const next = [];
  const now = new Date();
  const hour = now.getHours();
  const afterHours = hour < OFFICE_OPEN || hour >= OFFICE_CLOSE;

  // 1) After-hours: any device ON outside 9 AM - 5 PM.
  if (afterHours) {
    devices.forEach((d) => {
      if (d.status) {
        next.push({
          type: 'after_hours',
          severity: 'warning',
          device_id: d.id,
          room: d.room,
          message: `Device ${d.id} is ON outside office hours (9AM-5PM).`,
          timestamp: now.toISOString(),
        });
      }
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
      next.push({
        type: 'over_usage',
        severity: 'critical',
        room,
        continuous_hours: +(continuousMs / (60 * 60 * 1000)).toFixed(2),
        message: `All devices in ${room} have been ON for over 2 hours continuously.`,
        timestamp: now.toISOString(),
      });
    }
  });

  alerts = next;
  return alerts;
}