// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
// Runs only against the disposable integration volume.
import {
  mkdirSync,
  readFileSync,
  writeFileSync,
  symlinkSync,
  rmSync,
} from 'node:fs';
const value: unknown = JSON.parse(
  readFileSync('/data/node-acme/staging/api.test.json', 'utf8'),
);
if (
  !value ||
  typeof value !== 'object' ||
  !('key' in value) ||
  !('cert' in value) ||
  typeof value.key !== 'string' ||
  typeof value.cert !== 'string'
)
  throw new Error('Invalid fixture certificate');
const root = '/data/acme/staging';
mkdirSync(root + '/archive/api.test', { recursive: true });
mkdirSync(root + '/live/api.test', { recursive: true });
writeFileSync(root + '/directory-url', 'https://pebble:14000/dir');
writeFileSync(root + '/archive/api.test/fullchain1.pem', value.cert, {
  mode: 0o600,
});
writeFileSync(root + '/archive/api.test/privkey1.pem', value.key, {
  mode: 0o600,
});
symlinkSync(
  '../../archive/api.test/fullchain1.pem',
  root + '/live/api.test/fullchain.pem',
);
symlinkSync(
  '../../archive/api.test/privkey1.pem',
  root + '/live/api.test/privkey.pem',
);
rmSync('/data/node-acme', { recursive: true });
