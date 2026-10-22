// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { nextCheck } from '../../../src/certificates/schedule.js';

await test('certificate checks respect short lifetimes and avoid tight renewal loops', (): void => {
  const now = 1000000;
  assert.equal(nextCheck(now + 60000, now, 1000), now + 60000);
  assert.equal(nextCheck(now - 1000, now, 1000), now + 30000);
  assert.equal(nextCheck(now + 86400000, now, 1000), now + 12 * 3600000 + 1000);
});
