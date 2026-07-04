// backend/data/deviceStore.js
// In-memory database: the single source of truth for all 15 devices.
// Exposes getters that compute derived state for REST/SSE consumers.

import { ROOMS, ROOM_SLUGS, POWER_RATINGS, KWH_FACTOR } from '../config/constants.js';

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
  const now = new Date().toISOString();
  return {
    id,
    type,
    room,
    status: false,
    power_draw: 0,
    accumulated_kwh: 0,
    last_changed: now,
    last_energy_calc: now,
  };
}

// Update energy consumption for a single device based on elapsed time and power draw.
export function updateDeviceEnergy(device, now) {
  const currentCalc = now || new Date();
  const lastCalc = new Date(device.last_energy_calc);
  const elapsedMs = currentCalc.getTime() - lastCalc.getTime();

  if (elapsedMs > 0 && device.status) {
    const power = POWER_RATINGS[device.type] || 0;
    const consumedKwh = (power * elapsedMs) / KWH_FACTOR;
    device.accumulated_kwh += consumedKwh;
  }

  device.last_energy_calc = currentCalc.toISOString();
}

// Update energy consumption for all devices up to the current timestamp.
export function updateAllDevicesEnergy() {
  const now = new Date();
  devices.forEach((d) => updateDeviceEnergy(d, now));
}

// `onSince` records when a device last switched to ON (ISO string per id),
// used by the over-usage alert to measure continuous-on duration.
export const onSince = {};

// The live registry. Mutable so other modules can mutate it directly.
export const devices = buildDeviceRegistry();

// Toggle one device: flip status, fix power_draw + timestamp + onSince.
export function toggleDevice(device) {
  const now = new Date();

  // Update cumulative energy consumption up to "now" before flipping status
  updateDeviceEnergy(device, now);

  device.status = !device.status;

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
  updateAllDevicesEnergy();

  const perRoom = {};
  const perRoomKwh = {};
  let totalPower = 0;
  let totalKwh = 0;

  ROOMS.forEach((r) => {
    perRoom[r] = 0;
    perRoomKwh[r] = 0;
  });

  devices.forEach((d) => {
    perRoom[d.room] += d.power_draw;
    totalPower += d.power_draw;
    perRoomKwh[d.room] += d.accumulated_kwh;
    totalKwh += d.accumulated_kwh;
  });

  return {
    total_power_watts: totalPower,
    total_usage_kwh: parseFloat(totalKwh.toFixed(4)),
    per_room: perRoom,
    per_room_kwh: Object.fromEntries(
      Object.entries(perRoomKwh).map(([room, val]) => [room, parseFloat(val.toFixed(4))])
    ),
  };
}

// A specific room's devices + its total power draw.
export function getRoomReport(roomName) {
  updateAllDevicesEnergy();

  const roomDevices = devices.filter((d) => d.room === roomName);
  const power = roomDevices.reduce((sum, d) => sum + d.power_draw, 0);
  const kwh = roomDevices.reduce((sum, d) => sum + d.accumulated_kwh, 0);

  return {
    room: roomName,
    devices: roomDevices,
    power_draw_watts: power,
    accumulated_kwh: parseFloat(kwh.toFixed(4)),
  };
}