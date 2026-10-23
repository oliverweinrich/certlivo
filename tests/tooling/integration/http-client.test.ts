// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { channel } from 'node:diagnostics_channel';
import { ClientRequest, createServer } from 'node:http';
import { request } from '../../integration/http-client.ts';

const verifyEarlyResponse = async (truncate: boolean): Promise<void> => {
  const server = createServer((_incoming, response): void => {
    response.writeHead(413, { 'Content-Length': '5', Connection: 'close' });
    response.flushHeaders();
    setTimeout((): void => {
      if (truncate) response.destroy();
      else response.end('limit');
    }, 20);
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert(address && typeof address === 'object');
  const requests = channel('http.client.request.start');
  let injected = false;
  const inject = (message: unknown): void => {
    if (!message || typeof message !== 'object' || !('request' in message))
      return;
    const operation = message.request;
    if (!(operation instanceof ClientRequest) || operation.path !== '/early')
      return;
    operation.once('response', (): void => {
      injected = true;
      operation.emit(
        'error',
        Object.assign(new Error('Upload closed by peer'), { code: 'EPIPE' }),
      );
    });
  };
  requests.subscribe(inject);
  try {
    const result = request(`http://127.0.0.1:${address.port}/early`, {
      method: 'POST',
      body: 'upload',
    });
    if (truncate) await assert.rejects(result);
    else {
      const reply = await result;
      assert.equal(reply.status, 413);
      assert.equal(reply.body, 'limit');
    }
    assert(injected, 'The response/write-error ordering must be exercised');
  } finally {
    requests.unsubscribe(inject);
    server.closeAllConnections();
    await new Promise<void>((resolve) => {
      server.close((): void => {
        resolve();
      });
    });
  }
};
await test('a complete early HTTP rejection survives a later upload EPIPE', async (): Promise<void> =>
  verifyEarlyResponse(false));
await test('a truncated early HTTP rejection still fails', async (): Promise<void> =>
  verifyEarlyResponse(true));
await test('a connection failure without an HTTP response still fails', async (): Promise<void> => {
  const server = createServer((incoming): void => {
    incoming.socket.destroy();
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert(address && typeof address === 'object');
  try {
    await assert.rejects(
      request(`http://127.0.0.1:${address.port}/unavailable`),
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
