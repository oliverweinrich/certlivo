// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { connect } from 'node:net';
import { test } from 'node:test';
import { loadConfig } from '../../../src/config/index.js';
import { createProxy } from '../../../src/http/proxy.js';

for (const mode of ['fixed-length', 'chunked', 'stalled'])
  await test(`413 drains ${mode} input or closes within its deadline`, async (): Promise<void> => {
    const chunked = mode === 'chunked';
    const config = loadConfig((name): string => {
      if (name === 'MAX_BODY_SIZE') return '1k';
      if (name === 'ROUTES_JSON')
        return '[{"host":"example.test","path":"/","target":"http://127.0.0.1:1","tls":false}]';
      return '';
    });
    const route = config.routes[0];
    assert(route);
    const proxy = createProxy(config);
    let complete = false;
    const server = createServer((incoming, response): void => {
      incoming.once('end', (): void => {
        complete = incoming.complete;
      });
      void proxy.web(route, incoming, response, false);
    });
    await new Promise<void>((resolve) =>
      server.listen(0, '127.0.0.1', resolve),
    );
    const address = server.address();
    assert(address && typeof address === 'object');
    try {
      const text = await new Promise<string>((resolve, reject) => {
        const socket = connect(address.port, '127.0.0.1');
        let reply = '',
          sent = false;
        socket.setTimeout(3000, (): void => {
          socket.destroy(new Error('Rejection did not close within its bound'));
        });
        socket.once('error', reject);
        socket.once('connect', (): void => {
          socket.write(
            'POST / HTTP/1.1\r\nHost: example.test\r\n' +
              (chunked
                ? 'Transfer-Encoding: chunked'
                : 'Content-Length: 2048') +
              '\r\nConnection: close\r\n\r\n' +
              (chunked ? '401\r\n' + 'x'.repeat(1025) + '\r\n' : ''),
          );
        });
        socket.on('data', (data: Buffer): void => {
          reply += data.toString();
          if (sent || !reply.includes('\r\n\r\n')) return;
          sent = true;
          assert.equal(
            complete,
            false,
            'Rejection must precede upload completion',
          );
          setImmediate((): void => {
            if (mode !== 'stalled' && !socket.destroyed)
              socket.end(chunked ? '0\r\n\r\n' : 'x'.repeat(2048));
          });
        });
        socket.once('end', (): void => {
          resolve(reply);
        });
      });
      assert.match(text, /^HTTP\/1\.1 413 /);
      assert.equal(
        complete,
        mode !== 'stalled',
        'Pending input drains unless the deadline expires',
      );
    } finally {
      server.closeAllConnections();
      await new Promise<void>((resolve) => {
        server.close((): void => {
          resolve();
        });
      });
    }
  });
