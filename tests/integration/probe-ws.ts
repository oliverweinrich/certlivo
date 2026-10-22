// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import assert from 'node:assert/strict';

const socket = new WebSocket((process.argv[2] || '') + '/api/socket?x=1');
await new Promise<void>((resolve, reject) => {
  const timeout = setTimeout(() => {
    socket.close();
    reject(new Error('WebSocket timeout'));
  }, 10000);
  socket.addEventListener('open', () => {
    socket.send('fixture-message');
  });
  socket.addEventListener('error', () => {
    clearTimeout(timeout);
    reject(new Error('WebSocket failed'));
  });
  socket.addEventListener('message', (message) => {
    clearTimeout(timeout);
    assert.equal(message.data, 'fixture-message');
    socket.close();
    resolve();
  });
});
process.stdout.write('WebSocket handshake and message forwarding passed\n');
