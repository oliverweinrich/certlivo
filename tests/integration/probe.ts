// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import assert from 'node:assert/strict';
import { request, record } from './http-client.ts';
const base = process.argv[2];
if (!base) throw new Error('Expected base URL');
for (const method of [
  'GET',
  'HEAD',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'OPTIONS',
]) {
  const body = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)
    ? 'mutation'
    : '';
  const response = await request(base + '/api/users?x=1', {
    method,
    ...(body ? { body } : {}),
    headers: {
      Authorization: 'Bearer fixture-token',
      Cookie: 'session=fixture',
      'X-Forwarded-For': 'spoofed',
    },
  });
  assert.equal(response.status, 200, method);
  if (method === 'HEAD') {
    assert.equal(response.body, '');
    continue;
  }
  const result = record(response.body);
  assert.equal(result.method, method);
  assert.equal(result.path, '/api/users');
  assert.equal(result.query, 'x=1');
  assert.equal(result.body, body);
  assert.equal(result.authorization, 'Bearer fixture-token');
  assert.equal(result.cookie, 'session=fixture');
  assert.notEqual(result.forwarded_for, 'spoofed');
  assert.equal(result.proto, base.split(':')[0]);
  assert.equal(response.headers['cache-control'], 'no-store');
}
for (const [path, status] of [
  ['/apix', 404],
  ['/api', 200],
  ['/api/large-response', 502],
] as const)
  assert.equal((await request(base + path)).status, status);
assert.equal(
  (
    await request(base + '/api', {
      method: 'POST',
      body: Buffer.alloc(1024 * 1024 + 1),
    })
  ).status,
  413,
);
assert.equal(
  (await request(base + '/api', { headers: { 'X-Large': 'x'.repeat(24000) } }))
    .status,
  400,
);
for (const identity of ['alice', 'bob'])
  assert.equal(
    record(
      (await request(base + '/api', { headers: { Authorization: identity } }))
        .body,
    ).authorization,
    identity,
  );
assert.equal(
  record(
    (
      await request(base + '/api', {
        method: 'POST',
        body: [Buffer.from('chunk-one'), Buffer.from('chunk-two')],
      })
    ).body,
  ).body,
  'chunk-onechunk-two',
);
assert.equal(
  (
    await request(base + '/api', {
      method: 'POST',
      body: Array.from({ length: 17 }, () => Buffer.alloc(65536)),
    })
  ).status,
  413,
);
process.stdout.write(
  'Methods, identity headers, limits, caching and chunked uploads passed\n',
);
