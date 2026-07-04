// backend/testBackend.js
// Automated test suite for Backend Additions (kWh energy tracking + alerts validation).

import { devices, toggleDevice, getUsageReport, getRoomReport, updateAllDevicesEnergy } from './data/deviceStore.js';
import { evaluateAlerts, alerts } from './simulation/alerts.js';
import { POWER_RATINGS, KWH_FACTOR } from './config/constants.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    failed++;
  }
}

// Helper to reset device states
function resetDevices() {
  devices.forEach(d => {
    d.status = false;
    d.power_draw = 0;
    d.accumulated_kwh = 0;
    const now = new Date().toISOString();
    d.last_changed = now;
    d.last_energy_calc = now;
  });
}

function runTests() {
  console.log('🧪 Starting Backend Test Suite...\n');

  // Test 1: Device initialization state
  resetDevices();
  assert(
    devices.every(d => d.accumulated_kwh === 0),
    'All devices should initialize with 0 kWh accumulated'
  );

  // Test 2: Energy accumulation calculation on toggle
  resetDevices();
  const testDevice = devices[0]; // Let's test with this device
  
  // Toggle ON
  toggleDevice(testDevice);
  assert(testDevice.status === true, 'Device status should flip to true (ON)');
  assert(testDevice.power_draw === POWER_RATINGS[testDevice.type], 'Power draw should set to rating when ON');

  // Simulate time lapse: set last_energy_calc to 2 hours ago (7.2e6 ms)
  const twoHoursMs = 2 * 60 * 60 * 1000;
  const twoHoursAgo = new Date(Date.now() - twoHoursMs);
  testDevice.last_energy_calc = twoHoursAgo.toISOString();

  // Toggle OFF
  toggleDevice(testDevice);
  assert(testDevice.status === false, 'Device status should flip to false (OFF)');
  assert(testDevice.power_draw === 0, 'Power draw should reset to 0 when OFF');

  // Expected energy: (rating * 2 hours in ms) / KWH_FACTOR
  const expectedKwh = (POWER_RATINGS[testDevice.type] * twoHoursMs) / KWH_FACTOR;
  assert(
    Math.abs(testDevice.accumulated_kwh - expectedKwh) < 0.0001,
    `Device accumulated kWh should match calculation: expected ${expectedKwh.toFixed(4)}, got ${testDevice.accumulated_kwh.toFixed(4)}`
  );

  // Test 3: getUsageReport structure and totals
  resetDevices();
  const d1 = devices[0];
  const d2 = devices[1];
  
  toggleDevice(d1); // ON
  toggleDevice(d2); // ON
  
  // Simulate 1 hour of consumption
  const oneHourMs = 1 * 60 * 60 * 1000;
  const oneHourAgo = new Date(Date.now() - oneHourMs);
  d1.last_energy_calc = oneHourAgo.toISOString();
  d2.last_energy_calc = oneHourAgo.toISOString();

  const report = getUsageReport();
  const expectedTotalKwh = ((POWER_RATINGS[d1.type] + POWER_RATINGS[d2.type]) * oneHourMs) / KWH_FACTOR;

  assert(
    report.total_power_watts === (POWER_RATINGS[d1.type] + POWER_RATINGS[d2.type]),
    'getUsageReport should return correct combined wattage'
  );
  assert(
    Math.abs(report.total_usage_kwh - expectedTotalKwh) < 0.0001,
    `getUsageReport should return correct accumulated kWh: expected ${expectedTotalKwh.toFixed(4)}, got ${report.total_usage_kwh.toFixed(4)}`
  );
  assert(
    report.per_room_kwh[d1.room] > 0,
    'getUsageReport should show kWh breakdown for active room'
  );

  // Test 4: Alerts logic - After Hours Alert
  resetDevices();
  const originalGetHours = Date.prototype.getHours;
  
  // Mock time to 10 PM (22:00) which is after hours
  Date.prototype.getHours = () => 22;
  
  // Turn a device ON
  const activeDevice = devices[0];
  toggleDevice(activeDevice);
  
  evaluateAlerts();
  assert(
    alerts.some(a => a.type === 'after_hours' && a.device_id === activeDevice.id),
    'An after-hours alert should trigger when a device is ON at 10 PM'
  );

  // Restore getHours
  Date.prototype.getHours = originalGetHours;

  // Test 5: Alerts logic - Over Usage Alert
  resetDevices();
  evaluateAlerts();
  assert(
    !alerts.some(a => a.type === 'over_usage'),
    'No over-usage alerts should start active'
  );

  // Set all devices in Drawing Room to ON
  const roomName = 'Drawing Room';
  const drawDevices = devices.filter(d => d.room === roomName);
  drawDevices.forEach(d => toggleDevice(d));

  // Simulate all being ON for 3 hours
  const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
  
  // Set the onSince timestamps and evaluate
  import('./data/deviceStore.js').then((module) => {
    drawDevices.forEach(d => {
      module.onSince[d.id] = threeHoursAgo;
    });

    evaluateAlerts();
    assert(
      alerts.some(a => a.type === 'over_usage' && a.room === roomName),
      'An over-usage alert should trigger when all devices in a room are ON continuously for > 2 hours'
    );

    // Print summary
    console.log(`\n📊 Test Execution Summary: ${passed} passed, ${failed} failed.`);
    if (failed > 0) {
      process.exit(1);
    } else {
      console.log('🎉 All backend tests passed successfully!');
      process.exit(0);
    }
  });
}

runTests();
