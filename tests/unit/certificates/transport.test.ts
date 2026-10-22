// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createTransport } from '../../../src/certificates/transport.js';

await test('ACME transport rejects telemetry, cross-origin requests, HTTP and expired operations', async (): Promise<void> => {
  const request = createTransport(
    'https://issuer.invalid/directory',
    Date.now() + 60000,
  );
  for (const url of [
    'https://api.rootprojects.org/api/nonce',
    'https://other.invalid/order',
    'http://issuer.invalid/order',
  ])
    await assert.rejects(request({ url }), /outside configured issuer/);
  await assert.rejects(
    createTransport(
      'https://issuer.invalid',
      0,
    )({ url: 'https://issuer.invalid/order' }),
    /deadline/,
  );
});
