// Copyright 2026 Oliver Weinrich
// SPDX-License-Identifier: Apache-2.0
import assert from 'node:assert/strict';
import { request, record } from './http-client.ts';
assert.equal(
  record((await request('http://plain.test/api')).body).identity,
  'two',
);
