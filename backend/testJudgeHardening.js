// backend/testJudgeHardening.js
// Judge-grade integration tests for REST, realtime, alerts, and Arduino ingest.

import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import net from 'node:net';
import { dirname } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

import { EXPECTED_DEVICE_COUNT, POWER_RATINGS, ROOMS } from './config/constants.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const HOST = '127.0.0.1';
const REQUEST_TIMEOUT_MS = 5000;
const SERVER_START_TIMEOUT_MS = 8000;

let passed = 0;

function assertUnique(values, label) {
  assert.equal(new Set(values).size, values.length, `${label} should not contain duplicates`);
}

async function step(name, fn) {
  await fn();
  passed += 1;
  console.log(`PASS: ${name}`);
}

async function getAvailablePort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, HOST, resolve);
  });

  const { port } = server.address();
  await new Promise((resolve) => server.close(resolve));
  return port;
}

function startBackend(port) {
  const child = spawn(process.execPath, ['server.js'], {
    cwd: __dirname,
    env: {
      ...process.env,
      PORT: String(port),
      CORS_ORIGIN: '*',
      SIMULATION_ENABLED: 'false',
      NODE_ENV: 'test',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const logs = [];
  child.stdout.on('data', (chunk) => logs.push(chunk.toString()));
  child.stderr.on('data', (chunk) => logs.push(chunk.toString()));

  return { child, logs, port, baseUrl: `http://${HOST}:${port}` };
}

async function waitForBackend(handle) {
  const deadline = Date.now() + SERVER_START_TIMEOUT_MS;
  let lastError;

  while (Date.now() < deadline) {
    if (handle.child.exitCode !== null) {
      throw new Error(`Backend exited early with code ${handle.child.exitCode}\n${handle.logs.join('')}`);
    }

    try {
      const res = await fetch(`${handle.baseUrl}/api/health`);
      if (res.ok) return;
    } catch (error) {
      lastError = error;
    }

    await delay(100);
  }

  throw new Error(`Backend did not become healthy: ${lastError?.message || 'timeout'}\n${handle.logs.join('')}`);
}

async function stopBackend(handle) {
  if (!handle?.child || handle.child.exitCode !== null) return;

  handle.child.kill();
  await Promise.race([
    once(handle.child, 'exit'),
    delay(2000).then(() => {
      if (handle.child.exitCode === null) handle.child.kill('SIGKILL');
    }),
  ]);
}

async function fetchJson(baseUrl, path, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const method = options.method || 'GET';
  const expectedStatus = options.expectedStatus || 200;
  const hasBody = Object.hasOwn(options, 'body');

  try {
    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers: hasBody ? { 'Content-Type': 'application/json' } : undefined,
      body: hasBody ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });
    const text = await res.text();
    const payload = text ? JSON.parse(text) : null;

    assert.equal(
      res.status,
      expectedStatus,
      `${method} ${path} should return ${expectedStatus}; got ${res.status}: ${text}`
    );

    return payload;
  } finally {
    clearTimeout(timer);
  }
}

async function readInitialSsePayload(baseUrl) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${baseUrl}/api/stream`, { signal: controller.signal });
    assert.equal(res.status, 200, 'SSE stream should connect successfully');
    assert.match(res.headers.get('content-type') || '', /text\/event-stream/);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let frame = '';

    while (!frame.includes('\n\n')) {
      const { value, done } = await reader.read();
      assert.equal(done, false, 'SSE stream should send an initial event');
      frame += decoder.decode(value, { stream: true });
    }

    const match = frame.match(/^data: (.*)$/m);
    assert.ok(match, `SSE frame should contain a data line, received: ${frame}`);
    await reader.cancel();
    return JSON.parse(match[1]);
  } finally {
    clearTimeout(timer);
    controller.abort();
  }
}

function parseWebSocketFrame(buffer) {
  if (buffer.length < 2) return null;

  const opcode = buffer[0] & 0x0f;
  const masked = Boolean(buffer[1] & 0x80);
  let length = buffer[1] & 0x7f;
  let offset = 2;

  if (length === 126) {
    if (buffer.length < 4) return null;
    length = buffer.readUInt16BE(2);
    offset = 4;
  } else if (length === 127) {
    if (buffer.length < 10) return null;
    length = Number(buffer.readBigUInt64BE(2));
    offset = 10;
  }

  let maskingKey;
  if (masked) {
    if (buffer.length < offset + 4) return null;
    maskingKey = buffer.subarray(offset, offset + 4);
    offset += 4;
  }

  if (buffer.length < offset + length) return null;

  const payload = Buffer.from(buffer.subarray(offset, offset + length));
  if (masked) {
    for (let i = 0; i < payload.length; i += 1) {
      payload[i] ^= maskingKey[i % 4];
    }
  }

  return {
    opcode,
    payload: payload.toString('utf8'),
    remaining: buffer.subarray(offset + length),
  };
}

async function readInitialWebSocketMessage(port) {
  const key = crypto.randomBytes(16).toString('base64');

  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host: HOST, port });
    const timer = setTimeout(() => {
      socket.destroy();
      reject(new Error('WebSocket initial snapshot timed out'));
    }, REQUEST_TIMEOUT_MS);

    let upgraded = false;
    let buffer = Buffer.alloc(0);

    function cleanup() {
      clearTimeout(timer);
      socket.destroy();
    }

    socket.on('connect', () => {
      socket.write(
        [
          'GET /ws HTTP/1.1',
          `Host: ${HOST}:${port}`,
          'Upgrade: websocket',
          'Connection: Upgrade',
          `Sec-WebSocket-Key: ${key}`,
          'Sec-WebSocket-Version: 13',
          '',
          '',
        ].join('\r\n')
      );
    });

    socket.on('data', (chunk) => {
      try {
        buffer = Buffer.concat([buffer, chunk]);

        if (!upgraded) {
          const headerEnd = buffer.indexOf('\r\n\r\n');
          if (headerEnd === -1) return;

          const headers = buffer.subarray(0, headerEnd).toString('utf8');
          assert.ok(headers.startsWith('HTTP/1.1 101'), `Unexpected WebSocket response:\n${headers}`);
          upgraded = true;
          buffer = buffer.subarray(headerEnd + 4);
        }

        const frame = parseWebSocketFrame(buffer);
        if (!frame) return;
        assert.equal(frame.opcode, 0x1, 'WebSocket initial frame should be text JSON');

        cleanup();
        resolve(JSON.parse(frame.payload));
      } catch (error) {
        cleanup();
        reject(error);
      }
    });

    socket.on('error', (error) => {
      cleanup();
      reject(error);
    });
  });
}

function roomDeviceCountMap(devices) {
  return devices.reduce((acc, device) => {
    acc[device.room] = (acc[device.room] || 0) + 1;
    return acc;
  }, {});
}

function countByType(devices, type) {
  return devices.filter((device) => device.type === type).length;
}

async function runSuite(handle) {
  const { baseUrl, port } = handle;

  await step('reset endpoint clears devices, alerts, and demo clock', async () => {
    const reset = await fetchJson(baseUrl, '/api/simulator/reset', {
      method: 'POST',
      body: {},
    });

    assert.equal(reset.ok, true);
    assert.equal(reset.clock.mode, 'realtime');
    assert.equal(reset.snapshot.metadata.device_count, EXPECTED_DEVICE_COUNT);
    assert.equal(reset.snapshot.alerts.length, 0);
  });

  await step('health and root metadata expose 15 simulated devices', async () => {
    const health = await fetchJson(baseUrl, '/api/health');
    const root = await fetchJson(baseUrl, '/');

    assert.equal(health.status, 'ok');
    assert.equal(health.device_count, EXPECTED_DEVICE_COUNT);
    assert.equal(health.expected_device_count, EXPECTED_DEVICE_COUNT);
    assert.equal(health.realtime.sse, true);
    assert.equal(health.realtime.websocket, true);
    assert.equal(root.ok, true);
    assert.equal(root.device_count, EXPECTED_DEVICE_COUNT);
  });

  await step('device registry keeps 3 lights and 2 fans per room', async () => {
    const { devices, count } = await fetchJson(baseUrl, '/api/devices');
    const perRoom = roomDeviceCountMap(devices);

    assert.equal(count, EXPECTED_DEVICE_COUNT);
    assertUnique(devices.map((device) => device.id), 'Device ids');
    assert.equal(countByType(devices, 'light'), ROOMS.length * 3);
    assert.equal(countByType(devices, 'fan'), ROOMS.length * 2);
    ROOMS.forEach((room) => assert.equal(perRoom[room], 5, `${room} should have exactly 5 devices`));
    assert.ok(devices.every((device) => device.status === false && device.currentWattage === 0));
  });

  await step('invalid REST inputs fail with useful 4xx responses', async () => {
    await fetchJson(baseUrl, '/api/rooms/not_a_room', { expectedStatus: 404 });
    await fetchJson(baseUrl, '/api/simulator/toggle/not_a_device', {
      method: 'POST',
      body: {},
      expectedStatus: 404,
    });
    await fetchJson(baseUrl, '/api/simulator/room/work_room_1', {
      method: 'POST',
      body: { status: 'maybe' },
      expectedStatus: 400,
    });
    await fetchJson(baseUrl, '/api/simulator/room/work_room_1', {
      method: 'POST',
      body: { status: 'on', onSinceHoursAgo: -1 },
      expectedStatus: 400,
    });
    await fetchJson(baseUrl, '/api/simulator/time', {
      method: 'POST',
      body: { currentTime: 'not-a-date' },
      expectedStatus: 400,
    });
    await fetchJson(baseUrl, '/api/ingest/arduino', {
      method: 'POST',
      body: { roomId: 'unknown_room', devices: [] },
      expectedStatus: 404,
    });
    await fetchJson(baseUrl, '/api/ingest/arduino', {
      method: 'POST',
      body: { roomId: 'work_room_1' },
      expectedStatus: 400,
    });
  });

  await step('all-on room power math triggers one deduplicated over-usage alert', async () => {
    await fetchJson(baseUrl, '/api/simulator/reset', { method: 'POST', body: {} });
    const update = await fetchJson(baseUrl, '/api/simulator/room/work_room_1', {
      method: 'POST',
      body: { status: 'on', onSinceHoursAgo: 3 },
    });

    assert.equal(update.room.currentWatts, POWER_RATINGS.fan * 2 + POWER_RATINGS.light * 3);
    assert.equal(update.room.onCount, 5);

    const first = await fetchJson(baseUrl, '/api/alerts');
    const second = await fetchJson(baseUrl, '/api/alerts');
    const keys = second.alerts.map((alert) => alert.key);

    assert.ok(first.alerts.some((alert) => alert.type === 'over_usage' && alert.room === 'Work Room 1'));
    assertUnique(keys, 'Active alert keys');
    assert.equal(keys.filter((key) => key === 'over_usage:work_room_1').length, 1);
  });

  await step('after-hours demo clock flags real device usage without alert spam', async () => {
    await fetchJson(baseUrl, '/api/simulator/reset', { method: 'POST', body: {} });
    await fetchJson(baseUrl, '/api/simulator/time', {
      method: 'POST',
      body: { currentTime: '2026-07-03T22:00:00+06:00' },
    });
    await fetchJson(baseUrl, '/api/simulator/toggle/work1_light_1', {
      method: 'POST',
      body: {},
    });

    const alerts = await fetchJson(baseUrl, '/api/alerts');
    const keys = alerts.alerts.map((alert) => alert.key);

    assert.ok(alerts.alerts.some((alert) => alert.type === 'after_hours' && alert.room === 'Work Room 1'));
    assertUnique(keys, 'After-hours alert keys');
    assert.equal(keys.filter((key) => key === 'after_hours:work_room_1').length, 1);
  });

  await step('Arduino ingest survives duplicates, unknown ids, and watt mismatches', async () => {
    await fetchJson(baseUrl, '/api/simulator/reset', { method: 'POST', body: {} });

    const duplicatePayload = {
      source: 'arduino_uno',
      roomId: 'work_room_1',
      roomTotalWatts: 165,
      devices: [
        { id: 'work1_light_1', type: 'light', status: 'on' },
        { id: 'work1_light_2', type: 'light', status: 'on' },
        { id: 'work1_light_3', type: 'light', status: 'on' },
        { id: 'work1_fan_1', type: 'fan', status: 'off' },
        { id: 'work1_fan_1', type: 'fan', status: 'on' },
        { id: 'work1_fan_2', type: 'fan', status: 'on' },
      ],
    };

    const duplicateResult = await fetchJson(baseUrl, '/api/ingest/arduino', {
      method: 'POST',
      body: duplicatePayload,
    });

    assert.deepEqual(duplicateResult.result.duplicateDeviceIds, ['work1_fan_1']);
    assert.equal(duplicateResult.result.unknownDeviceIds.length, 0);
    assert.equal(duplicateResult.result.updatedCount, 5);
    assert.equal(duplicateResult.result.actualRoomWatts, 165);
    assert.equal(duplicateResult.result.wattsMatch, true);

    const mismatch = await fetchJson(baseUrl, '/api/ingest/arduino', {
      method: 'POST',
      body: {
        roomId: 'work_room_1',
        roomTotalWatts: 999,
        devices: [
          { id: 'work1_light_1', status: 'on' },
          { id: 'work1_light_2', status: 'off' },
          { id: 'work1_light_3', status: 'off' },
          { id: 'work1_fan_1', status: 'off' },
          { id: 'work1_fan_2', status: 'off' },
          { id: 'alien_device', status: 'on' },
        ],
      },
    });

    assert.deepEqual(mismatch.result.unknownDeviceIds, ['alien_device']);
    assert.equal(mismatch.result.updatedCount, 5);
    assert.equal(mismatch.result.actualRoomWatts, 15);
    assert.equal(mismatch.result.wattsMatch, false);
  });

  await step('status and usage endpoints agree on office totals', async () => {
    const status = await fetchJson(baseUrl, '/api/status');
    const usage = await fetchJson(baseUrl, '/api/usage');

    const summaryWatts = status.summary.reduce((sum, room) => sum + room.currentWatts, 0);
    const roomWatts = Object.values(status.rooms)
      .flat()
      .reduce((sum, device) => sum + device.currentWattage, 0);

    assert.equal(status.usage.totalCurrentWatts, usage.totalCurrentWatts);
    assert.equal(summaryWatts, usage.totalCurrentWatts);
    assert.equal(roomWatts, usage.totalCurrentWatts);
  });

  await step('OpenAPI and dashboard snapshot contract stay available', async () => {
    const openapi = await fetchJson(baseUrl, '/openapi.json');
    const snapshot = await fetchJson(baseUrl, '/api/snapshot');

    assert.match(openapi.openapi, /^3\.0\./);
    assert.ok(openapi.paths['/api/health']);
    assert.equal(snapshot.metadata.device_count, EXPECTED_DEVICE_COUNT);
    assert.equal(snapshot.summary.length, ROOMS.length);
    assert.ok(Array.isArray(snapshot.alerts));
  });

  await step('SSE stream sends an immediate full dashboard payload', async () => {
    const payload = await readInitialSsePayload(baseUrl);

    assert.equal(payload.metadata.device_count, EXPECTED_DEVICE_COUNT);
    assert.equal(payload.summary.length, ROOMS.length);
    assert.ok(payload.rooms['Work Room 1']);
    assert.ok(Array.isArray(payload.alerts));
  });

  await step('WebSocket stream sends an immediate full dashboard payload', async () => {
    const message = await readInitialWebSocketMessage(port);

    assert.equal(message.event, 'snapshot');
    assert.equal(message.payload.metadata.device_count, EXPECTED_DEVICE_COUNT);
    assert.equal(message.payload.summary.length, ROOMS.length);
    assert.ok(message.payload.rooms['Work Room 1']);
  });
}

async function main() {
  const port = await getAvailablePort();
  const handle = startBackend(port);

  try {
    await waitForBackend(handle);
    await runSuite(handle);
    console.log(`\nJudge hardening summary: ${passed} scenarios passed.`);
  } finally {
    await stopBackend(handle);
  }
}

main().catch((error) => {
  console.error('\nJudge hardening failed.');
  console.error(error);
  process.exit(1);
});
