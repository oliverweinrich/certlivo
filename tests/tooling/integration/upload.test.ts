// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { test } from 'node:test';
import { request } from '../../integration/http-client.ts';

for (const chunked of [false, true])
  await test(`early rejection stops a ${chunked ? 'chunked' : 'fixed-length'} upload`, async (): Promise<void> => {
    const payload = Buffer.alloc(16 * 1024 * 1024);
    let received = 0;
    const server = createServer((incoming, response): void => {
      incoming.on('data', (chunk: Buffer): void => {
        received += chunk.length;
      });
      response.writeHead(413, { 'Content-Length': '5', Connection: 'close' });
      response.flushHeaders();
      setTimeout((): void => {
        response.end('limit');
      }, 20);
    });
    await new Promise<void>((resolve) =>
      server.listen(0, '127.0.0.1', resolve),
    );
    const address = server.address();
    assert(address && typeof address === 'object');
    try {
      const reply = await request(`http://127.0.0.1:${address.port}/limit`, {
        method: 'POST',
        body: chunked ? [payload] : payload,
      });
      assert.equal(reply.status, 413);
      assert.equal(reply.body, 'limit');
      assert(received < payload.length, 'Upload must stop after the rejection');
    } finally {
      server.closeAllConnections();
      await new Promise<void>((resolve) => {
        server.close((): void => {
          resolve();
        });
      });
    }
  });
