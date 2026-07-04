// backend/simulation/clock.js
// Demo clock used by alert evaluation. Energy accounting still uses real time.

import { OFFICE_TIMEZONE } from '../config/constants.js';

let demoNowIso = null;

export function getEffectiveNow() {
  return demoNowIso ? new Date(demoNowIso) : new Date();
}

export function setDemoTime(value) {
  const next = new Date(value);
  if (Number.isNaN(next.getTime())) {
    const error = new Error('currentTime must be a valid ISO date/time string.');
    error.statusCode = 400;
    throw error;
  }

  demoNowIso = next.toISOString();
  return getClockState();
}

export function clearDemoTime() {
  demoNowIso = null;
  return getClockState();
}

export function getOfficeHour(now = getEffectiveNow()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    hour12: false,
    timeZone: OFFICE_TIMEZONE,
  }).formatToParts(now);

  const hour = Number(parts.find((part) => part.type === 'hour')?.value || 0);
  return hour === 24 ? 0 : hour;
}

export function getClockState() {
  return {
    mode: demoNowIso ? 'demo' : 'realtime',
    now: getEffectiveNow().toISOString(),
    timezone: OFFICE_TIMEZONE,
  };
}
