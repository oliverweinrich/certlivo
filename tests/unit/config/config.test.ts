// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadConfig } from '../../../src/config/load.js';
import { matchRoute } from '../../../src/config/routes.js';
import type { Config } from '../../../src/config/types.js';

const proxy = {
  host: 'example.com',
  path: '/api',
  target: 'http://api:3000',
  tls: false,
};
const config = (
  routes: readonly object[],
  environment: Readonly<Record<string, string>> = {},
): Config =>
  loadConfig((key): string =>
    key === 'ROUTES_JSON' ? JSON.stringify(routes) : environment[key] || '',
  );

await test('mounted sites and proxy routes coexist with boundary-aware longest prefix matching', (): void => {
  const c = config([
    proxy,
    { ...proxy, path: '/', target: 'file:///sites/website' },
  ]);
  assert.equal(
    matchRoute(c.routes, 'example.com', '/api/users')?.kind,
    'proxy',
  );
  assert.equal(matchRoute(c.routes, 'example.com', '/apix')?.kind, 'static');
  assert.equal(matchRoute(c.routes, 'other.test', '/'), undefined);
  assert.equal(c.headerSize, 16384);
});
await test('ambiguous, unsafe and incomplete routes are rejected', (): void => {
  const invalid: readonly object[] = [
    { ...proxy, tls: undefined },
    { ...proxy, tls: 'false' },
    { ...proxy, typo: 1 },
    { ...proxy, host: 'example.com;return' },
    { ...proxy, path: '/api;return' },
    { ...proxy, target: 'http://api:3000/foo' },
    { ...proxy, target: 'http://user:pass@api:3000' },
    { ...proxy, target: 'file:///data/acme' },
    { ...proxy, target: 'file:///sites/web/../private' },
    { ...proxy, target: 'file:///sites/web/%2e%2e/private' },
    { ...proxy, target: 'file:///sites/.hidden' },
  ];
  for (const route of invalid) assert.throws((): Config => config([route]));
  assert.throws((): Config => config([proxy, proxy]));
  assert.throws((): Config =>
    config([proxy, { ...proxy, path: '/', tls: true }]),
  );
});
await test('TLS requires explicit consent and valid contact; CA environments stay separate', (): void => {
  assert.throws((): Config => config([{ ...proxy, tls: true }]));
  const c = config([{ ...proxy, tls: true }], {
    ACME_EMAIL: 'admin@example.com',
    ACME_AGREE_TOS: 'true',
    ACME_ENV: 'staging',
  });
  assert.match(c.directory, /acme-staging/);
  assert.throws((): Config =>
    config([proxy], { ACME_DIRECTORY_URL: 'http://ca.test/dir' }),
  );
});
await test('buffer and body limits reject unbounded or excessive values', (): void => {
  for (const environment of [
    { MAX_BODY_SIZE: '0' },
    { CLIENT_HEADER_BUFFER_SIZE: '1m' },
    { UPSTREAM_HEADER_BUFFER_SIZE: '129k' },
    { LOG_LEVEL: 'trace' },
    { DOMAINS: 'old.test' },
  ])
    assert.throws((): Config => config([proxy], environment));
});
