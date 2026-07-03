// backend/data/deviceStore.js
// In-memory database: the single source of truth for all 15 devices.
// Exposes getters that compute derived state for REST/SSE consumers.

import { ROOMS, ROOM_SLUGS, POWER_RATINGS } from '../config/constants.js';

// Build the initial registry of 15 devices (3 rooms x 2 fans + 3 lights).
function buildDeviceRegistry() {
  const devices = [];
  ROOMS.forEach((room) => {
    const slug = ROOM_SLUGS[room];
    // 2 fans
    devices.push(
      makeDevice(`fan_1_${slug}`, 'fan', room),
      makeDevice(`fan_2_${slug}`, 'fan', room)
    );
    // 3 lights
    devices.push(
      makeDevice(`light_1_${slug}`, 'light', room),
      makeDevice(`light_2_${slug}`, 'light', room),
      makeDevice(`light_3_${slug}`, 'light', room)
    );
  });
  return devices;
}

// Factory for a single device. Starts OFF (0W).
function makeDevice(id, type, room) {
  return {
    id,
    type,
    room,
    status: false,
    power_draw: 0,
    last_changed: new Date().toISOString(),
  };
}

// `onSince` records when a device last switched to ON (ISO string per id),
// used by the over-usage alert to measure continuous-on duration.
export const onSince = {};

// The live registry. Mutable so other modules can mutate it directly.
export const devices = buildDeviceRegistry();

// Toggle one device: flip status, fix power_draw + timestamp + onSince.
export function toggleDevice(device) {
  device.status = !device.status;
  const now = new Date();

  if (device.status) {
    device.power_draw = POWER_RATINGS[device.type];
    onSince[device.id] = now.toISOString();
  } else {
    device.power_draw = 0;
    delete onSince[device.id];
  }

  device.last_changed = now.toISOString();
  return device;
}

// --- Derived state getters -------------------------------------------------

// Devices grouped by room: { "Drawing Room": [ ...devices ], ... }
export function getStatusByRoom() {
  const grouped = {};
  ROOMS.forEach((r) => (grouped[r] = []));
  devices.forEach((d) => grouped[d.room].push(d));
  return grouped;
}

// Total + per-room power usage in Watts.
export function getUsageReport() {
  const perRoom = {};
  let totalPower = 0;
  ROOMS.forEach((r) => (perRoom[r] = 0));
  devices.forEach((d) => {
    perRoom[d.room] += d.power_draw;
    totalPower += d.power_draw;
  });
  return { total_power_watts: totalPower, per_room: perRoom };
}

// A specific room's devices + its total power draw.
export function getRoomReport(roomName) {
  const roomDevices = devices.filter((d) => d.room === roomName);
  const power = roomDevices.reduce((sum, d) => sum + d.power_draw, 0);
  return { room: roomName, devices: roomDevices, power_draw_watts: power };
}