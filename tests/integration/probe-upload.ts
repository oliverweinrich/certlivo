// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import assert from 'node:assert/strict';
import { request } from './http-client.ts';

const base = process.argv[2];
const attempts = Number(process.argv[3] || '10');
if (!base || !Number.isSafeInteger(attempts) || attempts < 1 || attempts > 1000)
  throw new Error('Expected base URL and 1..1000 upload checks');
for (let attempt = 0; attempt < attempts; attempt++) {
  for (const body of [
    Buffer.alloc(1024 * 1024 + 1),
    Array.from({ length: 17 }, () => Buffer.alloc(65536)),
  ]) {
    const reply = await request(base + '/api', { method: 'POST', body });
    assert.equal(reply.status, 413);
    assert.equal(reply.body, '');
  }
}
process.stdout.write(
  `Repeated upload rejection passed (${attempts * 2} requests)\n`,
);
