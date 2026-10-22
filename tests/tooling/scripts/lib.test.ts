// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { inventory } from '../../../scripts/inventory.ts';
await test('APK inventory preserves licenses, provenance and final records', (): void => {
  const result = inventory(
    'P:fixture\nV:1-r0\nL:MIT OR Apache-2.0\no:fixture\nc:abc\nA:x86_64\n',
  );
  assert.match(
    result,
    /fixture\t1-r0\tMIT OR Apache-2.0\tfixture\tabc\tx86_64$/,
  );
});
