// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
// Disposable integration fixture; not included in the gateway runtime.
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';

const server = createServer(
  { maxHeaderSize: 128 * 1024 },
  (request, response) => {
    const chunks: Buffer[] = [];
    request.on('data', (chunk: Buffer) => chunks.push(chunk));
    request.on('end', () => {
      const url = new URL(request.url || '/', 'http://fixture');
      const body = JSON.stringify({
        method: request.method,
        path: url.pathname,
        query: url.search.slice(1),
        body: Buffer.concat(chunks).toString(),
        authorization: request.headers.authorization,
        forwarded_for: request.headers['x-forwarded-for'],
        proto: request.headers['x-forwarded-proto'],
        cookie: request.headers.cookie,
        identity: process.env.IDENTITY || 'one',
      });
      response.setHeader('Content-Type', 'application/json');
      response.setHeader('Cache-Control', 'no-store');
      if (url.pathname === '/api/large-response')
        response.setHeader('X-Large', 'x'.repeat(24000));
      response.setHeader('Content-Length', Buffer.byteLength(body));
      response.end(request.method === 'HEAD' ? undefined : body);
    });
  },
);
server.on('upgrade', (request, socket) => {
  const key = request.headers['sec-websocket-key'];
  if (!key) {
    socket.destroy();
    return;
  }
  const accept = createHash('sha1')
    .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
    .digest('base64');
  socket.write(
    'HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ' +
      accept +
      '\r\n\r\n',
  );
  let incoming = Buffer.alloc(0);
  socket.on('data', (chunk) => {
    incoming = Buffer.concat([incoming, chunk]);
    if (incoming.length < 6) return;
    const size = (incoming[1] || 0) & 0x7f;
    if (size > 125 || incoming.length < size + 6) return;
    if (((incoming[0] || 0) & 0x0f) === 8) {
      socket.end(Buffer.from([0x88, 0]));
      return;
    }
    const mask = incoming.subarray(2, 6);
    const payload = incoming
      .subarray(6, 6 + size)
      .map((value, index) => value ^ (mask[index % 4] || 0));
    socket.write(Buffer.concat([Buffer.from([0x81, size]), payload]));
    incoming = incoming.subarray(size + 6);
  });
  socket.on('error', () => socket.destroy());
});
server.listen(3000, '0.0.0.0');
