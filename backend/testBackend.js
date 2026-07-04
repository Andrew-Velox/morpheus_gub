// backend/testBackend.js
// Smoke tests for the simulation store, usage math, and alert engine.

import {
  devices,
  getRoomReport,
  getStoreMetadata,
  getUsageReport,
  applyRoomSnapshot,
  resetDevices,
  setRoomDevices,
  toggleDevice,
} from './data/deviceStore.js';
import { alerts, evaluateAlerts } from './simulation/alerts.js';
import { clearDemoTime, setDemoTime } from './simulation/clock.js';
import { EXPECTED_DEVICE_COUNT, POWER_RATINGS, KWH_FACTOR } from './config/constants.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`PASS: ${message}`);
    passed++;
  } else {
    console.error(`FAIL: ${message}`);
    failed++;
  }
}

function closeEnough(actual, expected, tolerance = 0.0001) {
  return Math.abs(actual - expected) < tolerance;
}

function finish() {
  console.log(`\nTest summary: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
  process.exit(0);
}

function runTests() {
  console.log('Starting backend smoke tests...\n');

  resetDevices();
  clearDemoTime();

  assert(devices.length === EXPECTED_DEVICE_COUNT, 'Device registry should contain 15 devices');
  assert(getStoreMetadata().device_count === 15, 'Metadata should report 15 devices');

  const drawingRoom = getRoomReport('Drawing Room');
  assert(drawingRoom.devices.length === 5, 'Each room should expose 5 monitored devices');
  assert(drawingRoom.fansOff === 2, 'Drawing Room should include 2 fans');
  assert(drawingRoom.lightsOff === 3, 'Drawing Room should include 3 lights');

  const testDevice = devices.find((device) => device.type === 'fan');
  toggleDevice(testDevice);
  assert(testDevice.status === true, 'toggleDevice should switch a device ON');
  assert(testDevice.power_draw === POWER_RATINGS.fan, 'ON fan should draw rated watts');

  const twoHoursMs = 2 * 60 * 60 * 1000;
  testDevice.last_energy_calc = new Date(Date.now() - twoHoursMs).toISOString();
  toggleDevice(testDevice);

  const expectedKwh = (POWER_RATINGS.fan * twoHoursMs) / KWH_FACTOR;
  assert(closeEnough(testDevice.accumulated_kwh, expectedKwh), 'Device kWh should accumulate while ON');
  assert(testDevice.status === false && testDevice.power_draw === 0, 'OFF device should draw 0W');

  resetDevices();
  const fanOne = devices.find((device) => device.type === 'fan');
  const lightOne = devices.find((device) => device.type === 'light');
  toggleDevice(fanOne);
  toggleDevice(lightOne);

  const oneHourMs = 60 * 60 * 1000;
  const oneHourAgo = new Date(Date.now() - oneHourMs).toISOString();
  fanOne.last_energy_calc = oneHourAgo;
  lightOne.last_energy_calc = oneHourAgo;

  const usage = getUsageReport();
  const expectedWatts = POWER_RATINGS.fan + POWER_RATINGS.light;
  const expectedUsage = (expectedWatts * oneHourMs) / KWH_FACTOR;

  assert(usage.total_power_watts === expectedWatts, 'Usage report should total current watts');
  assert(closeEnough(usage.total_usage_kwh, expectedUsage), 'Usage report should total kWh');
  assert(usage.estimated_cost_bdt > 0, 'Usage report should include estimated BDT cost');

  resetDevices();
  setDemoTime('2026-07-03T22:00:00+06:00');
  toggleDevice(devices[0]);
  evaluateAlerts();
  assert(alerts.some((alert) => alert.type === 'after_hours'), 'After-hours alert should trigger at 10 PM');

  resetDevices();
  clearDemoTime();
  const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
  setRoomDevices('Drawing Room', true, { onSince: threeHoursAgo, forceTimestamp: true });
  evaluateAlerts();
  assert(
    alerts.some((alert) => alert.type === 'over_usage' && alert.room === 'Drawing Room'),
    'Over-usage alert should trigger when every room device is ON for over 2 hours'
  );

  resetDevices();
  const arduinoFixture = {
    source: 'arduino_uno',
    roomId: 'work_room_1',
    roomName: 'Work Room 1',
    roomTotalWatts: 165,
    devices: [
      { id: 'work1_light_1', type: 'light', status: 'on' },
      { id: 'work1_light_2', type: 'light', status: 'on' },
      { id: 'work1_light_3', type: 'light', status: 'on' },
      { id: 'work1_fan_1', type: 'fan', status: 'on', ratedWattage: 15 },
      { id: 'work1_fan_1', type: 'fan', status: 'on', ratedWattage: 60 },
      { id: 'work1_fan_2', type: 'fan', status: 'on', ratedWattage: 60 },
    ],
  };
  const ingestResult = applyRoomSnapshot(arduinoFixture);
  assert(ingestResult.duplicateDeviceIds.includes('work1_fan_1'), 'Arduino ingest should report duplicate device IDs');
  assert(ingestResult.actualRoomWatts === 165, 'Arduino ingest should produce the expected 165W room total');
  assert(ingestResult.wattsMatch === true, 'Arduino ingest should validate roomTotalWatts');

  resetDevices();
  clearDemoTime();
  finish();
}

runTests();
