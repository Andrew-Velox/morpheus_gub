// backend/utils/sse.js
// Server-Sent Events client registry.
// Keeps a Set of open response objects and pushes snapshots to all of them.

const clients = new Set();

// Attach an SSE connection. Sends an initial payload (caller-provided) so
// the dashboard can render immediately without waiting for the next tick.
export function attachSSE(req, res, initialPayload) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  if (initialPayload) {
    res.write(`data: ${JSON.stringify(initialPayload)}\n\n`);
  }

  clients.add(res);
  req.on('close', () => clients.delete(res));
}

// Push the same payload to every connected dashboard client.
export function broadcast(payload) {
  const frame = `data: ${JSON.stringify(payload)}\n\n`;
  for (const client of clients) client.write(frame);
}