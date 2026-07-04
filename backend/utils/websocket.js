// backend/utils/websocket.js
// Minimal native WebSocket broadcaster for server-to-dashboard JSON snapshots.

import crypto from 'node:crypto';

const WS_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
const clients = new Set();

function encodeFrame(payload, opcode = 0x1) {
  const data = Buffer.from(payload);
  const length = data.length;
  let header;

  if (length < 126) {
    header = Buffer.alloc(2);
    header[1] = length;
  } else if (length < 65536) {
    header = Buffer.alloc(4);
    header[1] = 126;
    header.writeUInt16BE(length, 2);
  } else {
    header = Buffer.alloc(10);
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(length), 2);
  }

  header[0] = 0x80 | opcode;
  return Buffer.concat([header, data]);
}

function sendJson(socket, event, payload) {
  if (socket.destroyed) return;
  socket.write(encodeFrame(JSON.stringify({ event, payload })));
}

function sendClose(socket) {
  if (!socket.destroyed) socket.end(encodeFrame('', 0x8));
}

function handleClientFrame(socket, buffer) {
  const opcode = buffer[0] & 0x0f;
  if (opcode === 0x8) {
    clients.delete(socket);
    sendClose(socket);
    return;
  }

  if (opcode === 0x9) {
    socket.write(encodeFrame('', 0xA));
  }
}

export function attachWebSocket(server, options = {}) {
  const path = options.path || '/ws';

  server.on('upgrade', (req, socket) => {
    const { pathname } = new URL(req.url, 'http://localhost');
    if (pathname !== path) {
      socket.destroy();
      return;
    }

    const key = req.headers['sec-websocket-key'];
    if (!key) {
      socket.destroy();
      return;
    }

    const accept = crypto.createHash('sha1').update(`${key}${WS_GUID}`).digest('base64');
    socket.write(
      [
        'HTTP/1.1 101 Switching Protocols',
        'Upgrade: websocket',
        'Connection: Upgrade',
        `Sec-WebSocket-Accept: ${accept}`,
        '',
        '',
      ].join('\r\n')
    );

    clients.add(socket);
    socket.on('data', (buffer) => handleClientFrame(socket, buffer));
    socket.on('close', () => clients.delete(socket));
    socket.on('error', () => clients.delete(socket));

    if (typeof options.getInitialPayload === 'function') {
      sendJson(socket, 'snapshot', options.getInitialPayload());
    }
  });
}

export function broadcastWebSocket(event, payload) {
  for (const client of clients) {
    sendJson(client, event, payload);
  }
}

export function getWebSocketClientCount() {
  return clients.size;
}
