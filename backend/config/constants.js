// backend/config/constants.js
// Centralized configuration so magic numbers live in one place.

import dotenv from 'dotenv';

dotenv.config();

// Server
export const PORT = process.env.PORT || 4000;
export const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
export const OFFICE_TIMEZONE = process.env.OFFICE_TIMEZONE || 'Asia/Dhaka';

// Office hours (24h clock). Outside this window = "after hours".
export const OFFICE_OPEN = Number(process.env.OFFICE_OPEN || 9);   // 9 AM
export const OFFICE_CLOSE = Number(process.env.OFFICE_CLOSE || 17);  // 5 PM

// Power ratings in Watts when a device is ON.
export const POWER_RATINGS = {
  fan: Number(process.env.FAN_WATTS || 60),
  light: Number(process.env.LIGHT_WATTS || 15),
};

export const TARIFF_BDT_PER_KWH = Number(process.env.TARIFF_BDT_PER_KWH || 12);

// Conversion factor: Watt-milliseconds to kWh (3.6e9 Watt-ms = 1 kWh)
export const KWH_FACTOR = 3.6e9;

// Over-usage alert: all devices in a room ON continuously for > 2 hours.
export const OVER_USAGE_MS = 2 * 60 * 60 * 1000;

// Simulation cadence: every 10 seconds toggle 1-2 random devices.
export const SIM_INTERVAL_MS = Number(process.env.SIM_INTERVAL_MS || 10 * 1000);
export const SIMULATION_ENABLED = process.env.SIMULATION_ENABLED !== 'false';

// Rooms tracked by the system + a short slug for device ids / URL params.
export const ROOMS = ['Drawing Room', 'Work Room 1', 'Work Room 2'];
export const ROOM_IDS = {
  'Drawing Room': 'drawing_room',
  'Work Room 1': 'work_room_1',
  'Work Room 2': 'work_room_2',
};
export const ROOM_SLUGS = {
  'Drawing Room': 'draw',
  'Work Room 1': 'work1',
  'Work Room 2': 'work2',
};

export const ROOM_DEVICE_BLUEPRINT = [
  { type: 'fan', count: 2, label: 'Fan' },
  { type: 'light', count: 3, label: 'Light' },
];

export const EXPECTED_DEVICE_COUNT =
  ROOMS.length * ROOM_DEVICE_BLUEPRINT.reduce((sum, item) => sum + item.count, 0);

// Reverse lookup: slug/id/name -> full room name (used by /api/room/:name).
const roomAliases = ROOMS.flatMap((room) => [
  [room.toLowerCase(), room],
  [ROOM_SLUGS[room].toLowerCase(), room],
  [ROOM_IDS[room].toLowerCase(), room],
]);

export const ROOM_ALIASES = Object.fromEntries(roomAliases);

export const SLUG_TO_ROOM = Object.fromEntries(
  Object.entries(ROOM_SLUGS).map(([room, slug]) => [slug, room])
);
