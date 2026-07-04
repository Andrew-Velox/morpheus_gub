// backend/data/deviceStore.js
// In-memory database: the single source of truth for all 15 devices.
// Exposes getters that compute derived state for REST/realtime consumers.

import {
  EXPECTED_DEVICE_COUNT,
  KWH_FACTOR,
  POWER_RATINGS,
  ROOM_ALIASES,
  ROOM_DEVICE_BLUEPRINT,
  ROOM_IDS,
  ROOM_SLUGS,
  ROOMS,
  TARIFF_BDT_PER_KWH,
} from '../config/constants.js';

function toFixedNumber(value, digits = 4) {
  return Number(value.toFixed(digits));
}

function pluralKey(type, status) {
  return `${type}s${status ? 'On' : 'Off'}`;
}

// Build the initial registry of 15 devices:
// 3 rooms x (2 fans + 3 lights).
function buildDeviceRegistry() {
  return ROOMS.flatMap((room) => {
    const slug = ROOM_SLUGS[room];
    return ROOM_DEVICE_BLUEPRINT.flatMap(({ type, count, label }) =>
      Array.from({ length: count }, (_, index) =>
        makeDevice(`${slug}_${type}_${index + 1}`, type, room, `${label} ${index + 1}`)
      )
    );
  });
}

