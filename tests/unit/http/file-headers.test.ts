// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { byteRange } from '../../../src/http/file-headers.js';

await test('static byte ranges handle prefixes, suffixes and unsatisfiable requests', (): void => {
  assert.deepEqual(byteRange('bytes=0-3', 10), { start: 0, end: 3 });
  assert.deepEqual(byteRange('bytes=-3', 10), { start: 7, end: 9 });
  assert.deepEqual(byteRange('bytes=5-', 10), { start: 5, end: 9 });
  assert.equal(byteRange('bytes=10-', 10), null);
  assert.equal(byteRange('bytes=8-3', 10), null);
  assert.equal(byteRange('bytes=-0', 10), null);
  assert.equal(byteRange('bytes=0-1,3-4', 10), null);
});
