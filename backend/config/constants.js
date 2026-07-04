// backend/config/constants.js
// Centralized configuration so magic numbers live in one place.

// Server
export const PORT = process.env.PORT || 4000;

// Office hours (24h clock). Outside this window = "after hours".
export const OFFICE_OPEN = 9;   // 9 AM
export const OFFICE_CLOSE = 17;  // 5 PM

// Power ratings in Watts when a device is ON.
export const POWER_RATINGS = {
  fan: 60,
  light: 15,
};

// Conversion factor: Watt-milliseconds to kWh (3.6e9 Watt-ms = 1 kWh)
export const KWH_FACTOR = 3.6e9;

// Over-usage alert: all devices in a room ON continuously for > 2 hours.
export const OVER_USAGE_MS = 2 * 60 * 60 * 1000;

// Simulation cadence: every 10 seconds toggle 1-2 random devices.
export const SIM_INTERVAL_MS = 10 * 1000;

// Rooms tracked by the system + a short slug for device ids / URL params.
export const ROOMS = ['Drawing Room', 'Work Room 1', 'Work Room 2'];
export const ROOM_SLUGS = {
  'Drawing Room': 'draw',
  'Work Room 1': 'work1',
  'Work Room 2': 'work2',
};

// Reverse lookup: slug -> full room name (used by /api/room/:name).
export const SLUG_TO_ROOM = Object.fromEntries(
  Object.entries(ROOM_SLUGS).map(([room, slug]) => [slug, room])
);