// Factory for a single device. Starts OFF (0W).
function makeDevice(id, type, room, name) {
  const now = new Date().toISOString();
  const ratedWattage = POWER_RATINGS[type] || 0;
  return {
    id,
    name,
    type,
    room,
    roomId: ROOM_IDS[room],
    room_id: ROOM_IDS[room],
    status: false,
    status_label: 'OFF',
    ratedWattage,
    rated_wattage: ratedWattage,
    currentWattage: 0,
    power_draw: 0,
    accumulated_kwh: 0,
    lastChangedAt: now,
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

function applyPowerState(device) {
  const powerDraw = device.status ? POWER_RATINGS[device.type] || 0 : 0;
  device.status_label = device.status ? 'ON' : 'OFF';
  device.power_draw = powerDraw;
  device.currentWattage = powerDraw;
  device.ratedWattage = POWER_RATINGS[device.type] || 0;
  device.rated_wattage = device.ratedWattage;
}

export function findDeviceById(deviceId) {
  const normalized = String(deviceId || '').toLowerCase();
  return devices.find((device) => {
    const legacyId = `${device.type}_${device.name.split(' ')[1]}_${ROOM_SLUGS[device.room]}`.toLowerCase();
    return device.id.toLowerCase() === normalized || legacyId === normalized;
  });
}

export function resolveRoomName(input) {
  const normalized = String(input || '').trim().toLowerCase();
  return ROOM_ALIASES[normalized] || null;
}

export function setDeviceStatus(device, nextStatus, options = {}) {
  const now = new Date();
  const desiredStatus = Boolean(nextStatus);

  updateDeviceEnergy(device, now);

  const changed = device.status !== desiredStatus;
  device.status = desiredStatus;
  applyPowerState(device);

  if (device.status) {
    onSince[device.id] =
      options.onSince ||
      (changed ? now.toISOString() : onSince[device.id] || now.toISOString());
  } else {
    delete onSince[device.id];
  }

  if (changed || options.forceTimestamp) {
    device.last_changed = now.toISOString();
    device.lastChangedAt = device.last_changed;
  }

  return device;
}

// Toggle one device: flip status, fix power_draw + timestamp + onSince.
export function toggleDevice(device) {
  return setDeviceStatus(device, !device.status);
}

export function setRoomDevices(roomName, status, options = {}) {
  const roomDevices = devices.filter((device) => device.room === roomName);
  roomDevices.forEach((device) => setDeviceStatus(device, status, options));
  return roomDevices;
}

export function applyRoomSnapshot(payload) {
  if (!payload || typeof payload !== 'object') {
    const error = new Error('Snapshot payload must be a JSON object.');
    error.statusCode = 400;
    throw error;
  }

  const roomName = resolveRoomName(payload.roomId || payload.roomName);
  if (!roomName) {
    const error = new Error(`Unknown room: ${payload.roomId || payload.roomName || 'missing'}`);
    error.statusCode = 404;
    throw error;
  }

  if (!Array.isArray(payload.devices)) {
    const error = new Error('Snapshot payload must include a devices array.');
    error.statusCode = 400;
    throw error;
  }

  const seen = new Set();
  const duplicateDeviceIds = [];
  const devicesById = new Map();

  // Keep the last duplicate entry. The provided Arduino sample includes a
  // duplicate fan id; keeping the last entry preserves the correct 165W total.
  payload.devices.forEach((device) => {
    const id = String(device.id || '').trim();
    if (!id) return;
    if (seen.has(id)) duplicateDeviceIds.push(id);
    seen.add(id);
    devicesById.set(id, device);
  });

  const unknownDeviceIds = [];
  const updatedDevices = [];

  for (const [deviceId, incoming] of devicesById.entries()) {
    const target = findDeviceById(deviceId);
    if (!target || target.room !== roomName) {
      unknownDeviceIds.push(deviceId);
      continue;
    }

    const status = String(incoming.status || '').toLowerCase() === 'on' || incoming.status === true;
    setDeviceStatus(target, status, { forceTimestamp: true });
    updatedDevices.push(target);
  }

  const report = getRoomReport(roomName);
  return {
    source: payload.source || 'external_snapshot',
    room: report,
    duplicateDeviceIds,
    unknownDeviceIds,
    updatedCount: updatedDevices.length,
    expectedRoomWatts: payload.roomTotalWatts,
    actualRoomWatts: report.power_draw_watts,
    wattsMatch: payload.roomTotalWatts === undefined || payload.roomTotalWatts === report.power_draw_watts,
  };
}

export function resetDevices() {
  const now = new Date().toISOString();
  Object.keys(onSince).forEach((id) => delete onSince[id]);
  devices.forEach((device) => {
    device.status = false;
    device.status_label = 'OFF';
    device.power_draw = 0;
    device.currentWattage = 0;
    device.accumulated_kwh = 0;
    device.last_changed = now;
    device.lastChangedAt = now;
    device.last_energy_calc = now;
  });
  return devices;
}

// --- Derived state getters -------------------------------------------------

export function getAllDevices() {
  updateAllDevicesEnergy();
  return devices;
}

// Devices grouped by room: { "Drawing Room": [ ...devices ], ... }
export function getStatusByRoom() {
  updateAllDevicesEnergy();

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

  const estimatedCost = totalKwh * TARIFF_BDT_PER_KWH;
  const roomBreakdown = ROOMS.map((room) => ({
    room,
    roomId: ROOM_IDS[room],
    watts: perRoom[room],
    kwh: toFixedNumber(perRoomKwh[room]),
  }));

  const highestRoom = roomBreakdown.reduce(
    (highest, room) => (room.watts > highest.watts ? room : highest),
    { room: null, roomId: null, watts: 0, kwh: 0 }
  );

  return {
    total_power_watts: totalPower,
    totalCurrentWatts: totalPower,
    total_usage_kwh: toFixedNumber(totalKwh),
    estimatedTodayKwh: toFixedNumber(totalKwh),
    estimated_cost_bdt: toFixedNumber(estimatedCost, 2),
    estimatedCostBdt: toFixedNumber(estimatedCost, 2),
    tariff_bdt_per_kwh: TARIFF_BDT_PER_KWH,
    per_room: perRoom,
    per_room_kwh: Object.fromEntries(
      Object.entries(perRoomKwh).map(([room, val]) => [room, toFixedNumber(val)])
    ),
    roomBreakdown,
    highestRoom,
    generatedAt: new Date().toISOString(),
  };
}

// A specific room's devices + its total power draw.
export function getRoomReport(roomName) {
  updateAllDevicesEnergy();

  const roomDevices = devices.filter((d) => d.room === roomName);
  const power = roomDevices.reduce((sum, d) => sum + d.power_draw, 0);
  const kwh = roomDevices.reduce((sum, d) => sum + d.accumulated_kwh, 0);
  const counts = getRoomCounts(roomDevices);

  return {
    room: roomName,
    roomId: ROOM_IDS[roomName],
    room_id: ROOM_IDS[roomName],
    room_slug: ROOM_SLUGS[roomName],
    devices: roomDevices,
    power_draw_watts: power,
    currentWatts: power,
    accumulated_kwh: toFixedNumber(kwh),
    onCount: roomDevices.filter((device) => device.status).length,
    offCount: roomDevices.filter((device) => !device.status).length,
    ...counts,
  };
}

function getRoomCounts(roomDevices) {
  const counts = {
    fansOn: 0,
    fansOff: 0,
    lightsOn: 0,
    lightsOff: 0,
  };

  roomDevices.forEach((device) => {
    const key = pluralKey(device.type, device.status);
    counts[key] = (counts[key] || 0) + 1;
  });

  return counts;
}

export function getOfficeSummary() {
  updateAllDevicesEnergy();

  return ROOMS.map((room) => {
    const report = getRoomReport(room);
    return {
      roomId: report.roomId,
      roomName: room,
      fansOn: report.fansOn,
      lightsOn: report.lightsOn,
      onCount: report.onCount,
      offCount: report.offCount,
      currentWatts: report.currentWatts,
    };
  });
}

export function getStoreMetadata() {
  return {
    rooms: ROOMS.map((room) => ({
      id: ROOM_IDS[room],
      slug: ROOM_SLUGS[room],
      name: room,
    })),
    device_count: devices.length,
    expected_device_count: EXPECTED_DEVICE_COUNT,
    device_blueprint: ROOM_DEVICE_BLUEPRINT,
  };
}
