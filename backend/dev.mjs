// backend/dev.mjs
// Tiny process runner used by `npm run dev`.
// Spawns server.js + bot.js with their stdio inherited from the terminal so
// Node line-buffers output (live streaming) instead of block-buffering when
// stdout is a pipe (which is what `concurrently` does and why output stalls).
// Each process already labels itself (⚡ server / 🤖 bot) so no prefix needed.

import { spawn } from 'node:child_process';

const specs = [
  { name: 'server', cmd: 'node', args: ['server.js'] },
  { name: 'bot', cmd: 'node', args: ['bot.js'] },
];

const children = [];

function launch({ name, cmd, args }) {
  // stdio: 'inherit' => child writes straight to the real TTY => Node line-buffers.
  const child = spawn(cmd, args, { stdio: 'inherit' });
  child.on('exit', (code) => {
    console.log(`[${name}] exited with code ${code}`);
    children.forEach((c) => !c.killed && c.kill());
    process.exit(code ?? 0);
  });
  children.push(child);
}

specs.forEach(launch);

// Forward Ctrl-C to both children so they shut down cleanly.
process.on('SIGINT', () => {
  children.forEach((c) => !c.killed && c.kill('SIGINT'));
  setTimeout(() => process.exit(130), 200);
});