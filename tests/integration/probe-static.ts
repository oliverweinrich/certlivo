// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import assert from 'node:assert/strict';
import { request, record } from './http-client.ts';
const base = process.argv[2];
if (!base) throw new Error('Expected base URL');
for (const [prefix, title] of [
  ['/', 'website'],
  ['/docs/', 'docs'],
] as const) {
  const page = await request(base + prefix);
  assert.equal(page.status, 200);
  assert.equal(page.body, `<h1>${title}</h1>`);
  assert.match(String(page.headers['content-type']), /^text\/html/);
  const head = await request(base + prefix, { method: 'HEAD' });
  assert.equal(head.status, 200);
  assert.equal(head.body, '');
  assert.match(
    String(
      (await request(base + prefix + 'style.css')).headers['content-type'],
    ),
    /^text\/css/,
  );
  assert.equal((await request(base + prefix + 'nested/')).body, 'nested page');
  for (const [path, status] of [
    ['missing', 404],
    ['empty/', 403],
    ['.secret', 404],
    ['%2esecret', 404],
  ] as const)
    assert.equal((await request(base + prefix + path)).status, status);
  for (const path of ['escape.txt', 'escape-dir/private.txt']) {
    const response = await request(base + prefix + path);
    assert([403, 404].includes(response.status));
    assert(!response.body.includes('must never be served'));
  }
  assert.equal(
    (await request(base + prefix, { method: 'POST', body: 'write' })).status,
    403,
  );
  const partial = await request(base + prefix + 'style.css', {
    headers: { Range: 'bytes=0-3' },
  });
  assert.equal(partial.status, 206);
  assert.equal(partial.body, 'body');
  assert.equal(
    (
      await request(base + prefix, {
        headers: { 'If-None-Match': String(page.headers.etag) },
      })
    ).status,
    304,
  );
}
const redirect = await request(base + '/docs?x=1');
assert.equal(redirect.status, 308);
assert.equal(redirect.headers.location, base + '/docs/?x=1');
assert.equal((await request(base + '/docsx')).status, 404);
assert.equal(
  record((await request(base + '/api/users?x=1')).body).path,
  '/api/users',
);
process.stdout.write(
  'Mounted sites, MIME, ranges, conditional requests and file isolation passed\n',
);
